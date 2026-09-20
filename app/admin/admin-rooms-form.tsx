"use client";

import { useActionState } from "react";
import { createRoom, updateRoom, type Room, type AdminActionState } from "./actions";

const initialState: AdminActionState = { success: false, error: null };

type RoomFormProps = {
  room?: Room;
  onClose: () => void;
};

export function AdminRoomsForm({ room, onClose }: RoomFormProps) {
  const isEditing = !!room;

  const [createState, createAction, createPending] = useActionState(createRoom, initialState);
  const [updateState, updateAction, updatePending] = useActionState(updateRoom, initialState);

  const pending = isEditing ? updatePending : createPending;
  const state = isEditing ? updateState : createState;
  const action = isEditing ? updateAction : createAction;

  return (
    <form action={action} className="mt-4 flex max-w-md flex-col gap-4">
      <input type="hidden" name="room_id" value={room?.id ?? ""} />

      <div>
        <label htmlFor="room-name" className="block font-medium">
          Nombre
        </label>
        <input
          id="room-name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={room?.name ?? ""}
          className="mt-1 w-full rounded border p-2"
        />
      </div>

      <div>
        <label htmlFor="room-capacity" className="block font-medium">
          Capacidad
        </label>
        <input
          id="room-capacity"
          name="capacity"
          type="number"
          required
          min="1"
          defaultValue={room?.capacity ?? ""}
          className="mt-1 w-full rounded border p-2"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="room-active"
          name="is_active"
          type="checkbox"
          value="true"
          defaultChecked={room?.is_active ?? true}
        />
        <label htmlFor="room-active" className="font-medium">
          Sala activa
        </label>
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      {state.success && (
        <p className="text-sm font-medium text-green-600">
          {isEditing ? "Sala actualizada correctamente." : "Sala creada correctamente."}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
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
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
