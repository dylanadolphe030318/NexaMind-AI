export const SEMANTIC_QUERY_MAX_LENGTH = 300;
export const SEMANTIC_RESULT_LIMIT = 5;
// Seuil de proximité cosinus : en dessous, le passage est considéré hors sujet.
export const SEMANTIC_MIN_SIMILARITY = 0.3;

export type SemanticPassage = {
  resourceId: string;
  title: string;
  content: string;
  similarity: number;
};

export type SemanticSearchOutcome =
  | { status: "ok"; passages: SemanticPassage[] }
  | { status: "invalid" }
  | { status: "error" };

type SearchRow = {
  resource_id: string;
  title: string;
  content: string;
  similarity: number;
};

export type SemanticSearchDeps = {
  embed: (input: string[]) => Promise<number[][]>;
  search: (
    queryEmbedding: string,
    limit: number,
    minSimilarity: number,
  ) => Promise<{ data: SearchRow[] | null; error: unknown }>;
  logError?: (message: string) => void;
};

export function normalizeQuestion(raw: string): string | null {
  const question = raw.trim();
  if (!question || question.length > SEMANTIC_QUERY_MAX_LENGTH) {
    return null;
  }
  return question;
}

export function formatVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

const EXCERPT_LENGTH = 200;

export function buildPassageExcerpt(content: string, maxLength = EXCERPT_LENGTH): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) {
    return flat;
  }
  const cut = flat.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const clean = lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut;
  return `${clean.replace(/[\s.,;:!?]+$/, "")}\u2026`;
}

export async function runSemanticSearch(
  rawQuestion: string,
  deps: SemanticSearchDeps,
): Promise<SemanticSearchOutcome> {
  const question = normalizeQuestion(rawQuestion);
  if (!question) {
    return { status: "invalid" };
  }

  try {
    const [embedding] = await deps.embed([question]);
    if (!embedding?.length) {
      throw new Error("Embedding de la question absent.");
    }

    const { data, error } = await deps.search(
      formatVector(embedding),
      SEMANTIC_RESULT_LIMIT,
      SEMANTIC_MIN_SIMILARITY,
    );
    if (error || !data) {
      throw new Error("La recherche des passages a échoué.");
    }

    const passages = data
      .filter((row) => row.similarity >= SEMANTIC_MIN_SIMILARITY)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, SEMANTIC_RESULT_LIMIT)
      .map((row) => ({
        resourceId: row.resource_id,
        title: row.title,
        content: row.content,
        similarity: row.similarity,
      }));
    return { status: "ok", passages };
  } catch (error) {
    deps.logError?.(error instanceof Error ? error.message : "Erreur de recherche sémantique.");
    return { status: "error" };
  }
}
