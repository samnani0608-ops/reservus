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
  dateStyle: "long",
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

  return {
    start: monday.toISOString().slice(0, 10),
    end: nextMonday.toISOString().slice(0, 10),
  };
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
  reservations,
  now,
}: {
  title: string;
  reservations: ReservationItem[];
  now: number;
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold">{title}</h2>

      {reservations.length === 0 ? (
        <p className="mt-4 text-slate-600">No hay reservas en esta sección.</p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {reservations.map((reservation) => {
            const start = new Date(reservation.start_at);
            const end = new Date(reservation.end_at);
            const canCancel =
              reservation.status === "active" &&
              start.getTime() >= now + 2 * 60 * 60 * 1000;

            return (
              <article key={reservation.id} className="rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {reservation.rooms?.name ?? "Sala no disponible"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {reservationDateFormatter.format(start)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {reservationTimeFormatter.format(start)} - {reservationTimeFormatter.format(end)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      reservation.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {reservation.status === "active" ? "Activa" : "Cancelada"}
                  </span>
                </div>

                {reservation.cancel_reason && (
                  <p className="mt-3 text-sm text-slate-600">
                    Motivo de cancelación: {reservation.cancel_reason}
                  </p>
                )}

                {reservation.status === "active" && start.getTime() > now && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <CancelReservationForm
                      reservationId={reservation.id}
                      canCancel={canCancel}
                    />
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

  if (!user) {
    redirect("/login");
  }

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
    .filter((reservation) => new Date(reservation.start_at).getTime() >= now)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
  const past = reservations.filter(
    (reservation) => new Date(reservation.start_at).getTime() < now,
  );

  const week = getCurrentWeekRange();
  const weeklyActiveCount = reservations.filter((reservation) => {
    const dateKey = getCostaRicaDateKey(new Date(reservation.start_at));
    return (
      reservation.status === "active" &&
      dateKey >= week.start &&
      dateKey < week.end
    );
  }).length;

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-10">
      <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-black">
        ← Volver al dashboard
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Agenda personal
          </p>
          <h1 className="mt-2 text-3xl font-bold">Mis reservas</h1>
        </div>

        <div className="rounded-xl bg-slate-950 px-5 py-4 text-white">
          <p className="text-sm text-slate-300">Cupo semanal</p>
          <p className="mt-1 text-xl font-bold">
            {profile?.role === "admin"
              ? "Sin límite para admin"
              : `${Math.max(0, 3 - weeklyActiveCount)} de 3 disponibles`}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-8 rounded-lg bg-red-50 p-4 text-red-700">
          No se pudieron cargar tus reservas.
        </p>
      )}

      {!error && (
        <div className="mt-10 space-y-12">
          <ReservationList title="Próximas" reservations={upcoming} now={now} />
          <ReservationList title="Pasadas" reservations={past} now={now} />
        </div>
      )}
    </main>
  );
}
