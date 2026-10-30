-- Story 2.3 : création de ressources textuelles par les membres.
-- Pas de modification ni de suppression (stories 2.4 et 2.6).

grant insert (workspace_id, category_id, owner_id, title, body)
  on public.resources to authenticated;

drop policy if exists "Members can create their own resources"
  on public.resources;
create policy "Members can create their own resources"
  on public.resources
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.workspace_id = resources.workspace_id
    )
    and exists (
      select 1
      from public.categories
      where categories.id = resources.category_id
        and categories.workspace_id = resources.workspace_id
    )
  );
