import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isUuid } from "./resource-format";

export type SearchHistoryEntry = {
  id: string;
  query: string;
  createdAt: string;
};

const HISTORY_LIMIT = 20;

/** Enregistre la requête pour la personne connectée, sauf si c'est la même que sa dernière recherche. Silencieux en cas d'échec. */
export async function recordSearch(query: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { data: last, error: lastError } = await supabase
    .from("searches")
    .select("query")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError || last?.query === query) {
    return;
  }

  await supabase.from("searches").insert({ owner_id: user.id, query });
}

/** La RLS ne renvoie que les recherches du propriétaire : une recherche d'autrui est « not-found ». */
export async function getSearchForDelete(id: string): Promise<
  | { status: "unauthenticated" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ok"; search: SearchHistoryEntry }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "unauthenticated" };
  }
  if (!isUuid(id)) {
    return { status: "not-found" };
  }

  const { data, error } = await supabase
    .from("searches")
    .select("id, query, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return { status: "error" };
  }
  if (!data) {
    return { status: "not-found" };
  }
  return { status: "ok", search: { id: data.id, query: data.query, createdAt: data.created_at } };
}

/** null = pas de session ; entries null = erreur de lecture. La RLS ne renvoie que les recherches du propriétaire. */
export async function getRecentSearches(): Promise<{
  entries: SearchHistoryEntry[] | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("searches")
    .select("id, query, created_at")
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error) {
    return { entries: null };
  }

  return {
    entries: (data ?? []).map((row) => ({
      id: row.id,
      query: row.query,
      createdAt: row.created_at,
    })),
  };
}
