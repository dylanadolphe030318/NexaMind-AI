-- Correction de revue (story 4.1) : la ressource est verrouillée pendant le changement de révision,
-- pour qu'une publication ou une relance simultanée ne laisse pas d'anciens passages.
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
  where id = p_resource_id
  for update;
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

revoke all on function public.begin_resource_revision(uuid, text, text, uuid)
  from public, anon;
grant execute on function public.begin_resource_revision(uuid, text, text, uuid)
  to authenticated;
