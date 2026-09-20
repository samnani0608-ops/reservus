-- Permite que usuarios autenticados consulten reservations.
-- RLS decide qué filas puede ver cada usuario.
grant select on table public.reservations to authenticated;


-- Un miembro solo puede ver sus propias reservas.
create policy "users_can_read_own_reservations"
on public.reservations
for select
to authenticated
using (
  user_id = auth.uid()
);


-- Un administrador puede ver todas las reservas.
create policy "admins_can_read_all_reservations"
on public.reservations
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
);