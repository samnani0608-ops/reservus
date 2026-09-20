-- D6: solo nuevas reservas, hasta hoy + 14 días inclusive en Costa Rica.
-- Se conserva la firma de la RPC y todas las protecciones anteriores.
create or replace function public.create_reservation(
  p_room_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role public.user_role;
  v_reservation_id uuid;
  v_week_start date;
  v_active_reservations integer;
begin
  -- La identidad y el rol se obtienen del servidor, nunca del formulario.
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para crear una reserva';
  end if;

  select role into v_role
  from public.profiles
  where id = v_user_id;

  if v_role is null then
    raise exception 'No existe un perfil para este usuario';
  end if;

  -- RN-09: solo salas existentes y activas.
  if not exists (
    select 1 from public.rooms
    where id = p_room_id and is_active = true
  ) then
    raise exception 'La sala no existe o está desactivada';
  end if;

  -- RN-05: la anticipación mínima sigue siendo de 30 minutos.
  if p_start_at < now() + interval '30 minutes' then
    raise exception 'La reserva debe hacerse con al menos 30 minutos de anticipación';
  end if;

  -- D6: comparar fechas permite todo el día +14, también para administradores.
  if timezone('America/Costa_Rica', p_start_at)::date >
     timezone('America/Costa_Rica', now())::date + 14 then
    raise exception 'Podés reservar con un máximo de 14 días de anticipación.';
  end if;

  -- D1: lunes a domingo según el inicio de la reserva en Costa Rica.
  v_week_start := date_trunc(
    'week', timezone('America/Costa_Rica', p_start_at)
  )::date;

  -- Serializa el conteo y la creación para el mismo usuario y semana.
  perform pg_advisory_xact_lock(
    hashtext(v_user_id::text || ':' || v_week_start::text)::bigint
  );

  -- RN-06, D2 y D4: tres activas por semana; canceladas no cuentan; admin exento.
  if v_role = 'member' then
    select count(*) into v_active_reservations
    from public.reservations
    where user_id = v_user_id
      and status = 'active'
      and timezone('America/Costa_Rica', start_at)::date >= v_week_start
      and timezone('America/Costa_Rica', start_at)::date < v_week_start + 7;

    if v_active_reservations >= 3 then
      raise exception 'Ya alcanzaste el límite de 3 reservas activas esta semana';
    end if;
  end if;

  -- Las restricciones de tabla siguen validando duración, horario y solapes.
  insert into public.reservations (user_id, room_id, start_at, end_at)
  values (v_user_id, p_room_id, p_start_at, p_end_at)
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

revoke all
on function public.create_reservation(uuid, timestamptz, timestamptz)
from public;

grant execute
on function public.create_reservation(uuid, timestamptz, timestamptz)
to authenticated;
