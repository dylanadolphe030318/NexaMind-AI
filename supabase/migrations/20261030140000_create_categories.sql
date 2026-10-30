create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_responsable(_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.workspace_id = _workspace_id
      and profiles.role = 'responsable'
  );
$function$;

revoke all on function private.is_workspace_responsable(uuid)
  from public, anon, authenticated;
grant execute on function private.is_workspace_responsable(uuid)
  to authenticated;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  name text not null check (name ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);

create index if not exists categories_workspace_name_idx
  on public.categories (workspace_id, name);

alter table public.categories enable row level security;

revoke all on public.categories from anon, authenticated;
grant select on public.categories to authenticated;
grant insert (workspace_id, name) on public.categories to authenticated;
grant update (name) on public.categories to authenticated;

drop policy if exists "Workspace members can read categories"
  on public.categories;
create policy "Workspace members can read categories"
  on public.categories
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.workspace_id = categories.workspace_id
    )
  );

drop policy if exists "Responsables can create categories"
  on public.categories;
create policy "Responsables can create categories"
  on public.categories
  for insert
  to authenticated
  with check (private.is_workspace_responsable(workspace_id));

drop policy if exists "Responsables can rename categories"
  on public.categories;
create policy "Responsables can rename categories"
  on public.categories
  for update
  to authenticated
  using (private.is_workspace_responsable(workspace_id))
  with check (private.is_workspace_responsable(workspace_id));
