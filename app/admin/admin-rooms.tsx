// Server Component que lista salas y renderiza el formulario de cliente.
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { AdminEditButton, AdminNewRoomButton } from "./admin-rooms-actions";

type Room = {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
};

export type { Room };

async function RoomsList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, capacity, is_active, created_at")
    .order("name");

  if (error) {
    return (
      <p role="alert" className="rounded-xl border border-rose-300/15 bg-rose-300/7 p-4 text-sm text-rose-200">
        No se pudieron cargar las salas.
      </p>
    );
  }

  const rooms = data ?? [];

  return (
    <div className="space-y-3">
      {rooms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-7 text-center text-sm text-slate-600">No hay salas registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="min-w-[680px] divide-y divide-white/8">
            <thead className="bg-white/3">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Capacidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/7">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-white/2">
                  <td className="px-4 py-4 text-sm font-semibold text-white">{room.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-400">{room.capacity} personas</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                        room.is_active
                          ? "border-emerald-300/20 bg-emerald-300/8 text-emerald-300"
                          : "border-rose-300/15 bg-rose-300/7 text-rose-200"
                      }`}
                    >
                      {room.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <AdminEditButton room={room} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Exporta el componente de la pestaña Salas (Server Component).
export default async function AdminRooms() {
  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Gestión de salas</h3>
          <p className="mt-1 text-sm text-slate-500">Creá, editá o desactivá espacios sin borrar su historial.</p>
        </div>
        <AdminNewRoomButton />
      </div>

      <Suspense fallback={<p className="text-sm text-slate-500">Cargando salas...</p>}>
        <RoomsList />
      </Suspense>
    </div>
  );
}
