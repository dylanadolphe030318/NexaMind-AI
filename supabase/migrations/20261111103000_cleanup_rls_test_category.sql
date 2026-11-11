begin;

create or replace function public.cleanup_rls_test_category(
  p_workspace_id uuid,
  p_category_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_category public.categories%rowtype;
  v_deleted_count integer;
begin
  if auth.uid() is null
     or not private.is_workspace_responsable(p_workspace_id) then
    raise exception 'Seul le responsable de cet espace peut nettoyer une catégorie de test.'
      using errcode = '42501';
  end if;

  if p_category_id is null then
    raise exception 'L’identifiant de la catégorie est obligatoire.'
      using errcode = '22023';
  end if;

  select category.*
  into v_category
  from public.categories as category
  where category.id = p_category_id
  for update;

  if not found then
    return false;
  end if;

  if v_category.workspace_id <> p_workspace_id then
    raise exception 'La catégorie ne fait pas partie de cet espace.'
      using errcode = '42501';
  end if;

  if v_category.name !~ '^RLS-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-renommée)?$' then
    raise exception 'La catégorie ne correspond pas au format exact d’une fixture RLS.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.resources as resource
    where resource.category_id = p_category_id
  ) then
    raise exception 'La catégorie de test est encore utilisée par une ressource.'
      using errcode = '23503';
  end if;

  delete from public.categories as category
  where category.id = p_category_id
    and category.workspace_id = p_workspace_id;
  get diagnostics v_deleted_count = row_count;

  return v_deleted_count = 1;
end;
$function$;

revoke all on function public.cleanup_rls_test_category(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.cleanup_rls_test_category(uuid, uuid)
  to authenticated;

commit;
