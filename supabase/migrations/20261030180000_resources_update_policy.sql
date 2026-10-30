-- Story 2.4 : modification d'une ressource par son propriétaire ou un responsable.
-- Pas de suppression (story 2.6). owner_id et workspace_id ne sont pas modifiables.

grant update (title, body, category_id, updated_at)
  on public.resources to authenticated;

drop policy if exists "Owners and managers can update resources"
  on public.resources;
create policy "Owners and managers can update resources"
  on public.resources
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or private.is_workspace_responsable(workspace_id)
  )
  with check (
    (
      owner_id = (select auth.uid())
      or private.is_workspace_responsable(workspace_id)
    )
    and exists (
      select 1
      from public.categories
      where categories.id = resources.category_id
        and categories.workspace_id = resources.workspace_id
    )
  );

create or replace function public.set_resources_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
  before update on public.resources
  for each row
  execute function public.set_resources_updated_at();
