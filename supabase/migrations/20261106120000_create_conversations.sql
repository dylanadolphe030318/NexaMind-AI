-- Story 4.10 : conversations privées, questions persistées et références de sources.
begin;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_question_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index conversations_owner_active_idx
  on public.conversations (owner_id, last_question_at desc);
create index conversations_expiration_idx
  on public.conversations (expires_at);

create table public.messages (
  id uuid primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (content ~ '[^[:space:]]'),
  status text not null check (
    status in ('generating', 'complete', 'failed', 'no-context', 'unknown', 'rate-limited')
  ),
  generation_started_at timestamptz,
  generation_token uuid,
  question_id uuid references public.messages (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (conversation_id, id),
  foreign key (conversation_id, question_id)
    references public.messages (conversation_id, id) on delete cascade,
  check (
    (role = 'user' and question_id is null)
    or (role = 'assistant' and question_id is not null and status = 'complete')
  ),
  check (
    (status = 'generating' and generation_started_at is not null and generation_token is not null)
    or (status <> 'generating' and generation_started_at is null and generation_token is null)
  )
);

create unique index messages_one_answer_per_question_idx
  on public.messages (question_id)
  where question_id is not null;
create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create table public.message_sources (
  id uuid primary key default gen_random_uuid(),
  answer_message_id uuid not null references public.messages (id) on delete cascade,
  resource_id uuid references public.resources (id) on delete set null,
  chunk_id uuid references public.resource_chunks (id) on delete set null,
  resource_revision integer,
  created_at timestamptz not null default now(),
  unique (answer_message_id, chunk_id)
);

create index message_sources_answer_idx on public.message_sources (answer_message_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_sources enable row level security;

revoke all on public.conversations, public.messages, public.message_sources
  from public, anon, authenticated;
grant select on public.conversations, public.messages, public.message_sources to authenticated;

create policy "Members read their active conversations"
  on public.conversations
  for select
  to authenticated
  using (owner_id = (select auth.uid()) and expires_at > now());

create policy "Members read messages in their active conversations"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.owner_id = (select auth.uid())
        and conversations.expires_at > now()
    )
  );

create policy "Members read sources in their active conversations"
  on public.message_sources
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages
      join public.conversations
        on conversations.id = messages.conversation_id
      where messages.id = message_sources.answer_message_id
        and conversations.owner_id = (select auth.uid())
        and conversations.expires_at > now()
    )
  );

-- A stable question UUID makes retries idempotent and serializes concurrent claims.
create or replace function public.claim_conversation_question(
  p_question_id uuid,
  p_question text
)
returns table (conversation_id uuid, question_status text, claimed boolean, generation_token uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_conversation_id uuid;
  v_owner_id uuid;
  v_role text;
  v_content text;
  v_status text;
  v_expires_at timestamptz;
  v_started_at timestamptz;
  v_generation_token uuid;
  v_question text := pg_catalog.regexp_replace(
    p_question, '^[[:space:]]+|[[:space:]]+$', '', 'g'
  );
begin
  if v_user is null then
    return query select null::uuid, 'unauthenticated'::text, false, null::uuid;
    return;
  end if;

  if p_question_id is null
    or p_question is null
    or char_length(v_question) not between 1 and 300 then
    return query select null::uuid, 'invalid'::text, false, null::uuid;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_question_id::text, 0)
  );

  select message.conversation_id,
         conversation.owner_id,
         message.role,
         message.content,
         message.status,
         conversation.expires_at,
         message.generation_started_at
    into v_conversation_id,
         v_owner_id,
         v_role,
         v_content,
         v_status,
         v_expires_at,
         v_started_at
  from public.messages as message
  join public.conversations as conversation
    on conversation.id = message.conversation_id
  where message.id = p_question_id
  for update of message, conversation;

  if found then
    if v_owner_id <> v_user or v_role <> 'user' then
      return query select null::uuid, 'unavailable'::text, false, null::uuid;
      return;
    end if;
    if v_content <> v_question then
      return query select null::uuid, 'conflict'::text, false, null::uuid;
      return;
    end if;
    if v_expires_at <= now() then
      return query select v_conversation_id, 'expired'::text, false, null::uuid;
      return;
    end if;

    if v_status in ('failed', 'rate-limited')
      or (
        v_status = 'generating'
        and (v_started_at is null or v_started_at <= now() - interval '90 seconds')
      ) then
      update public.messages
      set status = 'generating',
          generation_started_at = now(),
          generation_token = gen_random_uuid()
      where id = p_question_id;

      select message.generation_token into v_generation_token
      from public.messages as message
      where message.id = p_question_id;
      return query select v_conversation_id, 'generating'::text, true, v_generation_token;
      return;
    end if;

    return query select v_conversation_id, v_status, false, null::uuid;
    return;
  end if;

  insert into public.conversations (owner_id)
  values (v_user)
  returning id into v_conversation_id;

  insert into public.messages (
    id,
    conversation_id,
    role,
    content,
    status,
    generation_started_at,
    generation_token
  )
  values (
    p_question_id,
    v_conversation_id,
    'user',
    v_question,
    'generating',
    now(),
    gen_random_uuid()
  );

  select message.generation_token into v_generation_token
  from public.messages as message
  where message.id = p_question_id;
  return query select v_conversation_id, 'generating'::text, true, v_generation_token;
