"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type CancelReservationState = {
  success: boolean;
  error: string | null;
};

const cancelSchema = z.object({
  reservationId: z.string().uuid("La reserva no es válida"),
  reason: z.string().trim().max(300, "El motivo es demasiado largo").optional(),
});

export async function cancelReservation(
  _previousState: CancelReservationState,
  formData: FormData,
): Promise<CancelReservationState> {
  const result = cancelSchema.safeParse({
    reservationId: formData.get("reservationId"),
    reason: formData.get("reason") || undefined,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Los datos no son válidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Debés iniciar sesión nuevamente." };
  }

  const { error } = await supabase.rpc("cancel_reservation", {
    p_reservation_id: result.data.reservationId,
    p_reason: result.data.reason,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/reservations");
  revalidatePath("/dashboard");

  return { success: true, error: null };
}
