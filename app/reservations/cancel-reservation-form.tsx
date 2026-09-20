"use client";

import { useActionState } from "react";

import {
  cancelReservation,
  type CancelReservationState,
} from "./actions";

const initialState: CancelReservationState = {
  success: false,
  error: null,
};

type CancelReservationFormProps = {
  reservationId: string;
  canCancel: boolean;
};

export default function CancelReservationForm({
  reservationId,
  canCancel,
}: CancelReservationFormProps) {
  const [state, formAction, pending] = useActionState(
    cancelReservation,
    initialState,
  );

  if (!canCancel) {
    return (
      <p className="text-sm text-slate-500">
        Ya no puede cancelarse porque faltan menos de 2 horas para iniciar.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="reservationId" value={reservationId} />

      <label className="block text-sm font-medium" htmlFor={`reason-${reservationId}`}>
        Motivo (opcional)
      </label>
      <textarea
        id={`reason-${reservationId}`}
        name="reason"
        maxLength={300}
        rows={2}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && (
        <p className="text-sm font-medium text-emerald-700">Reserva cancelada.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Cancelando..." : "Cancelar reserva"}
      </button>
    </form>
  );
}
