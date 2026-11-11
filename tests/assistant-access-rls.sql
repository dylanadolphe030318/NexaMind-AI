-- 4.15 : preuve RLS d'une ressource existante mais inaccessible.
-- À exécuter uniquement dans une base de test isolée, avec le rôle postgres.
begin;

do $setup$
declare
  v_source_user uuid := gen_random_uuid();
  v_target_user uuid := gen_random_uuid();
  v_source_workspace uuid := gen_random_uuid();
  v_target_workspace uuid := gen_random_uuid();
  v_source_category uuid := gen_random_uuid();
  v_target_category uuid := gen_random_uuid();
  v_forbidden_resource uuid := gen_random_uuid();
  v_witness_resource uuid := gen_random_uuid();
  v_forbidden_chunk uuid := gen_random_uuid();
  v_witness_chunk uuid := gen_random_uuid();
  v_marker text := 'S9-INTERDIT-' || gen_random_uuid()::text;
  v_embedding extensions.vector(1536);
begin
  v_embedding := (
    '[' || '1' || pg_catalog.repeat(',0', 1535) || ']'
  )::extensions.vector(1536);

  insert into public.workspaces (id, name, is_default)
  values
    (v_source_workspace, 'Fixture 4.15 source', false),
    (v_target_workspace, 'Fixture 4.15 target', false);

  insert into auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      v_source_user,
      'authenticated',
      'authenticated',
      v_source_user::text || '@s9-fixture.invalid',
      '',
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    ),
    (
      v_target_user,
      'authenticated',
      'authenticated',
      v_target_user::text || '@s9-fixture.invalid',
      '',
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    );

  update public.profiles
  set workspace_id = case id
    when v_source_user then v_source_workspace
    when v_target_user then v_target_workspace
  end,
  role = 'membre'
  where id in (v_source_user, v_target_user);

  insert into public.categories (id, workspace_id, name)
  values
    (v_source_category, v_source_workspace, 'Fixture 4.15 source'),
    (v_target_category, v_target_workspace, 'Fixture 4.15 target');

  insert into public.resources (
    id,
    workspace_id,
    category_id,
    owner_id,
    title,
    body,
    revision,
    indexing_status
  )
  values
    (
      v_forbidden_resource,
      v_source_workspace,
      v_source_category,
      v_source_user,
      v_marker,
      'Fixture interdite ' || v_marker,
      1,
      'ready'
    ),
    (
      v_witness_resource,
      v_target_workspace,
      v_target_category,
      v_target_user,
      'Fixture témoin autorisée',
      'Contenu témoin autorisé pour le contrôle RLS.',
      1,
      'ready'
    );

  insert into public.resource_chunks (
    id,
    resource_id,
    revision,
    position,
    content,
    embedding
  )
  values
    (
      v_forbidden_chunk,
      v_forbidden_resource,
      1,
      0,
      'Passage interdit ' || v_marker,
      v_embedding
    ),
    (
      v_witness_chunk,
      v_witness_resource,
      1,
      0,
      'Passage témoin autorisé pour le contrôle RLS.',
      v_embedding
    );

  if not exists (
    select 1
    from public.resources
    where id = v_forbidden_resource
      and title = v_marker
      and indexing_status = 'ready'
  ) or not exists (
    select 1
    from public.resource_chunks
    where id = v_forbidden_chunk
      and resource_id = v_forbidden_resource
      and revision = 1
  ) then
    raise exception 'Le montage de la fixture interdite a échoué.';
  end if;

  if not exists (
    select 1
    from public.resources
    where id = v_witness_resource
      and title = 'Fixture témoin autorisée'
      and indexing_status = 'ready'
  ) or not exists (
    select 1
    from public.resource_chunks
    where id = v_witness_chunk
      and resource_id = v_witness_resource
      and revision = 1
  ) then
    raise exception 'Le montage de la fixture témoin a échoué.';
  end if;

  perform pg_catalog.set_config('s9_access.source_user_id', v_source_user::text, true);
  perform pg_catalog.set_config('s9_access.target_user_id', v_target_user::text, true);
  perform pg_catalog.set_config('s9_access.forbidden_resource_id', v_forbidden_resource::text, true);
  perform pg_catalog.set_config('s9_access.forbidden_chunk_id', v_forbidden_chunk::text, true);
  perform pg_catalog.set_config('s9_access.witness_resource_id', v_witness_resource::text, true);
  perform pg_catalog.set_config('s9_access.witness_chunk_id', v_witness_chunk::text, true);
  perform pg_catalog.set_config('s9_access.forbidden_marker', v_marker, true);
