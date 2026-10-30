import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Category = {
  id: string;
  name: string;
};

type CategoryPageData = {
  categories: Category[] | null;
  canManage: boolean;
};

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (error) {
    throw new Error("Impossible de charger les cat\u00e9gories.");
  }

  return data ?? [];
}

export async function getCategoryPageData(): Promise<CategoryPageData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { categories: null, canManage: false };
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("workspace_id", profile.workspace_id)
    .order("name");

  return {
    categories: categoriesError ? null : categories ?? [],
    canManage: profile.role === "responsable",
  };
}
