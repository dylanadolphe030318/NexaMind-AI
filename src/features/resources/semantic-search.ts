import "server-only";

import { generateEmbeddings } from "@/lib/ai/embeddings";
import { createClient } from "@/lib/supabase/server";
import {
  runSemanticSearch,
  SEMANTIC_MAX_SEARCHES_PER_MINUTE,
  type SemanticSearchOutcome,
} from "./semantic-search-core";

/** null = pas de session. La recherche passe par la session du membre : la RLS limite les passages. */
async function search(
  question: string,
  rankByText: boolean,
): Promise<SemanticSearchOutcome | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  return runSemanticSearch(
    question,
    {
      consumeQuota: async () => {
        const { data, error } = await supabase.rpc("consume_semantic_search_quota", {
          p_max_per_minute: SEMANTIC_MAX_SEARCHES_PER_MINUTE,
        });
        if (error) {
          throw new Error("La vérification de la limite de recherches a échoué.");
        }
        return data === true;
      },
      embed: generateEmbeddings,
      search: async (queryEmbedding, limit, minSimilarity, queryText) => {
        const { data, error } = queryText
          ? await supabase.rpc("search_resource_chunks_hybrid", {
            p_query_embedding: queryEmbedding,
            p_query_text: queryText,
            p_limit: limit,
            p_min_similarity: minSimilarity,
          })
          : await supabase.rpc("search_resource_chunks", {
            p_query_embedding: queryEmbedding,
            p_limit: limit,
            p_min_similarity: minSimilarity,
          });
        return { data, error };
      },
      logError: (message) => console.error(`[recherche sémantique] ${message}`),
    },
    { rankByText },
  );
}

/** Recherche vectorielle existante, utilisée par l'assistant. */
export function searchPassages(question: string): Promise<SemanticSearchOutcome | null> {
  return search(question, false);
}

/** Classement hybride réservé à la recherche de ressources. */
export function searchResourcePassages(question: string): Promise<SemanticSearchOutcome | null> {
  return search(question, true);
}
