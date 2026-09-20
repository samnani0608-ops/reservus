import AdminReservationsTable from "./admin-reservations-table";
import {
  listReservations,
  listRooms,
  type ReservationFilters,
} from "./actions";

export default async function AdminReservations({
  filters,
}: {
  filters: ReservationFilters;
}) {
  const [reservations, rooms] = await Promise.all([
    listReservations(filters),
    listRooms(),
  ]);

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Gestión de reservas</h3>
        <p className="mt-1 text-sm text-slate-500">Filtrá la agenda y cancelá bloques con un motivo registrado.</p>
      </div>

      <AdminReservationsTable
        reservations={reservations}
        rooms={rooms}
        filters={filters}
      />
    </div>
  );
}
