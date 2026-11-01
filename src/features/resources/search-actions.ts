"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isUuid } from "./resource-format";

export async function deleteSearch(searchId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  if (!isUuid(searchId)) {
    notFound();
  }

  const { data: deleted, error } = await supabase
    .from("searches")
    .delete()
    .eq("id", searchId)
    .select("id");
  if (error) {
    redirect(`/resources/searches/${searchId}/delete?error=1`);
  }
  if (!deleted?.length) {
    // RLS a refusé ou la recherche n'existe pas : rien n'a été supprimé.
    notFound();
  }

  revalidatePath("/resources/searches");
  redirect("/resources/searches?deleted=1");
}
