create table public.rooms (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    capacity integer not null check (capacity > 0),
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;