-- Campos necesarios para registrar cancelaciones

alter table public.reservations
add column if not exists cancel_reason text;

alter table public.reservations
add column if not exists cancelled_at timestamptz;