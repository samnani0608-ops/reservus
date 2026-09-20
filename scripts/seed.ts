import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { Database } from "../types/database";

type SeedUser = {
  email: string;
  role: "member" | "admin";
};

const seedUsers: SeedUser[] = [
  { email: "member1@reservus.local", role: "member" },
  { email: "member2@reservus.local", role: "member" },
  { email: "admin@reservus.local", role: "admin" },
];

const seedRooms = [
  { name: "Sala Norte", capacity: 4, is_active: true },
  { name: "Sala Centro", capacity: 8, is_active: true },
  { name: "Sala Sur", capacity: 12, is_active: true },
];

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable ${name}. Revisá .env.example.`);
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

async function findOrCreateUser(
  supabase: SupabaseClient<Database>,
  seedUser: SeedUser,
  password: string,
): Promise<User> {
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const existing = userList.users.find((user) => user.email === seedUser.email);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: seedUser.email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error(`No se pudo crear ${seedUser.email}.`);
  }
  return data.user;
}

async function main() {
  const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const password = requireEnv("SEED_USER_PASSWORD");

  const users = new Map<string, User>();
  for (const seedUser of seedUsers) {
    const user = await findOrCreateUser(supabase, seedUser, password);
    users.set(seedUser.email, user);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      role: seedUser.role,
    });
    if (error) throw error;
  }

  const { data: existingRooms, error: roomReadError } = await supabase
    .from("rooms")
    .select("id, name")
    .in("name", seedRooms.map((room) => room.name));
  if (roomReadError) throw roomReadError;

  for (const room of seedRooms) {
    const existing = existingRooms?.find((candidate) => candidate.name === room.name);
    if (existing) {
      const { error } = await supabase
        .from("rooms")
        .update({ capacity: room.capacity, is_active: true })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("rooms").insert(room);
      if (error) throw error;
    }
  }

  const { data: rooms, error: finalRoomError } = await supabase
    .from("rooms")
    .select("id, name")
    .in("name", seedRooms.map((room) => room.name));
  if (finalRoomError || !rooms || rooms.length < 3) {
    throw finalRoomError ?? new Error("No se pudieron preparar las 3 salas.");
  }

  const roomByName = new Map(rooms.map((room) => [room.name, room.id]));
  const getRoomId = (name: string) => {
    const roomId = roomByName.get(name);
    if (!roomId) throw new Error(`No se encontró la sala ${name}.`);
    return roomId;
  };
  const monday = getNextMonday();
  const member1 = users.get("member1@reservus.local");
  const member2 = users.get("member2@reservus.local");
  const admin = users.get("admin@reservus.local");
  if (!member1 || !member2 || !admin) throw new Error("Faltan usuarios del seed.");

  const slots = [
    [member1.id, "Sala Norte", "08:00", "09:00"],
    [member2.id, "Sala Norte", "09:30", "10:30"],
    [admin.id, "Sala Norte", "11:00", "12:00"],
    [member1.id, "Sala Centro", "08:00", "09:00"],
    [member2.id, "Sala Centro", "09:30", "10:30"],
    [admin.id, "Sala Centro", "11:00", "12:00"],
    [member1.id, "Sala Sur", "08:00", "09:00"],
    [member2.id, "Sala Sur", "09:30", "10:30"],
    [admin.id, "Sala Sur", "11:00", "12:00"],
    [admin.id, "Sala Sur", "13:00", "14:00"],
  ] as const;

  const rangeEndDate = new Date(`${monday}T12:00:00Z`);
  rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + 1);
  const { error: cleanupError } = await supabase
    .from("reservations")
    .delete()
    .in("user_id", [member1.id, member2.id, admin.id])
    .gte("start_at", `${monday}T00:00:00-06:00`)
    .lt("start_at", `${rangeEndDate.toISOString().slice(0, 10)}T00:00:00-06:00`);
  if (cleanupError) throw cleanupError;

  const reservations = slots.map(([userId, roomName, start, end]) => ({
    user_id: userId,
    room_id: getRoomId(roomName),
    start_at: `${monday}T${start}:00-06:00`,
    end_at: `${monday}T${end}:00-06:00`,
  }));
  const { error: reservationError } = await supabase
    .from("reservations")
    .insert(reservations);
  if (reservationError) throw reservationError;

  console.log("Seed completado: 3 salas, 2 members, 1 admin y 10 reservas.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
