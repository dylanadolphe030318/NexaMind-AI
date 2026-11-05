-- Classement hybride réservé à la recherche de ressources.
-- Le seuil et la fenêtre de proximité utilisent toujours la similarité vectorielle brute.
-- SECURITY INVOKER conserve la RLS de la session du membre.
create or replace function public.search_resource_chunks_hybrid(
  p_query_embedding extensions.vector(1536),
  p_query_text text,
  p_limit integer default 5,
  p_min_similarity real default 0.3
)
returns table (
  resource_id uuid,
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
      chunk.resource_id,
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
    normalized.resource_id,
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
