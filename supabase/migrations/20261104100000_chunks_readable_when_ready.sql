-- Correction de revue (stories 4.1 et 4.3) : les passages d'une ressource ne sont lisibles
-- que si la ressource est « prête » (AD-5). Une ressource en cours ou en échec n'est pas interrogeable.
drop policy if exists "Members can read chunks of accessible resources"
  on public.resource_chunks;
create policy "Members can read chunks of accessible resources"
  on public.resource_chunks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.resources
      where resources.id = resource_chunks.resource_id
        and resources.indexing_status = 'ready'
        and resources.revision = resource_chunks.revision
    )
  );
