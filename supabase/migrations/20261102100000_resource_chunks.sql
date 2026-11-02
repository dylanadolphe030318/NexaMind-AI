-- Story 4.1 : passages d'une ressource (texte découpé), état d'indexation et révision.
-- Les écritures passent uniquement par des fonctions atomiques appelées avec la session
-- de la personne (propriétaire ou responsable) ; aucune clé service_role.

-- La date de modification ne change que si le contenu de la ressource change
-- (pas pour un simple changement d'état d'indexation).
create or replace function public.set_resources_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if (new.title, new.body, new.category_id)
    is distinct from (old.title, old.body, old.category_id) then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;
  return new;
end;
$function$;

do $migration$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resources'
      and column_name = 'indexing_status'
  ) then
    alter table public.resources
      add column revision integer not null default 1,
      add column indexing_status text not null default 'processing'
        check (indexing_status in ('processing', 'ready', 'failed'));
    -- Les ressources déjà présentes n'ont pas de passages : à relancer par leur propriétaire.
    update public.resources set indexing_status = 'failed';
  end if;
end
$migration$;

create table if not exists public.resource_chunks (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  revision integer not null,
  position integer not null check (position >= 0),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (resource_id, position)
);

create index if not exists resource_chunks_resource_idx
  on public.resource_chunks (resource_id);

alter table public.resource_chunks enable row level security;

revoke all on public.resource_chunks from anon, authenticated;
grant select on public.resource_chunks to authenticated;

drop policy if exists "Members can read chunks of accessible resources"
  on public.resource_chunks;
create policy "Members can read chunks of accessible resources"
  on public.resource_chunks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.resources
      where resources.id = resource_chunks.resource_id
    )
  );

-- Début d'une révision : met à jour le texte, incrémente la révision, retire les anciens
-- passages. Retourne la nouvelle révision, ou null si l'action n'est pas autorisée.
create or replace function public.begin_resource_revision(
  p_resource_id uuid,
  p_title text,
  p_body text,
  p_category_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace uuid;
  v_owner uuid;
  v_revision integer;
begin
  select workspace_id, owner_id into v_workspace, v_owner
  from public.resources
  where id = p_resource_id;
  if not found then
    return null;
  end if;

  if not (
    v_owner = (select auth.uid())
    or private.is_workspace_responsable(v_workspace)
  ) then
    return null;
  end if;

  if not exists (
    select 1 from public.categories
    where id = p_category_id and workspace_id = v_workspace
  ) then
    return null;
  end if;

  delete from public.resource_chunks where resource_id = p_resource_id;

  update public.resources
  set title = p_title,
      body = p_body,
      category_id = p_category_id,
      revision = revision + 1,
      indexing_status = 'processing'
  where id = p_resource_id
  returning revision into v_revision;

  return v_revision;
end;
$function$;

-- Publication des passages : acceptée seulement pour la révision courante.
create or replace function public.publish_resource_chunks(
  p_resource_id uuid,
  p_revision integer,
  p_chunks jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace uuid;
  v_owner uuid;
  v_current integer;
begin
  select workspace_id, owner_id, revision into v_workspace, v_owner, v_current
  from public.resources
  where id = p_resource_id
  for update;
  if not found then
    return false;
  end if;

  if not (
    v_owner = (select auth.uid())
    or private.is_workspace_responsable(v_workspace)
  ) then
    return false;
  end if;

  if v_current <> p_revision then
    return false;
  end if;

  delete from public.resource_chunks where resource_id = p_resource_id;

  insert into public.resource_chunks (resource_id, revision, position, content)
  select p_resource_id, p_revision, (item.ordinality - 1)::integer, item.value ->> 'content'
  from jsonb_array_elements(p_chunks) with ordinality as item(value, ordinality);

  return true;
end;
$function$;

-- Marque la révision courante en échec (ressource non interrogeable).
create or replace function public.mark_resource_failed(
  p_resource_id uuid,
  p_revision integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace uuid;
  v_owner uuid;
begin
  select workspace_id, owner_id into v_workspace, v_owner
  from public.resources
  where id = p_resource_id;
  if not found then
    return false;
  end if;

  if not (
    v_owner = (select auth.uid())
    or private.is_workspace_responsable(v_workspace)
  ) then
    return false;
  end if;

  update public.resources
  set indexing_status = 'failed'
  where id = p_resource_id and revision = p_revision;

  return found;
end;
$function$;

revoke all on function public.begin_resource_revision(uuid, text, text, uuid)
  from public, anon;
revoke all on function public.publish_resource_chunks(uuid, integer, jsonb)
  from public, anon;
revoke all on function public.mark_resource_failed(uuid, integer)
  from public, anon;
grant execute on function public.begin_resource_revision(uuid, text, text, uuid)
  to authenticated;
grant execute on function public.publish_resource_chunks(uuid, integer, jsonb)
  to authenticated;
grant execute on function public.mark_resource_failed(uuid, integer)
  to authenticated;
