export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

type EmbeddingResponse = {
  data?: Array<{ embedding?: unknown; index?: unknown }>;
  error?: unknown;
};

export async function createOpenAIEmbeddings(
  input: string[],
  apiKey: string,
  request: typeof fetch = fetch,
): Promise<number[][]> {
  if (!apiKey) {
    throw new Error("La variable OPENAI_API_KEY est manquante.");
  }
  if (!input.length) {
    return [];
  }

  const response = await request("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input,
      dimensions: EMBEDDING_DIMENSIONS,
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    throw new Error(`La génération des embeddings a échoué (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as EmbeddingResponse;
  if (!Array.isArray(payload.data) || payload.data.length !== input.length) {
    throw new Error("La réponse OpenAI ne contient pas un embedding par passage.");
  }

  const embeddings: number[][] = new Array(input.length);
  for (const item of payload.data) {
    if (
      typeof item.index !== "number" ||
      !Number.isInteger(item.index) ||
      item.index < 0 ||
      item.index >= input.length ||
      embeddings[item.index] !== undefined ||
      !Array.isArray(item.embedding) ||
      item.embedding.length !== EMBEDDING_DIMENSIONS ||
      !item.embedding.every(
        (value) => typeof value === "number" && Number.isFinite(value),
      )
    ) {
      throw new Error("La réponse OpenAI contient un embedding invalide.");
    }

    embeddings[item.index] = item.embedding as number[];
  }

  return embeddings;
}
