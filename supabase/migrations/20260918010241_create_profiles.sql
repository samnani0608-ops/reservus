create type public.user_role as enum ('member', 'admin');

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role public.user_role not null default 'member',
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;