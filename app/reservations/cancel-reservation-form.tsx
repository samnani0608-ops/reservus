"use client";

import { useActionState } from "react";

import { cancelReservation, type CancelReservationState } from "./actions";

const initialState: CancelReservationState = { success: false, error: null };

type CancelReservationFormProps = {
  reservationId: string;
  canCancel: boolean;
  reasonRequired: boolean;
};

export default function CancelReservationForm({
  reservationId,
  canCancel,
  reasonRequired,
}: CancelReservationFormProps) {
  const [state, formAction, pending] = useActionState(cancelReservation, initialState);

  if (!canCancel) {
    return <p className="text-sm leading-6 text-slate-400">La ventana de cancelación cerró 2 horas antes del inicio.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="reservationId" value={reservationId} />
      <label className="block text-sm font-semibold text-slate-400" htmlFor={`reason-${reservationId}`}>
        Motivo {reasonRequired ? "(obligatorio para admin)" : "(opcional)"}
      </label>
      <textarea
        id={`reason-${reservationId}`}
        name="reason"
        required={reasonRequired}
        maxLength={300}
        rows={2}
        placeholder="Contanos por qué necesitás cancelar"
        className="w-full rounded-xl border px-3 py-2 text-sm"
      />

      {state.error && <p role="alert" className="text-sm text-rose-300">{state.error}</p>}
      {state.success && <p aria-live="polite" className="text-sm font-semibold text-emerald-300">Reserva cancelada.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-rose-300/20 bg-rose-300/5 px-4 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-300/10 disabled:opacity-50"
      >
        {pending ? "Cancelando..." : "Cancelar reserva"}
      </button>
    </form>
  );
}
