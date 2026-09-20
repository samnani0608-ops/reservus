-- Permite que cada usuario lea únicamente su propio perfil
create policy "users_can_read_own_profile"
on public.profiles
for select
to authenticated
using(
    id = auth.uid()
);

-- Los usuarios no pueden crear perfiles manualmente.
-- El perfil se crea mediante el trigger de registro.
create policy "users_cannot_insert_profiles"
on public.profiles
for insert
to authenticated
with check (false);

-- Los usuarios no pueden modificar su perfil directamente.
-- Esto evita, entre otras cosas, cambiar su propio rol a admin.
create policy "users_cannot_update_profiles"
on public.profiles
for update
to authenticated
using (false)
with check (false);

-- Los usuarios tampoco pueden borrar perfiles desde la aplicación.
create policy "users_cannot_delete_profiles"
on public.profiles
for delete
to authenticated
using (false);