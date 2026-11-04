-- Correction de revue (story 4.2) : limite le nombre de passages publiés par ressource.
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
  v_expected_count integer;
  v_inserted_count integer;
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

  if jsonb_typeof(p_chunks) is distinct from 'array' then
    raise exception 'Embedded passages must be provided as an array';
  end if;

  if jsonb_array_length(p_chunks) = 0 then
    raise exception 'At least one embedded passage is required';
  end if;

  if jsonb_array_length(p_chunks) > 100 then
    raise exception 'Too many passages (maximum 100)';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_chunks) as item(value)
    where jsonb_typeof(item.value -> 'content') is distinct from 'string'
      or nullif(btrim(item.value ->> 'content'), '') is null
      or jsonb_typeof(item.value -> 'embedding') is distinct from 'array'
      or case
        when jsonb_typeof(item.value -> 'embedding') = 'array'
          then jsonb_array_length(item.value -> 'embedding')
        else 0
      end <> 1536
  ) then
    raise exception 'Every passage must have a 1536-dimensional embedding';
  end if;

  v_expected_count := jsonb_array_length(p_chunks);
  delete from public.resource_chunks where resource_id = p_resource_id;

  insert into public.resource_chunks (
    resource_id,
    revision,
    position,
    content,
    embedding
  )
  select
    p_resource_id,
    p_revision,
    (item.ordinality - 1)::integer,
    item.value ->> 'content',
    (item.value ->> 'embedding')::extensions.vector(1536)
  from jsonb_array_elements(p_chunks) with ordinality as item(value, ordinality);

  get diagnostics v_inserted_count = row_count;
  if v_inserted_count <> v_expected_count then
    raise exception 'Not all passages were stored';
  end if;

  update public.resources
  set indexing_status = 'ready'
  where id = p_resource_id and revision = p_revision;

  return found;
end;
$function$;

revoke all on function public.publish_resource_chunks(uuid, integer, jsonb)
  from public, anon;
grant execute on function public.publish_resource_chunks(uuid, integer, jsonb)
  to authenticated;
