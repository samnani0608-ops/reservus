"use client";

import { useActionState, useId } from "react";
import { createRoom, updateRoom, type Room, type AdminActionState } from "./actions";

const initialState: AdminActionState = { success: false, error: null };

type RoomFormProps = {
  room?: Room;
  onClose: () => void;
};

export function AdminRoomsForm({ room, onClose }: RoomFormProps) {
  const isEditing = !!room;
  const fieldPrefix = useId();
  const nameId = `${fieldPrefix}-name`;
  const capacityId = `${fieldPrefix}-capacity`;
  const activeId = `${fieldPrefix}-active`;

  const [createState, createAction, createPending] = useActionState(createRoom, initialState);
  const [updateState, updateAction, updatePending] = useActionState(updateRoom, initialState);

  const pending = isEditing ? updatePending : createPending;
  const state = isEditing ? updateState : createState;
  const action = isEditing ? updateAction : createAction;

  return (
    <form action={action} className="mt-4 flex min-w-64 max-w-md flex-col gap-4 rounded-2xl border border-white/8 bg-black/20 p-4">
      <input type="hidden" name="room_id" value={room?.id ?? ""} />

      <div>
        <label htmlFor={nameId} className="block text-sm font-semibold text-slate-300">
          Nombre
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={room?.name ?? ""}
          className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label htmlFor={capacityId} className="block text-sm font-semibold text-slate-300">
          Capacidad
        </label>
        <input
          id={capacityId}
          name="capacity"
          type="number"
          required
          min="1"
          defaultValue={room?.capacity ?? ""}
          className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id={activeId}
          name="is_active"
          type="checkbox"
          value="true"
          defaultChecked={room?.is_active ?? true}
        />
        <label htmlFor={activeId} className="text-sm font-medium text-slate-300">
          Sala activa
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-rose-300">{state.error}</p>
      )}

      {state.success && (
        <p aria-live="polite" className="text-sm font-medium text-emerald-300">
          {isEditing ? "Sala actualizada correctamente." : "Sala creada correctamente."}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-950 hover:bg-emerald-200 disabled:opacity-50"
        >
          {pending
            ? "Guardando..."
            : isEditing
            ? "Actualizar sala"
            : "Crear sala"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
