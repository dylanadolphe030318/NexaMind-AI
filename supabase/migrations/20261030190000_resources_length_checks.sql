-- Correction relecture sprint 2 (stories 2.3 et 2.4) :
-- les limites du formulaire sont aussi imposées par la base.

alter table public.resources
  drop constraint if exists resources_title_length_check,
  drop constraint if exists resources_body_length_check;

alter table public.resources
  add constraint resources_title_length_check
    check (char_length(title) <= 200),
  add constraint resources_body_length_check
    check (body ~ '[^[:space:]]' and char_length(body) <= 20000);
