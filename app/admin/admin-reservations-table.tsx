import type {
  ReservationFilters,
  ReservationWithDetails,
  Room,
} from "./actions";
import AdminCancelReservationForm from "./admin-cancel-reservation-form";

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
  return (
    <div className="mt-4 space-y-6">
      <form method="get" className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm font-medium">
          Sala
          <select
            name="room"
            defaultValue={filters.room_id ?? ""}
            className="mt-1 block w-full rounded-lg border border-slate-300 p-2"
          >
            <option value="">Todas las salas</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Usuario (UUID)
          <input
            name="user"
            type="text"
            defaultValue={filters.user_id ?? ""}
            className="mt-1 block w-full rounded-lg border border-slate-300 p-2"
          />
        </label>

        <label className="text-sm font-medium">
          Estado
          <select
            name="status"
            defaultValue={filters.status ?? "all"}
            className="mt-1 block w-full rounded-lg border border-slate-300 p-2"
          >
            <option value="all">Todos</option>
            <option value="active">Activas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </label>

        <label className="text-sm font-medium">
          Desde
          <input
            name="from"
            type="date"
            defaultValue={filters.date_from ?? ""}
            className="mt-1 block w-full rounded-lg border border-slate-300 p-2"
          />
        </label>

        <label className="text-sm font-medium">
          Hasta
          <input
            name="to"
            type="date"
            defaultValue={filters.date_to ?? ""}
            className="mt-1 block w-full rounded-lg border border-slate-300 p-2"
          />
        </label>

        <div className="flex gap-3 md:col-span-2 lg:col-span-5">
          <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white">
            Aplicar filtros
          </button>
          <a href="/admin" className="rounded-lg border border-slate-300 px-4 py-2">
            Limpiar
          </a>
        </div>
      </form>

      {reservations.length === 0 ? (
        <p className="text-slate-600">No hay reservas con los filtros aplicados.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3">Sala</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {reservations.map((reservation) => {
                const start = new Date(reservation.start_at);
                const end = new Date(reservation.end_at);

                return (
                  <tr key={reservation.id} className="align-top">
                    <td className="px-4 py-4 text-sm font-medium">{reservation.room_name}</td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">
                      {reservation.user_id}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {dateFormatter.format(start)}<br />
                      {timeFormatter.format(start)} - {timeFormatter.format(end)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          reservation.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {reservation.status === "active" ? "Activa" : "Cancelada"}
                      </span>
                      {reservation.cancel_reason && (
                        <p className="mt-2 max-w-xs text-xs text-slate-600">
                          {reservation.cancel_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {reservation.status === "active" ? (
                        <AdminCancelReservationForm reservationId={reservation.id} />
                      ) : (
                        <span className="text-slate-500">Sin acciones</span>
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
