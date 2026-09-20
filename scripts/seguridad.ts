import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/database";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name}. Revisá .env.example.`);
  return value;
}

function getNextMonday() {
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const today = new Date(`${todayKey}T12:00:00Z`);
  const daysUntilMonday = (8 - today.getUTCDay()) % 7 || 7;
  today.setUTCDate(today.getUTCDate() + daysUntilMonday);
  return today.toISOString().slice(0, 10);
}

async function main() {
  const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: requireEnv("SECURITY_TEST_EMAIL"),
    password: requireEnv("SECURITY_TEST_PASSWORD"),
  });
  if (authError || !authData.user) throw authError ?? new Error("No se pudo autenticar.");

  const roomId = requireEnv("SECURITY_TEST_ROOM_ID");
  const otherUserId = requireEnv("SECURITY_OTHER_USER_ID");
  const otherReservationId = requireEnv("SECURITY_OTHER_RESERVATION_ID");
  const results: Array<{ name: string; protected: boolean; detail: string }> = [];

  const directInsert = await supabase.from("reservations").insert({
    user_id: otherUserId,
    room_id: roomId,
    start_at: "2099-01-01T08:00:00-06:00",
    end_at: "2099-01-01T09:00:00-06:00",
  }).select("id");
  results.push({
    name: "Member crea reserva para otro user_id",
    protected: Boolean(directInsert.error),
    detail: directInsert.error?.message ?? "La inserción fue aceptada",
  });

  const roomInsert = await supabase.from("rooms").insert({
    name: "Intento no autorizado",
    capacity: 1,
  });
  results.push({
    name: "Member crea sala",
    protected: Boolean(roomInsert.error),
    detail: roomInsert.error?.message ?? "La creación fue aceptada",
  });

  const roomUpdate = await supabase
    .from("rooms")
    .update({ name: "Intento no autorizado" })
    .eq("id", roomId)
    .select("id");
  results.push({
    name: "Member edita sala",
    protected: Boolean(roomUpdate.error) || (roomUpdate.data?.length ?? 0) === 0,
    detail: roomUpdate.error?.message ?? `${roomUpdate.data?.length ?? 0} filas modificadas`,
  });

  const roomDelete = await supabase.from("rooms").delete().eq("id", roomId).select("id");
  results.push({
    name: "Member elimina sala",
    protected: Boolean(roomDelete.error) || (roomDelete.data?.length ?? 0) === 0,
    detail: roomDelete.error?.message ?? `${roomDelete.data?.length ?? 0} filas eliminadas`,
  });

  const roleUpdate = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", authData.user.id)
    .select("id");
  results.push({
    name: "Member cambia su rol",
    protected: Boolean(roleUpdate.error) || (roleUpdate.data?.length ?? 0) === 0,
    detail: roleUpdate.error?.message ?? `${roleUpdate.data?.length ?? 0} filas modificadas`,
  });

  const reservationRead = await supabase
    .from("reservations")
    .select("id")
    .eq("id", otherReservationId);
  results.push({
    name: "Member lee reserva ajena",
    protected: Boolean(reservationRead.error) || (reservationRead.data?.length ?? 0) === 0,
    detail: reservationRead.error?.message ?? `${reservationRead.data?.length ?? 0} filas visibles`,
  });

  const reservationUpdate = await supabase
    .from("reservations")
    .update({ cancel_reason: "Intento no autorizado" })
    .eq("id", otherReservationId)
    .select("id");
  results.push({
    name: "Member edita reserva directamente",
    protected: Boolean(reservationUpdate.error) || (reservationUpdate.data?.length ?? 0) === 0,
    detail:
      reservationUpdate.error?.message ??
      `${reservationUpdate.data?.length ?? 0} filas modificadas`,
  });

  const reservationDelete = await supabase
    .from("reservations")
    .delete()
    .eq("id", otherReservationId)
    .select("id");
  results.push({
    name: "Member elimina reserva directamente",
    protected: Boolean(reservationDelete.error) || (reservationDelete.data?.length ?? 0) === 0,
    detail:
      reservationDelete.error?.message ??
      `${reservationDelete.data?.length ?? 0} filas eliminadas`,
  });

  const monday = getNextMonday();
  const weeklyReservationIds: string[] = [];
  const weeklySlots = [
    ["15:00", "16:00"],
    ["16:00", "17:00"],
    ["17:00", "18:00"],
    ["18:00", "19:00"],
  ] as const;
  const weeklyAttempts = [];

  for (const [start, end] of weeklySlots) {
    const attempt = await supabase.rpc("create_reservation", {
      p_room_id: roomId,
      p_start_at: `${monday}T${start}:00-06:00`,
      p_end_at: `${monday}T${end}:00-06:00`,
    });
    weeklyAttempts.push(attempt);
    if (!attempt.error && typeof attempt.data === "string") {
      weeklyReservationIds.push(attempt.data);
    }
  }

  const firstThreeCreated = weeklyAttempts.slice(0, 3).every((attempt) => !attempt.error);
  const fourthRejected = Boolean(weeklyAttempts[3]?.error);
  results.push({
    name: "Member intenta superar 3 reservas semanales",
    protected: firstThreeCreated && fourthRejected,
    detail: firstThreeCreated
      ? weeklyAttempts[3]?.error?.message ?? "La cuarta reserva fue aceptada"
      : "La cuenta o sala de prueba no estaba limpia para crear las primeras 3 reservas",
  });

  const ownReservationId = weeklyReservationIds[0];
  if (ownReservationId) {
    const ownUpdate = await supabase
      .from("reservations")
      .update({ cancel_reason: "Intento directo sobre reserva propia" })
      .eq("id", ownReservationId)
      .select("id");
    results.push({
      name: "Member edita su reserva directamente",
      protected: Boolean(ownUpdate.error) || (ownUpdate.data?.length ?? 0) === 0,
      detail: ownUpdate.error?.message ?? `${ownUpdate.data?.length ?? 0} filas modificadas`,
    });

    const ownDelete = await supabase
      .from("reservations")
      .delete()
      .eq("id", ownReservationId)
      .select("id");
    results.push({
      name: "Member elimina su reserva directamente",
      protected: Boolean(ownDelete.error) || (ownDelete.data?.length ?? 0) === 0,
      detail: ownDelete.error?.message ?? `${ownDelete.data?.length ?? 0} filas eliminadas`,
    });
  } else {
    results.push({
      name: "Escritura directa sobre reserva propia",
      protected: false,
      detail: "No se pudo crear una reserva propia para ejecutar la comprobación",
    });
  }

  for (const reservationId of weeklyReservationIds) {
    const { error } = await supabase.rpc("cancel_reservation", {
      p_reservation_id: reservationId,
      p_reason: "Limpieza de la prueba de seguridad",
    });
    if (error) console.warn(`No se pudo limpiar ${reservationId}: ${error.message}`);
  }

  const nextDate = new Date();
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const date = nextDate.toISOString().slice(0, 10);
  const outsideHours = await supabase.rpc("create_reservation", {
    p_room_id: roomId,
    p_start_at: `${date}T22:00:00-06:00`,
    p_end_at: `${date}T23:00:00-06:00`,
  });
  results.push({
    name: "Reserva fuera de horario",
    protected: Boolean(outsideHours.error),
    detail: outsideHours.error?.message ?? "La reserva fue aceptada",
  });

  const cancelOther = await supabase.rpc("cancel_reservation", {
    p_reservation_id: otherReservationId,
    p_reason: "Intento de bypass",
  });
  results.push({
    name: "Member cancela reserva ajena",
    protected: Boolean(cancelOther.error),
    detail: cancelOther.error?.message ?? "La cancelación fue aceptada",
  });

  results.forEach((result) => {
    console.log(`${result.protected ? "OK" : "FALLO"} - ${result.name}: ${result.detail}`);
  });
  const failures = results.filter((result) => !result.protected);
  if (failures.length > 0) {
    throw new Error(`${failures.length} intento(s) de bypass no fueron bloqueados.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
