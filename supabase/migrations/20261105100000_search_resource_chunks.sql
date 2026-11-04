-- Story 4.4 : recherche sémantique des passages par proximité de sens (pgvector, distance cosinus).
-- SECURITY INVOKER : la RLS de la session du membre s'applique (ressources accessibles et « prêtes » seulement).
create or replace function public.search_resource_chunks(
  p_query_embedding extensions.vector(1536),
  p_limit integer default 5,
  p_min_similarity real default 0.3
)
returns table (
  resource_id uuid,
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
      chunk.resource_id,
      resource.title,
      chunk.content,
      (1 - (chunk.embedding operator(extensions.<=>) p_query_embedding))::real as similarity
    from public.resource_chunks as chunk
    join public.resources as resource on resource.id = chunk.resource_id
    where chunk.embedding is not null
  ),
  best_per_resource as (
    select distinct on (scored.resource_id)
      scored.resource_id,
      scored.title,
      scored.content,
      scored.similarity
    from scored
    order by scored.resource_id, scored.similarity desc
  )
  select
    best.resource_id,
    best.title,
    best.content,
    best.similarity
  from best_per_resource as best
  where best.similarity >= p_min_similarity
  order by best.similarity desc
  limit least(greatest(coalesce(p_limit, 5), 1), 5);
$function$;

revoke all on function public.search_resource_chunks(extensions.vector, integer, real)
  from public, anon;
grant execute on function public.search_resource_chunks(extensions.vector, integer, real)
  to authenticated;
