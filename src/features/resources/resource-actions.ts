"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isUuid } from "./resource-format";
import { getResourceForEdit } from "./resources";
import { indexResource } from "./indexing";
import {
  parseResourceForm,
  type ResourceFormState,
} from "./resource-validation";

export async function updateResource(
  resourceId: string,
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
      consentChecked: parsed.consentChecked,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  if (!isUuid(resourceId)) {
    notFound();
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
    consentChecked: parsed.consentChecked,
  });

  // Contr\u00f4le serveur : la ressource doit \u00eatre modifiable par cette personne.
  const editable = await getResourceForEdit(resourceId);
  if (editable.status === "unauthenticated") {
    redirect("/login");
  }
  if (editable.status === "not-found" || editable.status === "forbidden") {
    notFound();
  }
  if (editable.status === "error") {
    return failure("La ressource n\u2019a pas pu \u00eatre enregistr\u00e9e. R\u00e9essayez.");
  }

  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("workspace_id")
    .eq("id", resourceId)
    .maybeSingle();
  if (resourceError || !resource) {
    return failure("La ressource n\u2019a pas pu \u00eatre enregistr\u00e9e. R\u00e9essayez.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.values.categoryId)
    .eq("workspace_id", resource.workspace_id)
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

  const bodyChanged = parsed.values.body !== editable.resource.body;
  let newRevision: number | null = null;

  if (bodyChanged) {
    if (!parsed.consentChecked) {
      return failure(
        "Confirmez l\u2019autorisation avant d\u2019envoyer le texte \u00e0 OpenAI.",
        { consent: "Une autorisation explicite est requise pour envoyer le texte \u00e0 OpenAI." },
      );
    }

    // Début d'une révision : texte mis à jour et anciens passages retirés, de façon atomique.
    const { data: revision, error: revisionError } = await supabase.rpc(
      "begin_resource_revision",
      {
        p_resource_id: resourceId,
        p_title: parsed.values.title,
        p_body: parsed.values.body,
        p_category_id: category.id,
      },
    );
    if (revisionError) {
      return failure("La ressource n\u2019a pas pu \u00eatre enregistr\u00e9e. R\u00e9essayez.");
    }
    if (typeof revision !== "number") {
      notFound();
    }
    newRevision = revision;
  } else {
    // owner_id et workspace_id ne sont jamais modifi\u00e9s ; updated_at est fix\u00e9 par un trigger.
    const { data: updated, error } = await supabase
      .from("resources")
      .update({
        title: parsed.values.title,
        category_id: category.id,
      })
      .eq("id", resourceId)
      .select("id");

    if (error) {
      return failure("La ressource n\u2019a pas pu \u00eatre enregistr\u00e9e. R\u00e9essayez.");
    }
    if (!updated?.length) {
      // RLS a refus\u00e9 (0 ligne) : aucun changement enregistr\u00e9.
      notFound();
    }
  }

  if (newRevision !== null) {
    const indexing = await indexResource(
      supabase,
      resourceId,
      newRevision,
      parsed.values.body,
    );
    if (!indexing.success) {
      console.error(
        `La ressource ${resourceId} a été enregistrée, mais sa préparation a échoué : ${indexing.message}`,
      );
    }
  }

  revalidatePath("/resources");
  revalidatePath(`/resources/${resourceId}`);
  redirect(`/resources/${resourceId}`);
}

export async function retryResourceIndexing(resourceId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  if (!isUuid(resourceId)) {
    notFound();
  }

  const editable = await getResourceForEdit(resourceId);
  if (editable.status === "unauthenticated") {
    redirect("/login");
  }
  if (editable.status === "not-found") {
    notFound();
  }
  if (editable.status === "forbidden") {
    revalidatePath(`/resources/${resourceId}`);
    redirect(`/resources/${resourceId}?preparation=denied`);
  }
  if (editable.status === "error") {
    redirect(`/resources/${resourceId}`);
  }

  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("id, revision, body, indexing_status")
    .eq("id", resourceId)
    .maybeSingle();
  if (resourceError || !resource) {
    redirect(`/resources/${resourceId}`);
  }
  if (resource.indexing_status !== "failed") {
    revalidatePath("/resources");
    revalidatePath(`/resources/${resourceId}`);
    redirect(`/resources/${resourceId}`);
  }

  const { data: started, error: startError } = await supabase
    .rpc("begin_resource_reindexing", {
      p_resource_id: resourceId,
      p_revision: resource.revision,
    })
    .select("id");
  if (startError) {
    console.error(
      `La préparation de la ressource ${resourceId} n'a pas pu être relancée.`,
      startError,
    );
    revalidatePath(`/resources/${resourceId}`);
    redirect(`/resources/${resourceId}`);
  }
  const startedId = Array.isArray(started) ? started[0]?.id : started?.id;
  if (startedId !== resourceId) {
    revalidatePath("/resources");
    revalidatePath(`/resources/${resourceId}`);
    redirect(`/resources/${resourceId}`);
  }

  const indexing = await indexResource(
    supabase,
    resourceId,
    resource.revision,
    resource.body,
  );
  if (!indexing.success) {
    console.error(
      `La préparation de la ressource ${resourceId} a échoué : ${indexing.message}`,
    );
    revalidatePath("/resources");
    revalidatePath(`/resources/${resourceId}`);
    redirect(`/resources/${resourceId}`);
  }

  revalidatePath("/resources");
  revalidatePath(`/resources/${resourceId}`);
  redirect(`/resources/${resourceId}?preparation=launched`);
}

export async function deleteResource(resourceId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  if (!isUuid(resourceId)) {
    notFound();
  }

  // Contrôle serveur : seule une personne autorisée peut supprimer ; la RLS reste juge aussi.
  const editable = await getResourceForEdit(resourceId);
  if (editable.status === "unauthenticated") {
    redirect("/login");
  }
  if (editable.status === "not-found" || editable.status === "forbidden") {
    notFound();
  }
  if (editable.status === "error") {
    redirect(`/resources/${resourceId}/delete?error=1`);
  }

  const { data: deleted, error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId)
    .select("id");
  if (error) {
    redirect(`/resources/${resourceId}/delete?error=1`);
  }
  if (!deleted?.length) {
    // RLS a refusé (0 ligne) : rien n'a été supprimé.
    notFound();
  }

  revalidatePath("/resources");
  redirect("/resources?deleted=1");
}

export async function createResource(
  _previousState: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const parsed = parseResourceForm(formData, true);
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Corrigez les champs signal\u00e9s pour enregistrer la ressource.",
      errors: parsed.errors,
      values: parsed.values,
      consentChecked: parsed.consentChecked,
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
    consentChecked: parsed.consentChecked,
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
    .select("id, revision")
    .single();

  if (error || !created) {
    return failure("La ressource n\u2019a pas pu \u00eatre enregistr\u00e9e. R\u00e9essayez.");
  }

  const indexing = await indexResource(
    supabase,
    created.id,
    created.revision,
    parsed.values.body,
  );
  if (!indexing.success) {
    console.error(
      `La ressource ${created.id} a été enregistrée, mais sa préparation a échoué : ${indexing.message}`,
    );
  }

  revalidatePath("/resources");
  redirect(`/resources/${created.id}`);
}
