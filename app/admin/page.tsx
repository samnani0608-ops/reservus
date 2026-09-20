// Cliente de Supabase para código que corre en el servidor.
import { createClient } from "@/lib/supabase/server";

// redirect protege la página y redirige si no hay sesión o no es admin.
import { redirect } from "next/navigation";
import { z } from "zod";

// Componentes de cliente para las pestañas de administración.
import AdminRooms from "./admin-rooms";
import AdminReservations from "./admin-reservations";
import type { ReservationFilters } from "./actions";

type AdminPageProps = {
  searchParams: Promise<{
    room?: string;
    user?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
};

const uuidFilter = z.string().uuid();
const dateFilter = z.iso.date();

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // Creamos la conexión con Supabase desde el servidor.
  const supabase = await createClient();

  /*
    PRIMERA CONSULTA:
    verificamos quién tiene la sesión actual.
  */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión → login.
  if (!user) {
    redirect("/login");
  }

  /*
    SEGUNDA CONSULTA:
    obtenemos el perfil para comprobar el rol.
    Esta comprobación ocurre EN SERVIDOR, no en el navegador.
  */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Si no hay perfil o no es admin → dashboard.
  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const filters: ReservationFilters = {
    room_id: uuidFilter.safeParse(params.room).data,
    user_id: uuidFilter.safeParse(params.user).data,
    status:
      params.status === "active" || params.status === "cancelled"
        ? params.status
        : "all",
    date_from: dateFilter.safeParse(params.from).data,
    date_to: dateFilter.safeParse(params.to).data,
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Panel de administración</h1>
      <p className="mt-4 text-gray-600">
        Bienvenido, administrador. Gestioná salas y reservas desde aquí.
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="text-2xl font-bold border-b pb-2">Salas</h2>
          <AdminRooms />
        </section>

        <section>
          <h2 className="text-2xl font-bold border-b pb-2">Reservas</h2>
          <AdminReservations filters={filters} />
        </section>
      </div>
    </main>
  );
}
