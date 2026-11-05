import "server-only";

import {
  createOpenAIChatCompletion,
  DEFAULT_OPENAI_CHAT_MODEL,
  type ChatMessage,
} from "./openai-chat-client";

export async function generateChatReply(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("La variable OPENAI_API_KEY est manquante.");
  }

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_OPENAI_CHAT_MODEL;
  return createOpenAIChatCompletion(messages, apiKey, model);
}
