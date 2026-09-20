import Link from "next/link";

import AdminCancelReservationForm from "./admin-cancel-reservation-form";
import type { ReservationFilters, ReservationWithDetails, Room } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  dateStyle: "medium",
});

const timeFormatter = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

type AdminReservationsTableProps = {
  reservations: ReservationWithDetails[];
  rooms: Room[];
  filters: ReservationFilters;
};

export default function AdminReservationsTable({
  reservations,
  rooms,
  filters,
}: AdminReservationsTableProps) {
  const now = new Date().getTime();

  return (
    <div className="space-y-6">
      <form method="get" className="grid gap-4 rounded-2xl border border-white/8 bg-black/15 p-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Sala
          <select name="room" defaultValue={filters.room_id ?? ""} className="mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-normal normal-case tracking-normal">
            <option value="">Todas las salas</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Usuario (UUID)
          <input
            name="user"
            type="text"
            placeholder="UUID completo"
            defaultValue={filters.user_id ?? ""}
            className="mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-normal normal-case tracking-normal"
          />
        </label>

        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Estado
          <select name="status" defaultValue={filters.status ?? "all"} className="mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-normal normal-case tracking-normal">
            <option value="all">Todos</option>
            <option value="active">Activas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </label>

        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Desde
          <input name="from" type="date" defaultValue={filters.date_from ?? ""} className="mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-normal normal-case tracking-normal" />
        </label>

        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Hasta
          <input name="to" type="date" defaultValue={filters.date_to ?? ""} className="mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-normal normal-case tracking-normal" />
        </label>

        <div className="flex flex-wrap gap-3 md:col-span-2 lg:col-span-5">
          <button type="submit" className="rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-950 hover:bg-emerald-200">
            Aplicar filtros
          </button>
          <Link href="/admin" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">
            Limpiar
          </Link>
        </div>
      </form>

      {reservations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-7 text-center text-sm text-slate-600">No hay reservas con los filtros aplicados.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="min-w-[980px] divide-y divide-white/8">
            <thead className="bg-white/3">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Sala</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/7">
              {reservations.map((reservation) => {
                const start = new Date(reservation.start_at);
                const end = new Date(reservation.end_at);
                const canCancel = reservation.status === "active" && start.getTime() >= now + 2 * 60 * 60 * 1000;

                return (
                  <tr key={reservation.id} className="align-top hover:bg-white/2">
                    <td className="px-4 py-4 text-sm font-semibold text-white">{reservation.room_name}</td>
                    <td className="max-w-56 break-all px-4 py-4 font-mono text-xs leading-5 text-slate-500">{reservation.user_id}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {dateFormatter.format(start)}
                      <br />
                      <span className="font-mono text-xs text-slate-500">{timeFormatter.format(start)} — {timeFormatter.format(end)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                        reservation.status === "active"
                          ? "border-emerald-300/20 bg-emerald-300/8 text-emerald-300"
                          : "border-slate-400/15 bg-slate-400/8 text-slate-400"
                      }`}>
                        {reservation.status === "active" ? "Activa" : "Cancelada"}
                      </span>
                      {reservation.cancel_reason && (
                        <p className="mt-3 max-w-xs text-xs leading-5 text-slate-500">{reservation.cancel_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {canCancel ? (
                        <AdminCancelReservationForm reservationId={reservation.id} />
                      ) : reservation.status === "active" ? (
                        <span className="text-xs text-slate-600">Ventana de cancelación cerrada</span>
                      ) : (
                        <span className="text-xs text-slate-600">Sin acciones</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
