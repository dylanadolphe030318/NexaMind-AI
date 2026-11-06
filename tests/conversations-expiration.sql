-- SQL Editor Supabase, role postgres. Une seule instruction, sans table temporaire.
do $test$
declare
  v_owner uuid;
  v_active uuid := gen_random_uuid();
  v_expired uuid := gen_random_uuid();
  v_active_question uuid := gen_random_uuid();
  v_expired_question uuid := gen_random_uuid();
  v_active_answer uuid := gen_random_uuid();
  v_expired_answer uuid := gen_random_uuid();
begin
  select id into v_owner from auth.users order by created_at limit 1;
  if v_owner is null then
    raise exception 'Un compte utilisateur est necessaire pour ce test.';
  end if;

  begin
    insert into public.conversations (id, owner_id, created_at, last_question_at, expires_at)
    values
      (v_active, v_owner, now(), now(), now() + interval '30 days'),
      (v_expired, v_owner, now() - interval '31 days',
        now() - interval '31 days', now() - interval '1 day');

    insert into public.messages (id, conversation_id, role, content, status)
    values
      (v_active_question, v_active, 'user', 'Test expiration actif', 'complete'),
      (v_expired_question, v_expired, 'user', 'Test expiration expire', 'complete');

    insert into public.messages (id, conversation_id, role, content, status, question_id)
    values
      (v_active_answer, v_active, 'assistant', 'Reponse de test active',
        'complete', v_active_question),
      (v_expired_answer, v_expired, 'assistant', 'Reponse de test expiree',
        'complete', v_expired_question);

    insert into public.message_sources (answer_message_id)
    values (v_active_answer), (v_expired_answer);

    perform set_config('request.jwt.claim.sub', v_owner::text, true);
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', v_owner, 'role', 'authenticated')::text,
      true
    );
    execute 'set local role authenticated';

    if (select count(*) from public.conversations where id = v_active) <> 1
      or (select count(*) from public.messages where conversation_id = v_active) <> 2
      or (select count(*) from public.message_sources
        where answer_message_id = v_active_answer) <> 1 then
      raise exception 'La conversation active et ses dependances doivent rester lisibles.';
    end if;
    if exists (select 1 from public.conversations where id = v_expired)
      or exists (select 1 from public.messages where conversation_id = v_expired)
      or exists (select 1 from public.message_sources
        where answer_message_id = v_expired_answer) then
      raise exception 'RLS doit masquer la conversation expiree et toutes ses dependances.';
    end if;
    if (select expires_at from public.conversations where id = v_active)
      is distinct from now() + interval '30 days' then
      raise exception 'La lecture ne doit pas prolonger la conservation.';
    end if;
    if has_function_privilege(
      current_user, 'public.purge_expired_conversations()', 'EXECUTE'
    ) then
      raise exception 'Un membre ne doit pas pouvoir executer la purge systeme.';
    end if;

    execute 'reset role';
    perform public.purge_expired_conversations();

    if exists (select 1 from public.conversations where id = v_expired)
      or exists (select 1 from public.messages where conversation_id = v_expired)
      or exists (select 1 from public.message_sources
        where answer_message_id = v_expired_answer) then
      raise exception 'La purge doit supprimer la conversation expiree en cascade.';
    end if;
    if (select count(*) from public.conversations where id = v_active) <> 1
      or (select count(*) from public.messages where conversation_id = v_active) <> 2
      or (select count(*) from public.message_sources
        where answer_message_id = v_active_answer) <> 1 then
      raise exception 'La purge ne doit pas supprimer les donnees actives.';
    end if;

    -- Seul ce signal de succes est intercepte ; il annule tout le sous-bloc.
    raise exception using errcode = 'ZX001', message = 'Test reussi, annulation des fixtures.';
  exception
    when sqlstate 'ZX001' then
      raise notice 'Expiration RLS et purge : OK. Aucune modification conservee.';
  end;
end;
$test$;
