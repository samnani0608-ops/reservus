"use server";

// Zod valida los datos que llegan desde el formulario.
// No confiamos directamente en lo que envía el navegador.
import { z } from "zod";

// Usamos el cliente de Supabase para servidor que ya creamos.
// Este cliente puede trabajar con las cookies de sesión.
import { createClient } from "@/lib/supabase/server";

// redirect permite enviar al usuario a otra página
// después de iniciar sesión correctamente.
import { redirect } from "next/navigation";


// Define la forma del estado que recibirá el formulario.
export type LoginState = {
  error: string | null;
};


// Reglas de validación del formulario.
//
// Antes de preguntarle a Supabase si el usuario existe,
// comprobamos que los datos tengan una estructura válida.
const loginSchema = z.object({
  email: z
    .string()
    .email("El correo no es válido"),

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});


// Esta Server Action será ejecutada cuando se envíe el formulario.
export async function login(
  previousState: LoginState,
  formData: FormData
): Promise<LoginState> {

  // Extraemos email y password del formulario
  // y los validamos utilizando Zod.
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });


  // Si Zod encuentra datos inválidos,
  // detenemos el proceso antes de llegar a Supabase.
  if (!result.success) {
    return {
      error:
        result.error.issues[0]?.message ??
        "Datos inválidos",
    };
  }


  // Creamos nuestra conexión de servidor con Supabase.
  const supabase = await createClient();


  // signInWithPassword le pide a Supabase Auth
  // comprobar email + contraseña.
  //
  // Si son correctos, Supabase crea una sesión
  // y nuestro server.ts permite guardar sus cookies.
  const { error } =
    await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });


  // Si el correo o contraseña son incorrectos,
  // Supabase devuelve un error.
  if (error) {
    return {
      error: error.message,
    };
  }


  // Si el login funcionó, enviamos al usuario
  // al dashboard.
  redirect("/dashboard");
}