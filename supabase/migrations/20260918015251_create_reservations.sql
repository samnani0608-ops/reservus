create type public.reservations_status as enum ('active', 'cancelled');

create table public.reservations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    room_id uuid not null references public.rooms(id),
    start_at timestamptz not null,
    end_at timestamptz not null,
    status public.reservations_status not null default 'active',
    cancel_reason text,
    canceled_at timestamptz,
    created_at timestamptz not null default now(),
    check (end_at > start_at)
);

alter table public.reservations enable row level security;
