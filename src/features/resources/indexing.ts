import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { chunkText } from "./chunking";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Prépare une ressource pour la recherche : découpe son texte en passages et les publie
 * pour la révision courante. Toute erreur marque la ressource « en échec ».
 * Retourne true si la préparation s'est terminée sans erreur.
 */
export async function indexResource(
  supabase: SupabaseClient,
  resourceId: string,
  revision: number,
  body: string,
): Promise<boolean> {
  try {
    const chunks = chunkText(body);
    if (!chunks.length) {
      throw new Error("Aucun passage à enregistrer.");
    }

    const { data, error } = await supabase.rpc("publish_resource_chunks", {
      p_resource_id: resourceId,
      p_revision: revision,
      p_chunks: chunks.map((content) => ({ content })),
    });
    if (error || data !== true) {
      throw new Error("Les passages n'ont pas pu être publiés.");
    }
    return true;
  } catch {
    await supabase.rpc("mark_resource_failed", {
      p_resource_id: resourceId,
      p_revision: revision,
    });
    return false;
  }
}
