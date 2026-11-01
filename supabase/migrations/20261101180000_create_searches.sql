-- Story 3.2 : historique personnel des recherches par mots-clés.

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  query text not null check (query ~ '[^[:space:]]' and char_length(query) <= 100),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists searches_owner_created_idx
  on public.searches (owner_id, created_at desc);

alter table public.searches enable row level security;

revoke all on public.searches from anon, authenticated;
-- Insertion limitée à ces deux colonnes : les dates sont toujours fixées par la base.
grant select, delete on public.searches to authenticated;
grant insert (owner_id, query) on public.searches to authenticated;

drop policy if exists "Owners can read their searches" on public.searches;
create policy "Owners can read their searches"
  on public.searches
  for select
  to authenticated
  using (owner_id = (select auth.uid()) and expires_at > now());

drop policy if exists "Owners can add their searches" on public.searches;
create policy "Owners can add their searches"
  on public.searches
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete their searches" on public.searches;
create policy "Owners can delete their searches"
  on public.searches
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));
