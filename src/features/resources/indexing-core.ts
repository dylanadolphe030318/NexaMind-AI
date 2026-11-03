import { chunkText } from "./chunking.ts";

const EMBEDDING_DIMENSIONS = 1536;

type RpcClient = {
  rpc(
    functionName: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: unknown }>;
};

type EmbeddingsGenerator = (input: string[]) => Promise<number[][]>;
export type IndexingResult =
  | { success: true }
  | { success: false; message: string };

export function createResourceIndexer(generateEmbeddings: EmbeddingsGenerator) {
  return (
    supabase: RpcClient,
    resourceId: string,
    revision: number,
    body: string,
  ) =>
    indexResourceWithEmbeddings(
      supabase,
      resourceId,
      revision,
      body,
      generateEmbeddings,
    );
}

export async function indexResourceWithEmbeddings(
  supabase: RpcClient,
  resourceId: string,
  revision: number,
  body: string,
  generateEmbeddings: EmbeddingsGenerator,
): Promise<IndexingResult> {
  const chunks = chunkText(body);
  if (!chunks.length) {
    return markFailed(supabase, resourceId, revision, "Aucun passage à enregistrer.");
  }

  let embeddings: number[][];
  try {
    embeddings = await generateEmbeddings(chunks);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Erreur inconnue du fournisseur.";
    return markFailed(
      supabase,
      resourceId,
      revision,
      `Le fournisseur n'a pas généré les embeddings : ${reason}`,
    );
  }

  if (
    embeddings.length !== chunks.length ||
    embeddings.some(
      (embedding) =>
        embedding.length !== EMBEDDING_DIMENSIONS ||
        embedding.some((value) => !Number.isFinite(value)),
    )
  ) {
    return markFailed(
      supabase,
      resourceId,
      revision,
      "Le nombre ou la dimension des embeddings est invalide.",
    );
  }

  let result: { data: unknown; error: unknown };
  try {
    result = await supabase.rpc("publish_resource_chunks", {
      p_resource_id: resourceId,
      p_revision: revision,
      p_chunks: chunks.map((content, index) => ({
        content,
        embedding: embeddings[index],
      })),
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Erreur inconnue de la base de données.";
    return markFailed(
      supabase,
      resourceId,
      revision,
      `Les passages et embeddings n'ont pas pu être publiés : ${reason}`,
    );
  }
  if (result.error || result.data !== true) {
    const reason =
      result.error instanceof Error
        ? result.error.message
        : "La base a refusé la publication.";
    return markFailed(
      supabase,
      resourceId,
      revision,
      `Les passages et embeddings n'ont pas pu être publiés : ${reason}`,
    );
  }

  return { success: true };
}

async function markFailed(
  supabase: RpcClient,
  resourceId: string,
  revision: number,
  message: string,
): Promise<IndexingResult> {
  try {
    const { error } = await supabase.rpc("mark_resource_failed", {
      p_resource_id: resourceId,
      p_revision: revision,
    });
    if (error) {
      const reason = error instanceof Error ? error.message : "Erreur de base de données.";
      console.error(`Impossible de marquer la ressource ${resourceId} en échec : ${reason}`);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Erreur inconnue.";
    console.error(`Impossible de marquer la ressource ${resourceId} en échec : ${reason}`);
  }
  return { success: false, message };
}
