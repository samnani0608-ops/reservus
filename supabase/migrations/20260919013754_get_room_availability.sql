-- Esta función permite consultar los horarios ocupados
-- de una sala durante un día específico.
--
-- Importante:
-- NO devuelve user_id ni información del usuario.
-- Solo devuelve hora de inicio y hora de finalización.

create or replace function public.get_room_availability(
  p_room_id uuid,
  p_date date
)
returns table (
  start_at timestamptz,
  end_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin

  -- Verificamos que exista un usuario autenticado.
  -- Una persona sin sesión no puede consultar disponibilidad.
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para consultar disponibilidad';
  end if;


  -- Comprobamos que la sala exista y esté activa.
  -- Las salas desactivadas no pueden recibir nuevas reservas.
  if not exists (
    select 1
    from public.rooms
    where id = p_room_id
      and is_active = true
  ) then
    raise exception 'La sala no existe o está desactivada';
  end if;


  /*
    Devolvemos únicamente las reservas activas
    de esa sala durante el día solicitado.

    AT TIME ZONE 'America/Costa_Rica'
    hace que el inicio y final del día se calculen
    según la hora de Costa Rica.
  */
  return query
  select
    r.start_at,
    r.end_at
  from public.reservations as r
  where r.room_id = p_room_id

    -- Una reserva cancelada ya no ocupa el espacio.
    and r.status = 'active'

    -- Inicio del día solicitado en Costa Rica.
    and r.start_at >= (
      p_date::timestamp
      at time zone 'America/Costa_Rica'
    )

    -- Inicio del día siguiente.
    and r.start_at < (
      (p_date + 1)::timestamp
      at time zone 'America/Costa_Rica'
    )

  order by r.start_at;

end;
$$;


-- Quitamos el permiso automático que PostgreSQL
-- podría dar a cualquier usuario.
revoke all
on function public.get_room_availability(uuid, date)
from public;


-- Solamente usuarios autenticados pueden ejecutar la función.
grant execute
on function public.get_room_availability(uuid, date)
to authenticated;