"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Verifica que el usuario actual sea admin. Lanza redirect si no lo es.
async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

// Tipos de retorno para las Server Actions.
export type AdminActionState = {
  success: boolean;
  error: string | null;
};

export type Room = {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
};

export type ReservationWithDetails = {
  id: string;
  room_id: string;
  room_name: string;
  user_id: string;
  start_at: string;
  end_at: string;
  status: "active" | "cancelled";
  cancel_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export type ReservationFilters = {
  room_id?: string;
  user_id?: string;
  status?: "active" | "cancelled" | "all";
  date_from?: string; // AAAA-MM-DD
  date_to?: string;   // AAAA-MM-DD
};

// Esquema para crear/editar sala.
const roomSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  capacity: z.coerce.number().int().positive("La capacidad debe ser mayor a 0"),
  is_active: z.coerce.boolean(),
});

// Esquema para cancelación admin (requiere motivo).
const cancelAdminSchema = z.object({
  reservation_id: z.string().uuid("ID de reserva inválido"),
  reason: z.string().min(1, "El administrador debe indicar un motivo"),
});

// Lista todas las salas (incluye inactivas).
export async function listRooms(): Promise<Room[]> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, capacity, is_active, created_at")
    .order("name");

  if (error) {
    throw new Error("No se pudieron cargar las salas.");
  }

  return data ?? [];
}

// Crea una nueva sala.
export async function createRoom(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const result = roomSchema.safeParse({
    name: formData.get("name"),
    capacity: formData.get("capacity"),
    is_active: formData.get("is_active") === "true",
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { error } = await supabase
    .from("rooms")
    .insert({
      name: result.data.name,
      capacity: result.data.capacity,
      is_active: result.data.is_active,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, error: null };
}

// Actualiza una sala (nombre, capacidad, estado activo).
export async function updateRoom(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const idResult = z.string().uuid().safeParse(formData.get("room_id"));

  if (!idResult.success) {
    return { success: false, error: "ID de sala inválido" };
  }

  const result = roomSchema.safeParse({
    name: formData.get("name"),
    capacity: formData.get("capacity"),
    is_active: formData.get("is_active") === "true",
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { error } = await supabase
    .from("rooms")
    .update({
      name: result.data.name,
      capacity: result.data.capacity,
      is_active: result.data.is_active,
    })
    .eq("id", idResult.data);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, error: null };
}

// Lista reservas con filtros opcionales.
export async function listReservations(
  filters: ReservationFilters
): Promise<ReservationWithDetails[]> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  let query = supabase
    .from("reservations")
    .select(`
      id,
      room_id,
      rooms!inner(name),
      user_id,
      start_at,
      end_at,
      status,
      cancel_reason,
      cancelled_at,
      created_at
    `)
    .order("start_at", { ascending: false });

  if (filters.room_id) {
    query = query.eq("room_id", filters.room_id);
  }
  if (filters.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.date_from) {
    // Inicio del día en Costa Rica.
    query = query.gte(
      "start_at",
      `${filters.date_from}T00:00:00-06:00`
    );
  }
  if (filters.date_to) {
    // Fin del día en Costa Rica (inicio del día siguiente).
    const nextDay = new Date(`${filters.date_to}T00:00:00-06:00`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    query = query.lt("start_at", nextDay.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("No se pudieron cargar las reservas.");
  }

  // profiles no almacena correo; mostramos el UUID sin exponer auth.users.
  return (data ?? []).map((reservation) => ({
    id: reservation.id,
    room_id: reservation.room_id,
    room_name: reservation.rooms.name,
    user_id: reservation.user_id,
    start_at: reservation.start_at,
    end_at: reservation.end_at,
    status: reservation.status,
    cancel_reason: reservation.cancel_reason,
    cancelled_at: reservation.cancelled_at,
    created_at: reservation.created_at,
  }));
}

// Cancelación por administrador (requiere motivo).
export async function cancelReservationAdmin(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const result = cancelAdminSchema.safeParse({
    reservation_id: formData.get("reservation_id"),
    reason: formData.get("reason"),
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { error } = await supabase.rpc("cancel_reservation", {
    p_reservation_id: result.data.reservation_id,
    p_reason: result.data.reason,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, error: null };
}
