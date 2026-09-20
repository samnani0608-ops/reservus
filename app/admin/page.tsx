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
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="border-b border-white/8 pb-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Centro de control</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">
          Administración
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
          Gestioná la capacidad operativa, el estado de las salas y la agenda completa.
        </p>
      </section>

      <div className="mt-12 space-y-14">
        <section aria-labelledby="rooms-title" className="rounded-[1.5rem] border border-white/9 bg-[#0c121a]/88 p-5 sm:p-7">
          <div className="border-b border-white/8 pb-5">
            <p className="font-mono text-xs text-slate-600">01 / INVENTARIO</p>
            <h2 id="rooms-title" className="mt-2 text-2xl font-bold text-white">Salas</h2>
          </div>
          <AdminRooms />
        </section>

        <section aria-labelledby="reservations-title" className="rounded-[1.5rem] border border-white/9 bg-[#0c121a]/88 p-5 sm:p-7">
          <div className="border-b border-white/8 pb-5">
            <p className="font-mono text-xs text-slate-600">02 / OPERACIÓN</p>
            <h2 id="reservations-title" className="mt-2 text-2xl font-bold text-white">Reservas</h2>
          </div>
          <AdminReservations filters={filters} />
        </section>
      </div>
    </main>
  );
}