end;
$setup$;

set local role authenticated;

select
  set_config('request.jwt.claim.sub', current_setting('s9_access.source_user_id'), true),
  set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
      'sub', current_setting('s9_access.source_user_id'),
      'role', 'authenticated'
    )::text,
    true
  );

do $source_assertions$
begin
  if not exists (
    select 1
    from public.resources
    where id = current_setting('s9_access.forbidden_resource_id')::uuid
      and title = current_setting('s9_access.forbidden_marker')
  ) or not exists (
    select 1
    from public.resource_chunks
    where id = current_setting('s9_access.forbidden_chunk_id')::uuid
  ) then
    raise exception 'Le compte source ne voit pas sa fixture.';
  end if;

  if not exists (
    select 1
    from public.search_resource_chunks(
      (
        '[' || '1' || pg_catalog.repeat(',0', 1535) || ']'
      )::extensions.vector(1536),
      5,
      0.4
    )
    where resource_id = current_setting('s9_access.forbidden_resource_id')::uuid
  ) then
    raise exception 'La recherche source ne retrouve pas sa fixture prête.';
  end if;
end;
$source_assertions$;

select
  set_config('request.jwt.claim.sub', current_setting('s9_access.target_user_id'), true),
  set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
      'sub', current_setting('s9_access.target_user_id'),
      'role', 'authenticated'
    )::text,
    true
  );

do $target_assertions$
declare
  v_rpc_rows record;
begin
  if exists (
    select 1
    from public.resources
    where id = current_setting('s9_access.forbidden_resource_id')::uuid
       or title = current_setting('s9_access.forbidden_marker')
  ) or exists (
    select 1
    from public.resource_chunks
    where id = current_setting('s9_access.forbidden_chunk_id')::uuid
       or content like '%' || current_setting('s9_access.forbidden_marker') || '%'
  ) then
    raise exception 'La session cible voit une ressource interdite.';
  end if;

  if not exists (
    select 1
    from public.resources
    where id = current_setting('s9_access.witness_resource_id')::uuid
      and title = 'Fixture témoin autorisée'
  ) or not exists (
    select 1
    from public.resource_chunks
    where id = current_setting('s9_access.witness_chunk_id')::uuid
  ) then
    raise exception 'La session cible ne voit pas son témoin autorisé.';
  end if;

  for v_rpc_rows in
    select *
    from public.search_resource_chunks(
      (
        '[' || '1' || pg_catalog.repeat(',0', 1535) || ']'
      )::extensions.vector(1536),
      5,
      0.4
    )
  loop
    if v_rpc_rows.resource_id = current_setting('s9_access.forbidden_resource_id')::uuid
       or v_rpc_rows.title = current_setting('s9_access.forbidden_marker')
       or v_rpc_rows.content like '%' || current_setting('s9_access.forbidden_marker') || '%' then
      raise exception 'La RPC a retourné un passage interdit.';
    end if;
  end loop;

  if not exists (
    select 1
    from public.search_resource_chunks(
      (
        '[' || '1' || pg_catalog.repeat(',0', 1535) || ']'
      )::extensions.vector(1536),
      5,
      0.4
    )
    where resource_id = current_setting('s9_access.witness_resource_id')::uuid
  ) then
    raise exception 'La RPC ne retourne pas le témoin autorisé.';
  end if;
end;
$target_assertions$;

reset role;
rollback;
