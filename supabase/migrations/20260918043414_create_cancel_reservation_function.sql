-- Cancela una reserva de forma segura.
-- Un miembro solo puede cancelar sus propias reservas.
-- Un admin puede cancelar reservas de cualquier usuario.

create or replace function public.cancel_reservation(
  p_reservation_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role public.user_role;
  v_reservation public.reservations%rowtype;
begin

  -- Obtener usuario autenticado.
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Debes iniciar sesión para cancelar una reserva';
  end if;


  -- Obtener el rol del usuario.
  select role
  into v_role
  from public.profiles
  where id = v_user_id;

  if v_role is null then
    raise exception 'No existe un perfil para este usuario';
  end if;


  -- Buscar y bloquear temporalmente la reserva mientras se procesa.
  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'La reserva no existe';
  end if;


  -- No se puede cancelar dos veces.
  if v_reservation.status <> 'active' then
    raise exception 'La reserva ya está cancelada';
  end if;


  -- Un miembro solo puede cancelar sus propias reservas.
  if v_role = 'member'
     and v_reservation.user_id <> v_user_id then
    raise exception 'No puedes cancelar la reserva de otro usuario';
  end if;


  -- RN-07: mínimo 2 horas antes del inicio.
  if v_reservation.start_at < now() + interval '2 hours' then
    raise exception 'La reserva solo puede cancelarse hasta 2 horas antes de su inicio';
  end if;


  -- El admin debe indicar motivo.
  if v_role = 'admin'
     and (p_reason is null or trim(p_reason) = '') then
    raise exception 'El administrador debe indicar un motivo de cancelación';
  end if;


  -- Cancelar sin borrar la reserva.
  update public.reservations
  set
    status = 'cancelled',
    cancel_reason = p_reason,
    cancelled_at = now()
  where id = p_reservation_id;

end;
$$;


-- Nadie puede ejecutar la función automáticamente.
revoke all
on function public.cancel_reservation(uuid, text)
from public;


-- Solo usuarios autenticados.
grant execute
on function public.cancel_reservation(uuid, text)
to authenticated;