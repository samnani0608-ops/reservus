"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createReservation, type ReservationState } from "./actions";

const initialState: ReservationState = { success: false, error: null };

type ReservationFormProps = {
  roomId: string;
  defaultDate: string;
  minDate: string;
  maxDate: string;
};

export default function ReservationForm({
  roomId,
  defaultDate,
  minDate,
  maxDate,
}: ReservationFormProps) {
  const [state, formAction, pending] = useActionState(createReservation, initialState);

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <input type="hidden" name="roomId" value={roomId} />

      <div>
        <label htmlFor="reservation-date" className="text-sm font-semibold text-slate-300">Fecha</label>
        <input
          id="reservation-date"
          name="date"
          type="date"
          required
          min={minDate}
          max={maxDate}
          defaultValue={defaultDate >= minDate && defaultDate <= maxDate ? defaultDate : ""}
          aria-describedby="reservation-date-help"
          className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
        />
        <p id="reservation-date-help" className="mt-2 text-xs leading-5 text-slate-400">
          Disponible hasta el {maxDate.split("-").reverse().join("/")}, con al menos 30 minutos de anticipación.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startTime" className="text-sm font-semibold text-slate-300">Hora de inicio</label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            min="07:00"
            max="20:00"
            step="1800"
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="duration" className="text-sm font-semibold text-slate-300">Duración</label>
          <select id="duration" name="duration" defaultValue="60" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm">
            <option value="60">1 hora</option>
            <option value="90">1 h 30 min</option>
            <option value="120">2 horas</option>
            <option value="150">2 h 30 min</option>
            <option value="180">3 horas</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-rose-300/15 bg-rose-300/7 p-3 text-sm text-rose-200">{state.error}</p>
      )}

      {state.success && (
        <div aria-live="polite" className="rounded-xl border border-emerald-300/20 bg-emerald-300/8 p-4">
          <p className="text-sm font-bold text-emerald-200">Reserva creada correctamente.</p>
          <Link href="/reservations" className="mt-3 inline-flex text-sm font-bold text-white underline decoration-emerald-300/50 underline-offset-4 hover:text-emerald-200">
            Ver en Mis reservas →
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-black text-emerald-950 shadow-[0_14px_40px_rgba(52,211,153,0.12)] hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Confirmando bloque..." : "Crear reserva"}
      </button>
    </form>
  );
}
