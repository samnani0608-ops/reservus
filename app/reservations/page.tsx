import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CancelReservationForm from "./cancel-reservation-form";

const costaRicaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Costa_Rica",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const reservationDateFormatter = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const reservationTimeFormatter = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getCostaRicaDateKey(value: Date) {
  return costaRicaDateFormatter.format(value);
}

function getCurrentWeekRange() {
  const todayKey = getCostaRicaDateKey(new Date());
  const today = new Date(`${todayKey}T12:00:00Z`);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() - mondayOffset);
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
  return { start: monday.toISOString().slice(0, 10), end: nextMonday.toISOString().slice(0, 10) };
}

type ReservationItem = {
  id: string;
  start_at: string;
  end_at: string;
  status: "active" | "cancelled";
  cancel_reason: string | null;
  rooms: { name: string } | null;
};

function ReservationList({
  title,
  eyebrow,
  reservations,
  now,
  reasonRequired,
}: {
  title: string;
  eyebrow: string;
  reservations: ReservationItem[];
  now: number;
  reasonRequired: boolean;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-slate-600">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
        </div>
        <span className="text-xs font-semibold text-slate-600">{reservations.length} registro(s)</span>
      </div>

      {reservations.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">No hay reservas en esta sección.</div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {reservations.map((reservation) => {
            const start = new Date(reservation.start_at);
            const end = new Date(reservation.end_at);
            const canCancel = reservation.status === "active" && start.getTime() >= now + 2 * 60 * 60 * 1000;
            const isInProgress = reservation.status === "active" && start.getTime() < now && end.getTime() > now;

            return (
              <article key={reservation.id} className="rounded-2xl border border-white/9 bg-[#0c121a]/85 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{reservation.rooms?.name ?? "Sala no disponible"}</h3>
                    <p className="mt-2 text-sm capitalize text-slate-400">{reservationDateFormatter.format(start)}</p>
                    <p className="mt-1 font-mono text-sm text-slate-400">
                      {reservationTimeFormatter.format(start)} — {reservationTimeFormatter.format(end)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                    reservation.status === "cancelled"
                      ? "border-slate-400/15 bg-slate-400/8 text-slate-400"
                      : isInProgress
                        ? "border-sky-300/20 bg-sky-300/8 text-sky-200"
                        : "border-emerald-300/20 bg-emerald-300/8 text-emerald-300"
                  }`}>
                    {reservation.status === "cancelled" ? "Cancelada" : isInProgress ? "En curso" : "Activa"}
                  </span>
                </div>

                {reservation.cancel_reason && (
                  <p className="mt-4 rounded-xl bg-white/3 p-3 text-sm leading-6 text-slate-400">
                    <span className="font-semibold text-slate-400">Motivo:</span> {reservation.cancel_reason}
                  </p>
                )}

                {reservation.status === "active" && start.getTime() > now && (
                  <div className="mt-5 border-t border-white/7 pt-5">
                    <CancelReservationForm reservationId={reservation.id} canCancel={canCancel} reasonRequired={reasonRequired} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function ReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data, error }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("reservations")
      .select("id, start_at, end_at, status, cancel_reason, rooms(name)")
      .eq("user_id", user.id)
      .order("start_at", { ascending: false }),
  ]);

  const reservations: ReservationItem[] = data ?? [];
  const now = new Date().getTime();
  const upcoming = reservations
    .filter((reservation) => reservation.status === "active" && new Date(reservation.start_at).getTime() >= now)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
  const inProgress = reservations.filter((reservation) =>
    reservation.status === "active" &&
    new Date(reservation.start_at).getTime() < now &&
    new Date(reservation.end_at).getTime() > now,
  );
  const history = reservations.filter((reservation) =>
    reservation.status === "cancelled" || new Date(reservation.end_at).getTime() <= now,
  );

  const week = getCurrentWeekRange();
  const weeklyActiveCount = reservations.filter((reservation) => {
    const dateKey = getCostaRicaDateKey(new Date(reservation.start_at));
    return reservation.status === "active" && dateKey >= week.start && dateKey < week.end;
  }).length;
  const isAdmin = profile?.role === "admin";

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="grid gap-7 border-b border-white/8 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Agenda personal</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">Mis reservas</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">Seguimiento de tus próximos bloques, actividad actual e historial.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4">
            <p className="text-xs text-slate-500">Cupo semanal</p>
            <p className="mt-1 text-lg font-black text-white">
              {isAdmin ? "Sin límite" : `${Math.max(0, 3 - weeklyActiveCount)} de 3 libres`}
            </p>
          </div>
          <Link href="/dashboard" className="grid place-items-center rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-200">
            Reservar una sala
          </Link>
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-8 rounded-xl border border-rose-300/15 bg-rose-300/7 p-4 text-rose-200">No se pudieron cargar tus reservas.</p>
      )}

      {!error && (
        <div className="mt-12 space-y-14">
          <ReservationList title="Próximas" eyebrow="01 / POR VENIR" reservations={upcoming} now={now} reasonRequired={isAdmin} />
          {inProgress.length > 0 && (
            <ReservationList title="En curso" eyebrow="02 / AHORA" reservations={inProgress} now={now} reasonRequired={isAdmin} />
          )}
          <ReservationList title="Historial" eyebrow="03 / ARCHIVO" reservations={history} now={now} reasonRequired={isAdmin} />
        </div>
      )}
    </main>
  );
}
