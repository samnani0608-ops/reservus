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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Gestión de reservas</h3>
      </div>

      <AdminReservationsTable
        reservations={reservations}
        rooms={rooms}
        filters={filters}
      />
    </div>
  );
}
