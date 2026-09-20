-- Los clientes reciben solo los privilegios de tabla requeridos por la UI.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.rooms from anon, authenticated;
revoke all on table public.reservations from anon, authenticated;

grant select on table public.profiles to authenticated;
grant select, insert, update on table public.rooms to authenticated;
grant select on table public.reservations to authenticated;

-- Las RPC públicas requieren sesión aunque existan privilegios por defecto.
revoke all on function public.create_reservation(uuid, timestamptz, timestamptz)
  from public, anon;
revoke all on function public.get_room_availability(uuid, date)
  from public, anon;
grant execute on function public.create_reservation(uuid, timestamptz, timestamptz)
  to authenticated;
grant execute on function public.get_room_availability(uuid, date)
  to authenticated;

-- D3 conserva reservas de salas inactivas; su propietario puede seguir viendo
-- el nombre asociado sin abrir el catálogo completo de salas desactivadas.
create policy "users_can_view_rooms_with_own_reservations"
on public.rooms
for select
to authenticated
using (
  exists (
    select 1
    from public.reservations
    where reservations.room_id = rooms.id
      and reservations.user_id = auth.uid()
  )
);

-- La autorización se comprueba antes de revelar el estado de una reserva ajena.
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
  v_reason text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Debes iniciar sesión para cancelar una reserva';
  end if;

  select role
  into v_role
  from public.profiles
  where id = v_user_id;

  if v_role is null then
    raise exception 'No existe un perfil válido para este usuario';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
    and (user_id = v_user_id or v_role = 'admin')
  for update;

  if not found then
    raise exception 'La reserva no existe o no tienes permiso para cancelarla';
  end if;

  if v_reservation.status = 'cancelled' then
    raise exception 'La reserva ya está cancelada';
  end if;

  if v_reservation.start_at < now() + interval '2 hours' then
    raise exception 'La reserva solo puede cancelarse hasta 2 horas antes del inicio';
  end if;

  v_reason := nullif(btrim(p_reason), '');

  if v_role = 'admin' and v_reason is null then
    raise exception 'El administrador debe indicar un motivo de cancelación';
  end if;

  if char_length(v_reason) > 300 then
    raise exception 'El motivo de cancelación no puede superar 300 caracteres';
  end if;

  update public.reservations
  set
    status = 'cancelled',
    cancel_reason = v_reason,
    cancelled_at = now()
  where id = p_reservation_id;
end;
$$;

revoke all on function public.cancel_reservation(uuid, text) from public, anon;
grant execute on function public.cancel_reservation(uuid, text) to authenticated;
