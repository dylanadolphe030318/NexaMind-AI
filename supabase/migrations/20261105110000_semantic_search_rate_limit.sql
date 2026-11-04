-- Story 4.4 : limite le nombre de recherches sémantiques (appels OpenAI) par membre et par minute.
create table if not exists public.semantic_search_calls (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists semantic_search_calls_user_created_idx
  on public.semantic_search_calls (user_id, created_at desc);

alter table public.semantic_search_calls enable row level security;

revoke all on table public.semantic_search_calls from public, anon;
grant select, insert, delete on table public.semantic_search_calls to authenticated;

create policy "Members manage their own search calls"
  on public.semantic_search_calls
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Retourne true et enregistre l'appel si le membre est sous la limite, false sinon.
create or replace function public.consume_semantic_search_quota(
  p_max_per_minute integer default 20
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_recent integer;
begin
  if v_user is null then
    return false;
  end if;

  delete from public.semantic_search_calls
  where user_id = v_user and created_at < now() - interval '1 hour';

  select count(*) into v_recent
  from public.semantic_search_calls
  where user_id = v_user and created_at > now() - interval '1 minute';

  if v_recent >= least(greatest(coalesce(p_max_per_minute, 20), 1), 20) then
    return false;
  end if;

  insert into public.semantic_search_calls (user_id) values (v_user);
  return true;
end;
$function$;

revoke all on function public.consume_semantic_search_quota(integer) from public, anon;
grant execute on function public.consume_semantic_search_quota(integer) to authenticated;
