"use client";
import { useState } from "react";
import { AdminRoomsForm } from "./admin-rooms-form";
import type { Room } from "./admin-rooms";

type AdminEditButtonProps = {
  room: Room;
};

export function AdminEditButton({ room }: AdminEditButtonProps) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-emerald-300/30 hover:text-emerald-200"
      >
        Editar
      </button>
    );
  }

  return (
    <div>
      <AdminRoomsForm room={room} onClose={() => setShowForm(false)} />
    </div>
  );
}

// Botón para crear nueva sala.
export function AdminNewRoomButton() {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-950 hover:bg-emerald-200"
      >
        Nueva sala
      </button>
    );
  }

  return (
    <div>
      <AdminRoomsForm onClose={() => setShowForm(false)} />
    </div>
  );
}
