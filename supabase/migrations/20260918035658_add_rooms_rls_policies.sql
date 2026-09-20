-- Permite que usuarios autenticados consulten la tabla rooms.
-- RLS decidirá qué filas pueden ver.
grant select on table public.rooms to authenticated;

-- M1: los miembros pueden ver únicamente las salas activas.
create policy "authenticated_users_can_read_active_rooms"
on public.rooms
for select
to authenticated
using (
  is_active = true
);