-- RN-03: crea una restriccion de 3 horas para una reserva
alter table public.reservations
add constraint reservations_duration_check
check(
    end_at - start_at >= interval '1 hour   '
    and end_at - start_at <= interval '3 hours'
);

--RN-02: crea una restriccion para las reservas sean hechas en bloques de medioa hora
alter table public.reservations
add constraint reservations_half_hour_block_check
check(
  extract(minute from timezone('America/Costa_Rica', start_at)) in (0, 30)
  and extract(second from timezone('America/Costa_Rica', start_at)) = 0
  and extract(minute from timezone('America/Costa_Rica', end_at)) in (0, 30)
  and extract(second from timezone('America/Costa_Rica', end_at)) = 0
);

--RN-04: crea una restriccion donde las resrvas solo se pueden hacer en un rango de trabajo de 7am a 9 pm
alter table public.reservations
add constraint reservations_business_hours_check
check(
    timezone('America/Costa_Rica', start_at)::date = 
    timezone('America/Costa_Rica', end_at)::date

    and timezone('America/Costa_Rica', start_at)::time >= time '07:00'

    and timezone('America/Costa_Rica', end_at)::time <= '21:00'
);