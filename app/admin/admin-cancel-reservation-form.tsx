"use client";

import { useActionState } from "react";

import {
  cancelReservationAdmin,
  type AdminActionState,
} from "./actions";

const initialState: AdminActionState = { success: false, error: null };

export default function AdminCancelReservationForm({
  reservationId,
}: {
  reservationId: string;
}) {
  const [state, formAction, pending] = useActionState(
    cancelReservationAdmin,
    initialState,
  );

  return (
    <form action={formAction} className="min-w-52 space-y-2">
      <input type="hidden" name="reservation_id" value={reservationId} />
      <label className="block text-xs font-semibold text-slate-400" htmlFor={`admin-reason-${reservationId}`}>
        Motivo obligatorio
      </label>
      <textarea
        id={`admin-reason-${reservationId}`}
        name="reason"
        required
        maxLength={300}
        rows={2}
        placeholder="Motivo de cancelación"
        className="w-full rounded-lg border px-2.5 py-2 text-xs"
      />
      {state.error && <p role="alert" className="text-xs text-rose-300">{state.error}</p>}
      {state.success && <p aria-live="polite" className="text-xs text-emerald-300">Reserva cancelada.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-rose-300/20 bg-rose-300/5 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-300/10 disabled:opacity-50"
      >
        {pending ? "Cancelando..." : "Cancelar"}
      </button>
    </form>
  );
}
