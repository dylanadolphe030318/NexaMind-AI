import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import {
  createResourceIndexer,
  type IndexingResult,
} from "./indexing-core";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const indexResourceWithOpenAI = createResourceIndexer(generateEmbeddings);

/**
 * Prépare une ressource : découpe son texte, calcule les embeddings et les publie
 * pour la révision courante. Toute erreur marque la ressource « en échec ».
 * Retourne true si la préparation s'est terminée sans erreur.
 */
export async function indexResource(
  supabase: SupabaseClient,
  resourceId: string,
  revision: number,
  body: string,
): Promise<IndexingResult> {
  return indexResourceWithOpenAI(supabase, resourceId, revision, body);
}
