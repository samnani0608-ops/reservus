-- Crea una reserva de forma segura.
-- El usuario se obtiene mediante auth.uid(),
-- por lo que el cliente nunca puede elegir user_id.

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

  -- Obtener el usuario autenticado.
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Debes iniciar sesión para crear una reserva';
  end if;


  -- Obtener el rol del usuario.
  select role
  into v_role
  from public.profiles
  where id = v_user_id;

  if v_role is null then
    raise exception 'No existe un perfil para este usuario';
  end if;


  -- RN-09: la sala debe existir y estar activa.
  if not exists (
    select 1
    from public.rooms
    where id = p_room_id
      and is_active = true
  ) then
    raise exception 'La sala no existe o está desactivada';
  end if;


  -- RN-05: mínimo 30 minutos de anticipación.
  if p_start_at < now() + interval '30 minutes' then
    raise exception 'La reserva debe hacerse con al menos 30 minutos de anticipación';
  end if;


  -- D1: la semana va de lunes a domingo,
  -- tomando como referencia la hora de Costa Rica.
  v_week_start :=
    date_trunc(
      'week',
      timezone('America/Costa_Rica', p_start_at)
    )::date;


  -- Evita que dos solicitudes simultáneas del mismo usuario
  -- puedan saltarse el límite semanal.
  perform pg_advisory_xact_lock(
    hashtext(v_user_id::text || ':' || v_week_start::text)::bigint
  );


  -- RN-06:
  -- miembros: máximo 3 reservas activas por semana.
  -- D2: reservas canceladas no cuentan.
  -- D4: admins no están sujetos al límite.
  if v_role = 'member' then

    select count(*)
    into v_active_reservations
    from public.reservations
    where user_id = v_user_id
      and status = 'active'
      and timezone('America/Costa_Rica', start_at)::date >= v_week_start
      and timezone('America/Costa_Rica', start_at)::date < v_week_start + 7;

    if v_active_reservations >= 3 then
      raise exception 'Ya alcanzaste el límite de 3 reservas activas esta semana';
    end if;

  end if;


  -- Crear la reserva.
  insert into public.reservations (
    user_id,
    room_id,
    start_at,
    end_at
  )
  values (
    v_user_id,
    p_room_id,
    p_start_at,
    p_end_at
  )
  returning id into v_reservation_id;


  return v_reservation_id;

end;
$$;


-- Nadie obtiene acceso automático a esta función.
revoke all
on function public.create_reservation(uuid, timestamptz, timestamptz)
from public;


-- Solamente usuarios autenticados pueden ejecutarla.
grant execute
on function public.create_reservation(uuid, timestamptz, timestamptz)
to authenticated;