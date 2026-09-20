import { z } from "zod";

export const MAX_RESERVATION_DAYS = 14;

// Valida días reales antes de que Date pueda normalizar una fecha inexistente.
export const calendarDateSchema = z.iso.date("La fecha no es válida");

// La ventana depende del calendario de Costa Rica, no de la zona del servidor.
export function getReservationDateWindow(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value;
  const minDate = `${part("year")}-${part("month")}-${part("day")}`;

  // UTC se usa solo para sumar días al calendario ya convertido a Costa Rica.
  const lastDay = new Date(`${minDate}T00:00:00Z`);
  lastDay.setUTCDate(lastDay.getUTCDate() + MAX_RESERVATION_DAYS);

  return { minDate, maxDate: lastDay.toISOString().slice(0, 10) };
}

// Se recalcula al enviar: una página abierta no determina la regla del servidor.
export function reservationDateSchema(now: Date = new Date()) {
  const { minDate, maxDate } = getReservationDateWindow(now);

  return calendarDateSchema
    .refine((date) => date >= minDate, "No podés reservar en una fecha pasada.")
    .refine(
      (date) => date <= maxDate,
      `Podés reservar con un máximo de ${MAX_RESERVATION_DAYS} días de anticipación.`
    );
}
