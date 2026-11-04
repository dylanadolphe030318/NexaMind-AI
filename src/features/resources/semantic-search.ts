import "server-only";

import { generateEmbeddings } from "@/lib/ai/embeddings";
import { createClient } from "@/lib/supabase/server";
import { runSemanticSearch, type SemanticSearchOutcome } from "./semantic-search-core";

/** null = pas de session. La recherche passe par la session du membre : la RLS limite les passages. */
export async function searchPassages(question: string): Promise<SemanticSearchOutcome | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  return runSemanticSearch(question, {
    embed: generateEmbeddings,
    search: async (queryEmbedding, limit, minSimilarity) => {
      const { data, error } = await supabase.rpc("search_resource_chunks", {
        p_query_embedding: queryEmbedding,
        p_limit: limit,
        p_min_similarity: minSimilarity,
      });
      return { data, error };
    },
    logError: (message) => console.error(`[recherche sémantique] ${message}`),
  });
}
