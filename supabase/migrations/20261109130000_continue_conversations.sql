-- Story 4.12: atomically add a question to an existing owned conversation.
begin;

create or replace function public.claim_conversation_question_in_conversation(
  p_question_id uuid,
  p_question text,
  p_conversation_id uuid
)
returns table (conversation_id uuid, question_status text, claimed boolean, generation_token uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_conversation_owner uuid;
  v_expires_at timestamptz;
  v_question_conversation_id uuid;
  v_question_owner uuid;
  v_role text;
  v_content text;
  v_status text;
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

  if p_question_id is null or p_question is null
    or pg_catalog.char_length(v_question) not between 1 and 300 then
    return query select p_conversation_id, 'invalid'::text, false, null::uuid;
    return;
  end if;

  if p_conversation_id is null then
    return query select null::uuid, 'unavailable'::text, false, null::uuid;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_question_id::text, 0)
  );

  select conversation.owner_id, conversation.expires_at
    into v_conversation_owner, v_expires_at
  from public.conversations as conversation
  where conversation.id = p_conversation_id
  for update;

  if not found or v_conversation_owner <> v_user then
    return query select null::uuid, 'unavailable'::text, false, null::uuid;
    return;
  end if;
  if v_expires_at <= now() then
    return query select p_conversation_id, 'expired'::text, false, null::uuid;
    return;
  end if;

  select message.conversation_id,
         conversation.owner_id,
         message.role,
         message.content,
         message.status,
         message.generation_started_at
    into v_question_conversation_id,
         v_question_owner,
         v_role,
         v_content,
         v_status,
         v_started_at
  from public.messages as message
  join public.conversations as conversation
    on conversation.id = message.conversation_id
  where message.id = p_question_id
  for update of message;

  if found then
    if v_question_owner <> v_user or v_question_conversation_id <> p_conversation_id or v_role <> 'user' then
      return query select p_conversation_id, 'unavailable'::text, false, null::uuid;
      return;
    end if;
    if v_content <> v_question then
      return query select p_conversation_id, 'conflict'::text, false, null::uuid;
      return;
    end if;

    if v_status in ('failed', 'rate-limited')
      or (v_status = 'generating'
        and (v_started_at is null or v_started_at <= now() - interval '90 seconds')) then
      update public.messages
      set status = 'generating',
          generation_started_at = now(),
          generation_token = gen_random_uuid()
      where id = p_question_id
      returning generation_token into v_generation_token;

      return query select p_conversation_id, 'generating'::text, true, v_generation_token;
      return;
    end if;

    return query select p_conversation_id, v_status, false, null::uuid;
    return;
  end if;

  update public.conversations
  set last_question_at = now(),
      expires_at = now() + interval '30 days'
  where id = p_conversation_id
    and owner_id = v_user
    and expires_at > now();

  if not found then
    return query select p_conversation_id, 'expired'::text, false, null::uuid;
    return;
  end if;

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
    p_conversation_id,
    'user',
    v_question,
    'generating',
    now(),
    gen_random_uuid()
  )
  returning generation_token into v_generation_token;

  return query select p_conversation_id, 'generating'::text, true, v_generation_token;
end;
$function$;

revoke all on function public.claim_conversation_question_in_conversation(uuid, text, uuid)
  from public, anon;
grant execute on function public.claim_conversation_question_in_conversation(uuid, text, uuid)
  to authenticated;

commit;
