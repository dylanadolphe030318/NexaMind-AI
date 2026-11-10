begin;

create or replace function public.delete_owned_conversation(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null or p_conversation_id is null then
    return false;
  end if;

  delete from public.conversations as conversation
  where conversation.id = p_conversation_id
    and conversation.owner_id = v_user;

  return found;
end;
$function$;

revoke all on function public.delete_owned_conversation(uuid) from public, anon;
grant execute on function public.delete_owned_conversation(uuid) to authenticated;

commit;
