"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  parseResourceForm,
  type ResourceFormState,
} from "./resource-validation";

export async function createResource(
  _previousState: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const parsed = parseResourceForm(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Corrigez les champs signal\u00e9s pour enregistrer la ressource.",
      errors: parsed.errors,
      values: parsed.values,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const failure = (
    message: string,
    errors: ResourceFormState["errors"] = {},
  ): ResourceFormState => ({
    status: "error",
    message,
    errors,
    values: {
      title: formData.get("title") as string,
      body: formData.get("body") as string,
      categoryId: parsed.values.categoryId,
    },
  });

  // owner_id et workspace_id viennent de la session et du profil, jamais du formulaire.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile) {
    return failure("La ressource n\u2019a pas pu \u00eatre enregistr\u00e9e. R\u00e9essayez.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.values.categoryId)
    .eq("workspace_id", profile.workspace_id)
    .maybeSingle();
  if (categoryError) {
    return failure("La ressource n\u2019a pas pu \u00eatre enregistr\u00e9e. R\u00e9essayez.");
  }
  if (!category) {
    return failure(
      "Corrigez les champs signal\u00e9s pour enregistrer la ressource.",
      { categoryId: "Cette cat\u00e9gorie n\u2019est pas disponible." },
    );
  }

  const { data: created, error } = await supabase
    .from("resources")
    .insert({
      workspace_id: profile.workspace_id,
      category_id: category.id,
      owner_id: user.id,
      title: parsed.values.title,
      body: parsed.values.body,
    })
    .select("id")
    .single();

  if (error || !created) {
    return failure("La ressource n\u2019a pas pu \u00eatre enregistr\u00e9e. R\u00e9essayez.");
  }

  revalidatePath("/resources");
  redirect(`/resources/${created.id}`);
}
