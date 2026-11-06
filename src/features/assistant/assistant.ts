import "server-only";

import { generateChatReply } from "@/lib/ai/chat";
import { searchPassages } from "@/features/resources/semantic-search";
import { runAssistant, type AssistantOutcome } from "./assistant-core";

/** La recherche des passages passe par la session du membre : la RLS limite ce que le modèle reçoit. */
export async function generateAssistantAnswer(question: string): Promise<AssistantOutcome | null> {
  return runAssistant(question, {
    retrieve: searchPassages,
    generate: generateChatReply,
    logError: (message) => console.error(`[assistant] ${message}`),
  });
}
