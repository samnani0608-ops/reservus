import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: rooms, error: roomsError }, { data: profile }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, capacity, is_active")
      .eq("is_active", true)
      .order("name"),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const roomList = rooms ?? [];
  const isAdmin = profile?.role === "admin";

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="grid gap-8 border-b border-white/8 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Panel de espacios</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">
            Elegí una sala.<br />El horario viene después.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
            Sesión activa como <span className="font-semibold text-slate-200">{user.email}</span>. Consultá disponibilidad antes de crear tu reserva.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-36 rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-3xl font-black text-white">{roomList.length}</p>
            <p className="mt-1 text-xs text-slate-500">salas disponibles</p>
          </div>
          <div className="min-w-36 rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-sm font-black uppercase tracking-wider text-emerald-300">{isAdmin ? "Admin" : "Member"}</p>
            <p className="mt-2 text-xs text-slate-500">perfil de acceso</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs text-slate-600">01 / ESPACIOS</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Salas activas</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/reservations" className="rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-bold text-slate-200 hover:border-emerald-300/30 hover:text-emerald-200">
              Ver mis reservas
            </Link>
            {isAdmin && (
              <Link href="/admin" className="rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-950 hover:bg-emerald-200">
                Abrir administración
              </Link>
            )}
          </div>
        </div>

        {roomsError && (
          <p role="alert" className="mt-7 rounded-xl border border-rose-300/15 bg-rose-300/7 p-4 text-sm text-rose-200">
            No se pudieron cargar las salas.
          </p>
        )}

        {!roomsError && roomList.length === 0 && (
          <div className="mt-7 rounded-2xl border border-dashed border-white/12 p-10 text-center text-slate-500">
            No hay salas disponibles en este momento.
          </div>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roomList.map((room, index) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/9 bg-[#0c121a]/85 p-6 hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-[#101923]"
            >
              <div className="absolute right-5 top-4 font-mono text-xs text-slate-700">{String(index + 1).padStart(2, "0")}</div>
              <div className="grid size-11 place-items-center rounded-xl border border-white/8 bg-white/4 text-lg font-black text-emerald-300">
                {room.name.slice(0, 1).toUpperCase()}
              </div>
              <h3 className="mt-7 text-xl font-bold text-white">{room.name}</h3>
              <p className="mt-2 text-sm text-slate-500">Hasta {room.capacity} personas</p>
              <div className="mt-7 flex items-center justify-between border-t border-white/7 pt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Ver disponibilidad
                <span className="text-lg text-emerald-300 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
