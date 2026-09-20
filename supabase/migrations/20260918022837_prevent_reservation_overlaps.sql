-- Permite usar igualdad con UUID dentro de índices GiST
create extension if not exists btree_gist;

-- RN-01: impedir reservas activas solapadas en la misma sala
alter table public.reservations
add constraint reservations_no_overlap
exclude using gist (
    room_id with =,
    tstzrange(start_at, end_at, '[)') with &&
)
where (status = 'active');