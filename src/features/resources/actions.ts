"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  parseCategoryName,
  type CategoryActionState,
} from "./category-validation";

const deniedState: CategoryActionState = {
  status: "error",
  message: "Vous n\u2019\u00eates pas autoris\u00e9 \u00e0 g\u00e9rer les cat\u00e9gories.",
};

async function getManagerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== "responsable") {
    return null;
  }

  return { supabase, workspaceId: profile.workspace_id };
}

export async function createCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const parsedName = parseCategoryName(formData.get("name"));
  if (!parsedName.ok) {
    return { status: "error", message: parsedName.message };
  }

  const manager = await getManagerContext();
  if (!manager) {
    return deniedState;
  }

  const { error } = await manager.supabase.from("categories").insert({
    name: parsedName.value,
    workspace_id: manager.workspaceId,
  });

  if (error) {
    return {
      status: "error",
      message: "La cat\u00e9gorie n\u2019a pas pu \u00eatre cr\u00e9\u00e9e. R\u00e9essayez.",
    };
  }

  revalidatePath("/categories");
  return { status: "success", message: "Cat\u00e9gorie cr\u00e9\u00e9e." };
}

export async function renameCategory(
  categoryId: string,
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)) {
    return {
      status: "error",
      message: "Cette cat\u00e9gorie n\u2019est pas disponible.",
    };
  }

  const parsedName = parseCategoryName(formData.get("name"));
  if (!parsedName.ok) {
    return { status: "error", message: parsedName.message };
  }

  const manager = await getManagerContext();
  if (!manager) {
    return deniedState;
  }

  const { data, error } = await manager.supabase
    .from("categories")
    .update({ name: parsedName.value })
    .eq("id", categoryId)
    .eq("workspace_id", manager.workspaceId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "La cat\u00e9gorie n\u2019a pas pu \u00eatre renomm\u00e9e. R\u00e9essayez.",
    };
  }

  revalidatePath("/categories");
  return { status: "success", message: "Cat\u00e9gorie renomm\u00e9e." };
}
