import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { calendarDateSchema, getReservationDateWindow } from "@/lib/reservation-dates";
import { createClient } from "@/lib/supabase/server";

import ReservationForm from "./reservation-form";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ date?: string }>;
};

const dateSchema = calendarDateSchema;

const fullDateFormatter = new Intl.DateTimeFormat("es-CR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Costa_Rica",
});

const timeFormatter = new Intl.DateTimeFormat("es-CR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Costa_Rica",
});

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { roomId } = await params;
  const { date } = await searchParams;
  const { minDate, maxDate } = getReservationDateWindow();
  const idResult = z.string().uuid().safeParse(roomId);

  if (!idResult.success) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name, capacity")
    .eq("id", idResult.data)
    .eq("is_active", true)
    .maybeSingle();

  if (roomError || !room) notFound();

  let availability: { start_at: string; end_at: string }[] = [];
  let availabilityError: string | null = null;
  let selectedDateLabel: string | null = null;

  if (date) {
    const dateResult = dateSchema.safeParse(date);
    if (!dateResult.success) {
      availabilityError = "La fecha seleccionada no es válida.";
    } else {
      selectedDateLabel = fullDateFormatter.format(new Date(`${dateResult.data}T12:00:00-06:00`));
      const { data, error } = await supabase.rpc("get_room_availability", {
        p_room_id: room.id,
        p_date: dateResult.data,
      });
      if (error) {
        availabilityError = "No se pudo consultar la disponibilidad.";
      } else {
        availability = data ?? [];
      }
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
        <Link href="/dashboard" className="hover:text-emerald-300">Salas</Link>
        <span aria-hidden className="text-slate-700">/</span>
        <span className="text-slate-300">{room.name}</span>
      </div>

      <section className="mt-8 flex flex-col gap-6 border-b border-white/8 pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Sala activa</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">{room.name}</h1>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
            <p className="text-xs text-slate-500">Capacidad</p>
            <p className="mt-1 font-bold text-white">{room.capacity} personas</p>
          </div>
          <Link href="/reservations" className="grid place-items-center rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 hover:border-emerald-300/30 hover:text-emerald-200">
            Mi agenda
          </Link>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <section className="rounded-[1.5rem] border border-white/9 bg-[#0c121a]/88 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs text-slate-600">01 / DISPONIBILIDAD</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Revisá el día</h2>
            </div>
            <form method="get" className="flex flex-col gap-2 min-[430px]:flex-row">
              <label className="sr-only" htmlFor="availability-date">Fecha para consultar</label>
              <input
                id="availability-date"
                type="date"
                name="date"
                min={minDate}
                max={maxDate}
                defaultValue={date ?? ""}
                required
                className="min-h-11 rounded-xl border px-3 py-2 text-sm"
              />
              <button type="submit" className="min-h-11 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-200">
                Consultar
              </button>
            </form>
          </div>

          <div className="mt-7 min-h-64 rounded-2xl border border-white/7 bg-black/15 p-5">
            {availabilityError && (
              <p role="alert" className="rounded-xl border border-rose-300/15 bg-rose-300/7 p-4 text-sm text-rose-200">{availabilityError}</p>
            )}

            {!date && (
              <div className="grid min-h-52 place-items-center text-center">
                <div>
                  <div className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/4 font-mono text-sm text-emerald-300">24h</div>
                  <p className="mt-4 font-semibold text-slate-300">Seleccioná una fecha</p>
                  <p className="mt-2 text-sm text-slate-600">Verás únicamente los bloques que ya están ocupados.</p>
                </div>
              </div>
            )}

            {date && !availabilityError && availability.length === 0 && (
              <div className="grid min-h-52 place-items-center text-center">
                <div>
                  <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1 text-xs font-bold text-emerald-300">Día despejado</span>
                  <h3 className="mt-4 text-lg font-bold capitalize text-white">{selectedDateLabel}</h3>
                  <p className="mt-2 text-sm text-slate-500">No hay reservas activas. Podés elegir cualquier bloque válido.</p>
                </div>
              </div>
            )}

            {availability.length > 0 && (
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold capitalize text-white">{selectedDateLabel}</h3>
                  <span className="text-xs text-slate-600">{availability.length} bloque(s) ocupado(s)</span>
                </div>
                <ul className="mt-5 space-y-3">
                  {availability.map((reservation) => (
                    <li key={`${reservation.start_at}-${reservation.end_at}`} className="flex items-center gap-4 rounded-xl border border-sky-300/12 bg-sky-300/6 p-4">
                      <span className="size-2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.7)]" />
                      <div>
                        <p className="font-mono text-sm font-bold text-sky-100">
                          {timeFormatter.format(new Date(reservation.start_at))} — {timeFormatter.format(new Date(reservation.end_at))}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">No disponible</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-emerald-300/12 bg-gradient-to-b from-emerald-300/6 to-[#0c121a]/90 p-5 sm:p-7 lg:sticky lg:top-24">
          <p className="font-mono text-xs text-emerald-300">02 / RESERVAR</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Creá tu bloque</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">La confirmación depende de disponibilidad y de las reglas de la sala.</p>
          <ReservationForm
            roomId={room.id}
            defaultDate={date ?? ""}
            minDate={minDate}
            maxDate={maxDate}
          />
        </section>
      </div>
    </main>
  );
}
