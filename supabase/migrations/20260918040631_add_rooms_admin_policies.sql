-- El admin puede ver todas las salas, incluso las desactivadas.
create policy "admins_can_read_all_rooms"
on public.rooms
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

-- Permitimos INSERT y UPDATE a nivel de tabla.
-- RLS decidirá quién realmente puede hacerlo.
grant insert, update on table public.rooms to authenticated;

-- Solo admin puede crear salas.
create policy "admins_can_create_rooms"
on public.rooms
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
);

-- Solo admin puede editar o desactivar salas.
create policy "admins_can_update_rooms"
on public.rooms
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
);