end;
$function$;

create or replace function public.finish_conversation_question(
  p_question_id uuid,
  p_generation_token uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null or p_status is null
    or p_status not in ('failed', 'no-context', 'unknown', 'rate-limited') then
    return false;
  end if;

  update public.messages as message
  set status = p_status,
      generation_started_at = null,
      generation_token = null
  from public.conversations as conversation
  where message.id = p_question_id
    and message.role = 'user'
    and message.status = 'generating'
    and message.generation_token = p_generation_token
    and message.conversation_id = conversation.id
    and conversation.owner_id = v_user
    and conversation.expires_at > now();

  return found;
end;
$function$;

create or replace function public.finalize_conversation_answer(
  p_question_id uuid,
  p_generation_token uuid,
  p_answer text,
  p_sources jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_conversation_id uuid;
  v_answer_id uuid := gen_random_uuid();
  v_source jsonb;
  v_resource_id uuid;
  v_requested_resource_id uuid;
  v_chunk_id uuid;
  v_revision integer;
begin
  if v_user is null
    or p_answer is null
    or char_length(btrim(p_answer)) = 0
    or char_length(p_answer) > 20000
    or jsonb_typeof(p_sources) is distinct from 'array'
    or jsonb_array_length(p_sources) > 5 then
    return false;
  end if;

  select message.conversation_id
    into v_conversation_id
  from public.messages as message
  join public.conversations as conversation
    on conversation.id = message.conversation_id
  where message.id = p_question_id
    and message.role = 'user'
    and message.status = 'generating'
    and message.generation_token = p_generation_token
    and conversation.owner_id = v_user
    and conversation.expires_at > now()
  for update of message, conversation;

  if not found then
    return false;
  end if;

  insert into public.messages (id, conversation_id, role, content, status, question_id)
  values (v_answer_id, v_conversation_id, 'assistant', btrim(p_answer), 'complete', p_question_id);

  for v_source in select value from jsonb_array_elements(p_sources) as source(value)
  loop
    begin
      v_requested_resource_id := (v_source ->> 'resourceId')::uuid;
      v_chunk_id := nullif(v_source ->> 'chunkId', '')::uuid;
      v_revision := nullif(v_source ->> 'revision', '')::integer;
    exception when others then
      raise exception 'Invalid source reference';
    end;

    if v_requested_resource_id is null then
      raise exception 'Invalid source reference';
    end if;

    select resource.id
      into v_resource_id
    from public.resources as resource
    join public.profiles as profile
      on profile.workspace_id = resource.workspace_id
    where resource.id = v_requested_resource_id
      and profile.id = v_user
    for key share of resource;

    if not found then
      v_resource_id := null;
      v_chunk_id := null;
    else
      v_chunk_id := (
        select chunk.id
        from public.resource_chunks as chunk
        join public.resources as resource on resource.id = chunk.resource_id
        where chunk.id = v_chunk_id
          and chunk.resource_id = v_resource_id
          and chunk.revision = v_revision
          and resource.revision = v_revision
          and resource.indexing_status = 'ready'
      );
    end if;

    insert into public.message_sources (
      answer_message_id,
      resource_id,
      chunk_id,
      resource_revision
    )
    values (
      v_answer_id,
      v_resource_id,
      v_chunk_id,
      v_revision
    );
  end loop;

  update public.messages
  set status = 'complete',
      generation_started_at = null,
      generation_token = null
  where id = p_question_id
    and generation_token = p_generation_token;

  return found;
end;
$function$;

revoke all on function public.claim_conversation_question(uuid, text) from public, anon;
revoke all on function public.finish_conversation_question(uuid, uuid, text) from public, anon;
revoke all on function public.finalize_conversation_answer(uuid, uuid, text, jsonb) from public, anon;
grant execute on function public.claim_conversation_question(uuid, text) to authenticated;
grant execute on function public.finish_conversation_question(uuid, uuid, text) to authenticated;
grant execute on function public.finalize_conversation_answer(uuid, uuid, text, jsonb) to authenticated;

-- Called only by a separately configured Supabase Cron job; RLS already hides expired rows.
create or replace function public.purge_expired_conversations()
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_deleted bigint;
begin
  delete from public.conversations where expires_at <= now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

revoke all on function public.purge_expired_conversations() from public, anon, authenticated;
grant execute on function public.purge_expired_conversations() to postgres;

-- Return passage identifiers without changing either search's scoring or ordering.
drop function if exists public.search_resource_chunks(extensions.vector, integer, real);
create function public.search_resource_chunks(
  p_query_embedding extensions.vector(1536),
  p_limit integer default 5,
  p_min_similarity real default 0.3
)
returns table (
  chunk_id uuid,
  resource_id uuid,
  revision integer,
  title text,
  content text,
  similarity real
)
language sql
stable
security invoker
set search_path = ''
as $function$
  with scored as (
    select
      chunk.id as chunk_id,
      chunk.resource_id,
      chunk.revision,
      resource.title,
      chunk.content,
      (1 - (chunk.embedding operator(extensions.<=>) p_query_embedding))::real as similarity
    from public.resource_chunks as chunk
    join public.resources as resource on resource.id = chunk.resource_id
    where chunk.embedding is not null
  )
  select
    scored.chunk_id,
    scored.resource_id,
    scored.revision,
    scored.title,
    scored.content,
    scored.similarity
  from scored
  where scored.similarity >= p_min_similarity
  order by scored.similarity desc
  limit least(greatest(coalesce(p_limit, 5), 1), 5);
$function$;

revoke all on function public.search_resource_chunks(extensions.vector, integer, real)
  from public, anon;
grant execute on function public.search_resource_chunks(extensions.vector, integer, real)
  to authenticated;

drop function if exists public.search_resource_chunks_hybrid(extensions.vector, text, integer, real);
create function public.search_resource_chunks_hybrid(
  p_query_embedding extensions.vector(1536),
  p_query_text text,
  p_limit integer default 5,
  p_min_similarity real default 0.3
)
returns table (
  chunk_id uuid,
  resource_id uuid,
  revision integer,
  title text,
  content text,
  similarity real,
  ranking_score real
)
language sql
stable
security invoker
set search_path = ''
as $function$
  with scored as (
    select
      chunk.id as chunk_id,
      chunk.resource_id,
      chunk.revision,
      resource.title,
      chunk.content,
      (1 - (chunk.embedding operator(extensions.<=>) p_query_embedding))::real as similarity,
      pg_catalog.setweight(
        pg_catalog.to_tsvector('pg_catalog.simple'::pg_catalog.regconfig, coalesce(resource.title, '')),
        'A'
      ) ||
      pg_catalog.setweight(
        pg_catalog.to_tsvector('pg_catalog.simple'::pg_catalog.regconfig, coalesce(chunk.content, '')),
        'B'
      ) as text_vector
    from public.resource_chunks as chunk
    join public.resources as resource on resource.id = chunk.resource_id
    where chunk.embedding is not null
  ),
  best as (
    select max(scored.similarity) as similarity
    from scored
  ),
  lexical_query as (
    select case
      when terms.value is null then null
      else pg_catalog.to_tsquery('pg_catalog.simple'::pg_catalog.regconfig, terms.value)
    end as query
    from (
      select pg_catalog.string_agg(token, ' | ') as value
      from pg_catalog.regexp_split_to_table(
        pg_catalog.lower(coalesce(p_query_text, '')),
        '[^[:alnum:]_]+'
      ) as tokens(token)
      where token <> ''
    ) as terms
  ),
  query_identifiers as (
    select distinct capture.identifier[1] as identifier
    from pg_catalog.regexp_matches(
      coalesce(p_query_text, ''),
      '([0-9]+[.][0-9]+)',
      'g'
    ) as capture(identifier)
  ),
  eligible as (
    select scored.*
    from scored
    cross join best
    where scored.similarity >= p_min_similarity
      and scored.similarity >= best.similarity - 0.10::real
  ),
  lexical_scored as (
    select
      eligible.*,
      exists (
        select 1
        from query_identifiers
        where pg_catalog.strpos(
          ' ' || pg_catalog.regexp_replace(
            coalesce(eligible.content, ''),
            '[^0-9.]+',
            ' ',
            'g'
          ) || ' ',
          ' ' || query_identifiers.identifier || ' '
        ) > 0
      ) as matches_identifier,
      case
        when lexical_query.query is null then 0::real
        else pg_catalog.ts_rank_cd(eligible.text_vector, lexical_query.query, 32)
      end as text_rank
    from eligible
    cross join lexical_query
  ),
  normalized as (
    select
      lexical_scored.*,
      case
        when max(lexical_scored.text_rank) over () > 0
          then lexical_scored.text_rank / max(lexical_scored.text_rank) over ()
        else 0
      end as normalized_text_rank
    from lexical_scored
  )
  select
    normalized.chunk_id,
    normalized.resource_id,
    normalized.revision,
    normalized.title,
    normalized.content,
    normalized.similarity,
    (normalized.similarity + normalized.normalized_text_rank * 0.10::real)::real as ranking_score
  from normalized
  order by normalized.matches_identifier desc, ranking_score desc, normalized.similarity desc
  limit least(greatest(coalesce(p_limit, 5), 1), 5);
$function$;

revoke all on function public.search_resource_chunks_hybrid(extensions.vector, text, integer, real)
  from public, anon;
grant execute on function public.search_resource_chunks_hybrid(extensions.vector, text, integer, real)
  to authenticated;

commit;
