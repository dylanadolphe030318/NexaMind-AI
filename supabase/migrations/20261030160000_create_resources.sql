-- Story 2.2 : ressources partagées en lecture seule.
-- Pas de colonnes d'indexation IA (Epic 4). Aucune écriture pour l'instant.

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (title ~ '[^[:space:]]'),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resources_workspace_updated_idx
  on public.resources (workspace_id, updated_at desc);
create index if not exists resources_category_idx
  on public.resources (category_id);
create index if not exists resources_owner_idx
  on public.resources (owner_id);

alter table public.resources enable row level security;

revoke all on public.resources from anon, authenticated;
grant select on public.resources to authenticated;

drop policy if exists "Workspace members can read resources"
  on public.resources;
create policy "Workspace members can read resources"
  on public.resources
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.workspace_id = resources.workspace_id
    )
  );
