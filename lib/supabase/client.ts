// Este cliente se usa en componentes que corren en el navegador.
// Por eso usamos createBrowserClient.
import { createBrowserClient } from "@supabase/ssr";

// Importamos los tipos que Supabase generó automáticamente
// leyendo nuestra base de datos real.
import type { Database } from "@/types/database";


// Esta función crea una conexión con Supabase
// para utilizarla desde componentes del navegador.
export function createClient() {

  /*
    <Database> le dice a TypeScript:

    "Esta conexión utiliza exactamente la estructura
    definida en nuestra base de datos."

    Gracias a esto tendremos autocompletado y errores
    si intentamos usar tablas o columnas que no existen.
  */
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}