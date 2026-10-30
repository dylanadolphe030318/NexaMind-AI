-- Correction relecture sprint 2 (story 2.1) :
-- un nom de catégorie ne commence ni ne finit par des espaces.

alter table public.categories
  drop constraint if exists categories_name_trim_check;

alter table public.categories
  add constraint categories_name_trim_check
    check (name = btrim(name, E' \t\r\n'));
