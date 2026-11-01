-- Ajoute l'adresse e-mail au profil (copie de auth.users.email, pour la consulter dans Table Editor).
-- La lecture reste limitée au propriétaire du profil par la politique RLS existante.

alter table public.profiles add column if not exists email text;

update public.profiles
set email = users.email
from auth.users as users
where users.id = profiles.id
  and profiles.email is distinct from users.email;

create or replace function public.create_member_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  default_workspace_id uuid;
begin
  select id
  into default_workspace_id
  from public.workspaces
  where is_default
  order by created_at
  limit 1;

  if default_workspace_id is null then
    raise exception 'The default workspace must exist before member registration.';
  end if;

  insert into public.profiles (id, workspace_id, role, email)
  values (new.id, default_workspace_id, 'membre', new.email);

  return new;
end;
$function$;

revoke all on function public.create_member_profile_for_auth_user()
  from public, anon, authenticated;
