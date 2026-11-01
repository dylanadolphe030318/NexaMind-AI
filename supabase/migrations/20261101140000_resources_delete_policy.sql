-- Story 2.6 : suppression d'une ressource par son propriétaire ou un responsable.

grant delete on public.resources to authenticated;

drop policy if exists "Owners and managers can delete resources"
  on public.resources;
create policy "Owners and managers can delete resources"
  on public.resources
  for delete
  to authenticated
  using (
    owner_id = (select auth.uid())
    or private.is_workspace_responsable(workspace_id)
  );
