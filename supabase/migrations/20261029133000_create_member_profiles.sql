create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists workspaces_one_default_idx
  on public.workspaces (is_default)
  where is_default;

insert into public.workspaces (name, is_default)
values ('Espace NexaMind', true)
on conflict do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  role text not null check (role in ('membre', 'responsable')),
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;

revoke all on public.workspaces from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.workspaces to authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Members can read their workspace"
  on public.workspaces;
create policy "Members can read their workspace"
  on public.workspaces
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.workspace_id = workspaces.id
    )
  );

drop policy if exists "Members can read their own profile"
  on public.profiles;
create policy "Members can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create or replace function public.create_member_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  default_workspace_id uuid;
begin
  select id
  into default_workspace_id
  from public.workspaces
  where is_default
  order by created_at
  limit 1;

  if default_workspace_id is null then
    raise exception 'The default workspace must exist before member registration.';
  end if;

  insert into public.profiles (id, workspace_id, role)
  values (new.id, default_workspace_id, 'membre');

  return new;
end;
$function$;

revoke all on function public.create_member_profile_for_auth_user()
  from public, anon, authenticated;

drop trigger if exists create_member_profile_after_auth_signup
  on auth.users;
create trigger create_member_profile_after_auth_signup
  after insert on auth.users
  for each row
  execute function public.create_member_profile_for_auth_user();
