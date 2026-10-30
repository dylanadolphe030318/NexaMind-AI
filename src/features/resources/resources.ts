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
  | { status: "ok"; resource: ResourceDetail };

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
    .select("id, title, body, updated_at, categories(name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { status: "error" };
  }
  if (!data) {
    return { status: "not-found" };
  }

  const row = data as Row;
  return {
    status: "ok",
    resource: {
      id: row.id,
      title: row.title,
      body: row.body ?? "",
      updatedAt: row.updated_at,
      categoryName: categoryName(row.categories),
    },
  };
}
