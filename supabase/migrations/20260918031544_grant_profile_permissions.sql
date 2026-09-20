-- Permite a usuarios autenticados consultar profiles.
-- RLS decide qué perfiles pueden ver realmente.
grant select on table public.profiles to authenticated;