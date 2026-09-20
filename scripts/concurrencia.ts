import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/database";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name}. Revisá .env.example.`);
  return value;
}

async function main() {
  const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: requireEnv("CONCURRENCY_TEST_EMAIL"),
    password: requireEnv("CONCURRENCY_TEST_PASSWORD"),
  });
  if (authError) throw authError;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .single();
  if (profileError || profile?.role !== "admin") {
    throw new Error("La prueba de concurrencia requiere una cuenta admin.");
  }

  const roomId = requireEnv("CONCURRENCY_TEST_ROOM_ID");
  const startAt = requireEnv("CONCURRENCY_START_AT");
  const endAt = requireEnv("CONCURRENCY_END_AT");
  const startTime = new Date(startAt).getTime();
  if (!Number.isFinite(startTime) || startTime < Date.now() + 2 * 60 * 60 * 1000) {
    throw new Error("CONCURRENCY_START_AT debe dejar al menos 2 horas para poder limpiar.");
  }
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      supabase.rpc("create_reservation", {
        p_room_id: roomId,
        p_start_at: startAt,
        p_end_at: endAt,
      }),
    ),
  );

  const successes = results.filter((result) => !result.error);
  const rejections = results.filter((result) => result.error);
  const overlapRejections = rejections.filter(
    (result) =>
      result.error?.code === "23P01" ||
      result.error?.message.includes("reservations_no_overlap"),
  );
  console.log(`Resultados: ${successes.length} éxito(s), ${rejections.length} rechazo(s).`);
  rejections.forEach((result, index) => {
    console.log(`Rechazo ${index + 1}: ${result.error?.message}`);
  });

  for (const success of successes) {
    const reservationId = success.data;
    if (typeof reservationId !== "string") continue;
    const { error: cleanupError } = await supabase.rpc("cancel_reservation", {
      p_reservation_id: reservationId,
      p_reason: "Limpieza de la prueba de concurrencia",
    });
    if (cleanupError) throw new Error(`No se pudo limpiar la reserva: ${cleanupError.message}`);
  }

  if (successes.length !== 1 || overlapRejections.length !== 9) {
    throw new Error("La prueba falló: se esperaba 1 éxito y 9 conflictos de solape.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
