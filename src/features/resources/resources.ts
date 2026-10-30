import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isUuid } from "./resource-format";

export type ResourceSummary = {
  id: string;
  title: string;
  updatedAt: string;
  categoryName: string | null;
};

export type ResourceDetail = ResourceSummary & { body: string };

type Row = {
  id: string;
  title: string;
  body?: string;
  updated_at: string;
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
export async function getResourceListData(): Promise<{
  resources: ResourceSummary[] | null;
} | null> {
  const { supabase, user } = await hasSession();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("resources")
    .select("id, title, updated_at, categories(name)")
    .order("updated_at", { ascending: false });

  if (error) {
    return { resources: null };
  }

  return {
    resources: ((data ?? []) as Row[]).map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
      categoryName: categoryName(row.categories),
    })),
  };
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
    .select("id, title, body, updated_at, owner_id, workspace_id, categories(name)")
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
    },
  };
}
