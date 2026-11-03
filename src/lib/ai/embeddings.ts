import "server-only";

import { createOpenAIEmbeddings } from "./openai-embeddings-client";

export async function generateEmbeddings(input: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("La variable OPENAI_API_KEY est manquante.");
  }

  return createOpenAIEmbeddings(input, apiKey);
}
