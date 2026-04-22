create extension if not exists pgcrypto;

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  impact_summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  is_admin boolean not null default false,
  charity_id uuid references public.charities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  score integer not null check (score between 1 and 45),
  played_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_on)
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  draw_date date not null default current_date,
  drawn_numbers integer[] not null check (array_length(drawn_numbers, 1) = 5),
  status text not null default 'published' check (status in ('simulated', 'published')),
  triggered_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.charities (name, description, impact_summary)
values
  ('Bright Start Fund', 'Supports education access for young people in underserved communities.', 'Learning materials and mentoring support'),
  ('Open Table Kitchen', 'Funds reliable meals and practical support for families facing food insecurity.', 'Community meals and weekly essentials'),
  ('Green Steps Trust', 'Backs local climate resilience projects and neighbourhood greening.', 'Urban planting and climate education'),
  ('CareLine Network', 'Provides wellbeing check-ins and emergency grants for vulnerable adults.', 'Wellbeing calls and small crisis grants')
on conflict (name) do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.users.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.keep_latest_five_scores()
returns trigger
language plpgsql
as $$
begin
  delete from public.scores
  where id in (
    select id
    from public.scores
    where user_id = new.user_id
    order by played_on desc, created_at desc
    offset 5
  );

  return new;
end;
$$;

drop trigger if exists scores_keep_latest_five on public.scores;
create trigger scores_keep_latest_five
after insert or update on public.scores
for each row execute function public.keep_latest_five_scores();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and is_admin = true
  );
$$;

alter table public.users enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;
alter table public.draws enable row level security;

drop policy if exists "Users can read own profile or admins read all" on public.users;
create policy "Users can read own profile or admins read all"
on public.users for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can create own profile" on public.users;
create policy "Users can create own profile"
on public.users for insert
to authenticated
with check (id = auth.uid() and is_admin = false);

drop policy if exists "Users can update own non-admin profile or admins update all" on public.users;
create policy "Users can update own non-admin profile or admins update all"
on public.users for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (
  public.is_admin()
  or (
    id = auth.uid()
    and is_admin = false
  )
);

drop policy if exists "Authenticated users can read charities" on public.charities;
create policy "Authenticated users can read charities"
on public.charities for select
to authenticated
using (true);

drop policy if exists "Admins can manage charities" on public.charities;
create policy "Admins can manage charities"
on public.charities for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read own scores or admins read all" on public.scores;
create policy "Users read own scores or admins read all"
on public.scores for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users create own scores" on public.scores;
create policy "Users create own scores"
on public.scores for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users update own scores or admins update all" on public.scores;
create policy "Users update own scores or admins update all"
on public.scores for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users delete own scores or admins delete all" on public.scores;
create policy "Users delete own scores or admins delete all"
on public.scores for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can read draws" on public.draws;
create policy "Authenticated users can read draws"
on public.draws for select
to authenticated
using (true);

drop policy if exists "Admins can create draws" on public.draws;
create policy "Admins can create draws"
on public.draws for insert
to authenticated
with check (public.is_admin());
