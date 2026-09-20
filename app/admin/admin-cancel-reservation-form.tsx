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
    <form action={formAction} className="min-w-56 space-y-2">
      <input type="hidden" name="reservation_id" value={reservationId} />
      <label className="block text-xs font-medium" htmlFor={`admin-reason-${reservationId}`}>
        Motivo obligatorio
      </label>
      <textarea
        id={`admin-reason-${reservationId}`}
        name="reason"
        required
        maxLength={300}
        rows={2}
        className="w-full rounded-lg border border-slate-300 px-2 py-1"
      />
      {state.error && <p className="text-xs text-red-700">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-700">Reserva cancelada.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Cancelando..." : "Cancelar"}
      </button>
    </form>
  );
}
