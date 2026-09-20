// Cliente de Supabase que funciona desde el servidor.
// Gracias a las cookies sabe qué usuario inició sesión.
import { createClient } from "@/lib/supabase/server";

// redirect nos permite proteger esta página.
// Si no existe una sesión válida, enviamos al usuario al login.
import { redirect } from "next/navigation";

// Server Action que creamos anteriormente
// para cerrar la sesión del usuario.
import { logout } from "./actions";

// Link nos permite navegar entre páginas de Next.js
// sin recargar completamente la aplicación.
import Link from "next/link";


export default async function DashboardPage() {

  // Creamos la conexión con Supabase desde el servidor.
  const supabase = await createClient();


  /*
    PRIMERA CONSULTA:
    verificamos quién tiene la sesión actual.

    Esto protege /dashboard incluso si alguien
    escribe la URL directamente.
  */
  const {
    data: { user },
  } = await supabase.auth.getUser();


  // Si no hay usuario autenticado,
  // no permitimos acceder al dashboard.
  if (!user) {
    redirect("/login");
  }


  /*
    SEGUNDA CONSULTA:
    obtenemos las salas activas desde nuestra tabla "rooms".

    select():
    indica qué columnas queremos obtener.

    eq("is_active", true):
    pide solamente salas activas.

    order():
    ordena las salas alfabéticamente.
  */
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, name, capacity, is_active")
    .eq("is_active", true)
    .order("name");

  // El rol se consulta en servidor para mostrar el acceso administrativo.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

    /*
  Supabase puede devolver "null" en data.

  Con ?? [] decimos:
  "Si rooms es null, usa un arreglo vacío".

  De esta forma TypeScript sabe que roomList
  SIEMPRE será una lista y podemos usar
  .length y .map() de forma segura.
*/
const roomList = rooms ?? [];


  return (
    <main className="p-8">

      {/* Información básica del usuario conectado */}
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      {/* Mostramos el correo para comprobar que la sesión está funcionando. */}
      <p className="mt-4">
            Sesión iniciada como:{" "}
        {user.email}
      </p>


      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/reservations"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Mis reservas
        </Link>

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="rounded border border-black px-4 py-2"
          >
            Panel de administración
          </Link>
        )}

        {/* Botón de cerrar sesión que ya habíamos creado */}
        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-slate-300 px-4 py-2"
          >
            Cerrar sesión
          </button>
        </form>
      </div>


      {/* Sección de salas disponibles */}
      <section className="mt-10">

        <h2 className="text-2xl font-bold">
          Salas disponibles
        </h2>


        {/* Si Supabase devuelve un error,
            mostramos un mensaje en vez de romper la página. */}
        {roomsError && (
          <p className="mt-4 text-red-600">
            No se pudieron cargar las salas.
          </p>
        )}


        {/* Si no existe ningún error pero tampoco hay salas,
            mostramos un estado vacío. */}
        {!roomsError && roomList.length === 0 && (
          <p className="mt-4">
            No hay salas disponibles.
          </p>
        )}


        {/* Mostramos una tarjeta por cada sala encontrada. */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roomList.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="rounded-lg border p-5 transition hover:bg-gray-100"
            >
              <h3 className="text-xl font-semibold">{room.name}</h3>

              <p className="mt-2">Capacidad: {room.capacity} personas</p>

              <p className="mt-4 text-sm">Ver disponibilidad →</p>
            </Link>
          ))}
        </div>

      </section>

    </main>
  );
}
