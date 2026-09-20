// Este cliente se utiliza en código que corre en el servidor.
import { createServerClient } from "@supabase/ssr";

// cookies() nos permite leer y modificar
// las cookies de sesión del usuario.
import { cookies } from "next/headers";

// Importamos los tipos generados desde nuestra base de datos.
import type { Database } from "@/types/database";


export async function createClient() {

  // Obtenemos las cookies de la petición actual.
  // Aquí Supabase guarda información de la sesión.
  const cookieStore = await cookies();


  /*
    <Database> conecta este cliente con los tipos
    reales de nuestra base de datos.

    Ahora TypeScript conoce:
    - profiles
    - rooms
    - reservations
    - enums
    - funciones RPC
    - columnas y tipos
  */
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {

        // Devuelve todas las cookies actuales
        // para que Supabase pueda leer la sesión.
        getAll() {
          return cookieStore.getAll();
        },


        // Supabase puede necesitar actualizar cookies,
        // por ejemplo al crear o renovar una sesión.
        setAll(cookiesToSet) {
          try {

            // Guardamos cada cookie nueva o actualizada.
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(name, value, options);
              }
            );

          } catch {

            /*
              Algunos Server Components no permiten
              modificar cookies directamente.

              Por eso capturamos ese caso en vez de
              provocar que toda la aplicación falle.
            */
          }
        },
      },
    }
  );
}