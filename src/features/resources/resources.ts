import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isUuid } from "./resource-format";
import type { ResourceIndexingStatus } from "./resource-status";

export type ResourceSummary = {
  id: string;
  title: string;
  updatedAt: string;
  categoryName: string | null;
  indexingStatus: ResourceIndexingStatus;
};

export type ResourceDetail = ResourceSummary & { body: string };

type Row = {
  id: string;
  title: string;
  body?: string;
  updated_at: string;
  indexing_status: ResourceIndexingStatus;
  categories: { name: string } | { name: string }[] | null;
};

function categoryName(categories: Row["categories"]): string | null {
  const category = Array.isArray(categories) ? categories[0] : categories;
  return category?.name ?? null;
}

async function hasSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** null = pas de session ; resources null = erreur de lecture. */
export async function getResourceListData(categoryId?: string): Promise<{
  resources: ResourceSummary[] | null;
  categories: { id: string; name: string }[];
} | null> {
  const { supabase, user } = await hasSession();
  if (!user) {
    return null;
  }

  let query = supabase
    .from("resources")
    .select("id, title, updated_at, indexing_status, categories(name)")
    .order("updated_at", { ascending: false });
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const [{ data, error }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (error) {
    return { resources: null, categories: categories ?? [] };
  }

  return {
    categories: categories ?? [],
    resources: ((data ?? []) as Row[]).map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
      categoryName: categoryName(row.categories),
      indexingStatus: row.indexing_status,
    })),
  };
}

export type SearchResult = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
};

export const SEARCH_MAX_LENGTH = 100;
const SEARCH_RESULT_LIMIT = 50;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function buildExcerpt(body: string, term: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  const index = flat.toLowerCase().indexOf(term.toLowerCase());
  const start = Math.max(0, index > 40 ? index - 40 : 0);
  const slice = flat.slice(start, start + 160);
  return `${start > 0 ? "\u2026" : ""}${slice}${start + 160 < flat.length ? "\u2026" : ""}`;
}

/** null = pas de session ; results null = erreur de lecture. La RLS limite aux ressources accessibles. */
export async function searchResources(term: string): Promise<{
  results: SearchResult[] | null;
} | null> {
  const { supabase, user } = await hasSession();
  if (!user) {
    return null;
  }

  const pattern = `%${escapeLike(term)}%`;
  const columns = "id, title, body, updated_at";
  const recent = { ascending: false };
  const [byTitle, byBody] = await Promise.all([
    supabase
      .from("resources")
      .select(columns)
      .ilike("title", pattern)
      .order("updated_at", recent)
      .limit(SEARCH_RESULT_LIMIT),
    supabase
      .from("resources")
      .select(columns)
      .ilike("body", pattern)
      .order("updated_at", recent)
      .limit(SEARCH_RESULT_LIMIT),
  ]);
  if (byTitle.error || byBody.error) {
    return { results: null };
  }

  const unique = new Map<string, { id: string; title: string; body: string | null; updated_at: string }>();
  for (const row of [...(byTitle.data ?? []), ...(byBody.data ?? [])]) {
    unique.set(row.id, row);
  }

  const results = [...unique.values()]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((row) => ({
      id: row.id,
      title: row.title,
      excerpt: buildExcerpt(row.body ?? "", term),
      updatedAt: row.updated_at,
    }));
  return { results };
}

export type ResourceDetailResult =
  | { status: "unauthenticated" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ok"; resource: ResourceDetail; canEdit: boolean };

/** Propriétaire ou responsable de l'espace de la ressource (le serveur reste juge, la RLS aussi). */
async function canEditResource(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  ownerId: string,
  workspaceId: string,
): Promise<boolean | null> {
  if (ownerId === userId) {
    return true;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("role, workspace_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    return null;
  }
  return data?.role === "responsable" && data.workspace_id === workspaceId;
}

export type ResourceEditResult =
  | { status: "unauthenticated" }
  | { status: "not-found" }
  | { status: "forbidden" }
  | { status: "error" }
  | {
      status: "ok";
      resource: { id: string; title: string; body: string; categoryId: string };
    };

export async function getResourceForEdit(id: string): Promise<ResourceEditResult> {
  const { supabase, user } = await hasSession();
  if (!user) {
    return { status: "unauthenticated" };
  }
  if (!isUuid(id)) {
    return { status: "not-found" };
  }

  const { data, error } = await supabase
    .from("resources")
    .select("id, title, body, category_id, owner_id, workspace_id")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return { status: "error" };
  }
  if (!data) {
    return { status: "not-found" };
  }

  const allowed = await canEditResource(supabase, user.id, data.owner_id, data.workspace_id);
  if (allowed === null) {
    return { status: "error" };
  }
  if (!allowed) {
    return { status: "forbidden" };
  }
  return {
    status: "ok",
    resource: {
      id: data.id,
      title: data.title,
      body: data.body ?? "",
      categoryId: data.category_id,
    },
  };
}

export async function getResourceDetail(id: string): Promise<ResourceDetailResult> {
  const { supabase, user } = await hasSession();
  if (!user) {
    return { status: "unauthenticated" };
  }
  if (!isUuid(id)) {
    return { status: "not-found" };
  }

  const { data, error } = await supabase
    .from("resources")
    .select(
      "id, title, body, updated_at, indexing_status, owner_id, workspace_id, categories(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { status: "error" };
  }
  if (!data) {
    return { status: "not-found" };
  }

  const row = data as Row & { owner_id: string; workspace_id: string };
  const canEdit = await canEditResource(supabase, user.id, row.owner_id, row.workspace_id);
  return {
    status: "ok",
    canEdit: canEdit === true,
    resource: {
      id: row.id,
      title: row.title,
      body: row.body ?? "",
      updatedAt: row.updated_at,
      categoryName: categoryName(row.categories),
      indexingStatus: row.indexing_status,
    },
  };
}
