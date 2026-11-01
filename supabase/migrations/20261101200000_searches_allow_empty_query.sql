-- Story 3.2 : une recherche lancée à vide doit aussi apparaître dans l'historique.
-- On garde la limite de 100 caractères et on retire l'obligation d'avoir au moins un caractère.

alter table public.searches drop constraint if exists searches_query_check;
alter table public.searches
  add constraint searches_query_check check (char_length(query) <= 100);
