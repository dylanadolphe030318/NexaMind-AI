-- Relance atomique d'une préparation en échec, réservée au propriétaire ou au responsable.
create or replace function public.begin_resource_reindexing(
  p_resource_id uuid,
  p_revision integer
)
returns table (id uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace uuid;
  v_owner uuid;
  v_revision integer;
  v_status text;
begin
  select workspace_id, owner_id, revision, indexing_status
    into v_workspace, v_owner, v_revision, v_status
  from public.resources as resource
  where resource.id = p_resource_id
  for update;
  if not found then
    return;
  end if;

  if v_revision <> p_revision or v_status <> 'failed' then
    return;
  end if;

  if not (
    v_owner = (select auth.uid())
    or private.is_workspace_responsable(v_workspace)
  ) then
    return;
  end if;

  return query
  update public.resources as resource
  set indexing_status = 'processing'
  where resource.id = p_resource_id
    and resource.revision = p_revision
    and resource.indexing_status = 'failed'
  returning resource.id;
end;
$function$;

revoke all on function public.begin_resource_reindexing(uuid, integer)
  from public, anon;
grant execute on function public.begin_resource_reindexing(uuid, integer)
  to authenticated;
