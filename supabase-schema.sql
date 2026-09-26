-- AimVaultCS Supabase schema
-- This is a separate table from the Valorant AimVault data.
create table if not exists public.cs2_crosshairs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  image_url text,
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  player text,
  is_pro boolean not null default false,
  published boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.cs2_crosshairs enable row level security;
drop policy if exists "Public can read published CS2 crosshairs" on public.cs2_crosshairs;
create policy "Public can read published CS2 crosshairs" on public.cs2_crosshairs for select using (published = true);
-- Admin writes should be done from a protected dashboard/server, never with a service_role key in frontend code.


-- Admin authentication/authorization. Create the user in Supabase Auth first, then insert their UUID here.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

drop policy if exists "Admins can read own admin record" on public.admin_users;
create policy "Admins can read own admin record" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_aimvaultcs_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

grant execute on function public.is_aimvaultcs_admin() to authenticated;

drop policy if exists "Admins can insert CS2 crosshairs" on public.cs2_crosshairs;
create policy "Admins can insert CS2 crosshairs" on public.cs2_crosshairs
  for insert to authenticated with check (public.is_aimvaultcs_admin());

drop policy if exists "Admins can update CS2 crosshairs" on public.cs2_crosshairs;
create policy "Admins can update CS2 crosshairs" on public.cs2_crosshairs
  for update to authenticated using (public.is_aimvaultcs_admin()) with check (public.is_aimvaultcs_admin());

drop policy if exists "Admins can delete CS2 crosshairs" on public.cs2_crosshairs;
create policy "Admins can delete CS2 crosshairs" on public.cs2_crosshairs
  for delete to authenticated using (public.is_aimvaultcs_admin());

drop policy if exists "Admins can read all CS2 crosshairs" on public.cs2_crosshairs;
create policy "Admins can read all CS2 crosshairs" on public.cs2_crosshairs
  for select to authenticated using (public.is_aimvaultcs_admin());


-- Required table privileges. RLS still limits which rows/actions are allowed.
grant select on public.cs2_crosshairs to anon;
grant select, insert, update, delete on public.cs2_crosshairs to authenticated;
grant select on public.admin_users to authenticated;

-- Live copy counts
alter table public.cs2_crosshairs
  add column if not exists copy_count integer not null default 0;

create or replace function public.increment_cs2_copy_count(p_crosshair_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.cs2_crosshairs
     set copy_count = coalesce(copy_count, 0) + 1
   where id = p_crosshair_id
     and published = true
  returning copy_count into v_count;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.increment_cs2_copy_count(uuid) from public;
grant execute on function public.increment_cs2_copy_count(uuid) to anon, authenticated;

-- Enable realtime updates so copy counts can change on already-open pages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'cs2_crosshairs'
  ) then
    alter publication supabase_realtime add table public.cs2_crosshairs;
  end if;
exception when undefined_object then
  -- Realtime publication may not exist on some projects; copy counting still works.
  null;
end;
$$;
