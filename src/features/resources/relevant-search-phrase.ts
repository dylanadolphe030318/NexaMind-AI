import "server-only";

import { generateChatReply } from "@/lib/ai/chat";
import type { SemanticPassage } from "./semantic-search-core";
import {
  runRelevantPhraseSelection,
  type RelevantPhraseResult,
} from "./relevant-search-phrase-core";

export async function selectRelevantSearchPhrase(
  question: string,
  passages: SemanticPassage[],
): Promise<RelevantPhraseResult> {
  return runRelevantPhraseSelection(question, passages, {
    generate: generateChatReply,
    logError: () => console.error("[recherche sémantique] Impossible de sélectionner une phrase pertinente."),
  });
}
