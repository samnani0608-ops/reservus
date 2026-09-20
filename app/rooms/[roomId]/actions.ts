"use server";

// Zod valida los datos que llegan desde el formulario.
// Nunca confiamos directamente en lo que envía el navegador.
import { z } from "zod";

// Cliente de Supabase para código que corre en el servidor.
// Ya lo configuramos anteriormente con cookies y tipos.
import { createClient } from "@/lib/supabase/server";
import { calendarDateSchema, reservationDateSchema } from "@/lib/reservation-dates";

// Le permite a Next.js volver a consultar una página
// después de que cambiamos información en la base de datos.
import { revalidatePath } from "next/cache";


// Define qué información devolverá esta Server Action
// al formulario de reservas.
export type ReservationState = {
  success: boolean;
  error: string | null;
};


// Validamos los datos básicos del formulario.
//
// Importante:
// Estas validaciones NO reemplazan las reglas SQL.
// PostgreSQL sigue siendo la última barrera de seguridad.
const reservationSchema = z.object({
  // La sala debe tener un ID UUID válido.
  roomId: z.string().uuid("La sala no es válida"),

  // La fecha debe existir en el calendario, además de tener formato AAAA-MM-DD.
  date: calendarDateSchema,

  // La hora debe venir como HH:MM.
  startTime: z.string().regex(
    /^\d{2}:\d{2}$/,
    "La hora no es válida"
  ),

  /*
    FormData devuelve texto.

    z.coerce.number() convierte ese texto
    a número antes de validarlo.
  */
  duration: z.coerce.number().refine(
    (value) =>
      [60, 90, 120, 150, 180].includes(value),
    "La duración debe estar entre 1 y 3 horas"
  ),
});


export async function createReservation(
  previousState: ReservationState,
  formData: FormData
): Promise<ReservationState> {

  /*
    Tomamos los datos enviados por el formulario
    y los pasamos por Zod.
  */
  const result = reservationSchema.safeParse({
    roomId: formData.get("roomId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    duration: formData.get("duration"),
  });


  // Si algún dato es inválido,
  // detenemos todo antes de hablar con Supabase.
  if (!result.success) {
    return {
      success: false,
      error:
        result.error.issues[0]?.message ??
        "Datos inválidos",
    };
  }


  // Sacamos los valores ya validados por Zod.
  const {
    roomId,
    date,
    startTime,
    duration,
  } = result.data;

  // También protegemos la ventana de 14 días si se manipula el formulario.
  const dateResult = reservationDateSchema().safeParse(date);
  if (!dateResult.success) {
    return {
      success: false,
      error: dateResult.error.issues[0]?.message ?? "La fecha no es válida",
    };
  }


  /*
    Separamos una hora como "10:30".

    hour   = 10
    minute = 30
  */
  const [hour, minute] =
    startTime.split(":").map(Number);


  /*
    RN02:
    las reservas deben comenzar en bloques
    de 30 minutos.

    RN04:
    el horario comienza a las 07:00.
  */
  if (
    ![0, 30].includes(minute) ||
    hour < 7 ||
    hour > 20
  ) {
    return {
      success: false,
      error:
        "La hora debe comenzar entre las 07:00 y las 20:00 en bloques de 30 minutos.",
    };
  }


  /*
    Convertimos la hora inicial a minutos.

    10:30
    ↓
    10 * 60 + 30
    ↓
    630
  */
  const startMinutes =
    hour * 60 + minute;

  const endMinutes =
    startMinutes + duration;


  /*
    RN04:
    ninguna reserva puede terminar
    después de las 21:00.
  */
  if (endMinutes > 21 * 60) {
    return {
      success: false,
      error:
        "La reserva debe terminar como máximo a las 21:00.",
    };
  }


  /*
    RN10:
    el proyecto trabaja con la zona horaria
    de Costa Rica.

    Ejemplo:

    2026-09-19
    10:30

    ↓

    2026-09-19T10:30:00-06:00
  */
  const startDate = new Date(
    `${date}T${startTime}:00-06:00`
  );


  // También comprobamos que la fecha realmente exista.
  if (Number.isNaN(startDate.getTime())) {
    return {
      success: false,
      error: "La fecha u hora no es válida.",
    };
  }


  /*
    Calculamos automáticamente la hora final
    sumando la duración elegida.
  */
  const endDate = new Date(
    startDate.getTime() +
      duration * 60 * 1000
  );


  // Creamos nuestra conexión con Supabase.
  const supabase = await createClient();


  /*
    Ejecutamos la función PostgreSQL
    create_reservation() que construimos anteriormente.

    MUY IMPORTANTE:
    no enviamos user_id.

    PostgreSQL usa auth.uid() para identificar
    al usuario que tiene la sesión.
  */
  const { error } = await supabase.rpc(
    "create_reservation",
    {
      p_room_id: roomId,
      p_start_at: startDate.toISOString(),
      p_end_at: endDate.toISOString(),
    }
  );


  /*
    Si PostgreSQL rechaza la reserva,
    devolvemos un mensaje al formulario.
  */
  if (error) {

    // RN01 / D5:
    // otra reserva ya ocupa total o parcialmente ese horario.
    // Detectamos por código 23P01 (exclusion_violation) o por mensaje.
    // Revalidamos para que la disponibilidad muestre el bloque recién ocupado.
    if (
      error.code === "23P01" ||
      error.message.includes("reservations_no_overlap")
    ) {
      revalidatePath(`/rooms/${roomId}`);
      return {
        success: false,
        error: "Ese horario ya está ocupado.",
      };
    }


    /*
      Las demás reglas pueden devolver mensajes
      desde nuestra propia función SQL.

      Ejemplos:
      - menos de 30 min de anticipación
      - máximo semanal alcanzado
      - sala desactivada
    */
    return {
      success: false,
      error: error.message,
    };
  }


  /*
    Como acabamos de modificar las reservas,
    hacemos que Next.js actualice esta página.

    Así la próxima consulta de disponibilidad
    puede mostrar el nuevo bloque ocupado.
  */
  revalidatePath(`/rooms/${roomId}`);


  return {
    success: true,
    error: null,
  };
}