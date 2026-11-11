import "server-only";

import {
  createOpenAIChatCompletion,
  DEFAULT_OPENAI_CHAT_MODEL,
  OpenAIChatResponseError,
  RESOURCE_SELECTION_MAX_OUTPUT_TOKENS,
  type ChatMessage,
} from "./openai-chat-client";

export async function generateChatReply(messages: ChatMessage[]): Promise<string> {
  return generateReply(messages, undefined, "assistant");
}

export async function generateResourceSelectionReply(messages: ChatMessage[]): Promise<string> {
  try {
    return await generateReply(messages, RESOURCE_SELECTION_MAX_OUTPUT_TOKENS, "resource-selection");
  } catch (error) {
    if (error instanceof OpenAIChatResponseError) {
      console.error("[sélection ressources] Réponse OpenAI rejetée :", error.code);
    }
    throw error;
  }
}

async function generateReply(
  messages: ChatMessage[],
  maxOutputTokens?: number,
  responseSchema: "assistant" | "resource-selection" = "resource-selection",
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("La variable OPENAI_API_KEY est manquante.");
  }

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_OPENAI_CHAT_MODEL;
  return createOpenAIChatCompletion(messages, apiKey, model, fetch, { maxOutputTokens, responseSchema });
}
