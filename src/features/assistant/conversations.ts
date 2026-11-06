import "server-only";

import { unstable_rethrow } from "next/navigation";

import { generateAssistantAnswer } from "./assistant";
import {
  submitSavedAssistantQuestion,
  type AssistantSubmission,
  type ConversationClaim,
  type ConversationQuestionStatus,
} from "./assistant-conversation-core";
import { buildConversationSummaries } from "./conversations-core";
import { createClient } from "@/lib/supabase/server";

const CONVERSATION_PAGE_SIZE = 500;
const CONVERSATION_ID_BATCH_SIZE = 100;

export type ConversationListResult =
  | { status: "ok"; conversations: ReturnType<typeof buildConversationSummaries> }
  | { status: "error" };

function logConversationError(message: string) {
  console.error(`[conversations] ${message}`);
}

export async function askAndSaveQuestion(
  question: string,
  questionId: string,
): Promise<AssistantSubmission | null> {
  let supabase;
  try {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }
  } catch {
    logConversationError("Impossible de vérifier la session.");
    return { status: "save-error" };
  }

  return submitSavedAssistantQuestion(question, questionId, {
    claim: async (id, text): Promise<ConversationClaim> => {
      const { data, error } = await supabase.rpc("claim_conversation_question", {
        p_question_id: id,
        p_question: text,
      });
      if (error) {
        throw error;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row.claimed !== "boolean" || typeof row.question_status !== "string") {
        throw new Error("Invalid claim response");
      }
      return {
        claimed: row.claimed,
        generationToken: typeof row.generation_token === "string" ? row.generation_token : null,
        status: row.question_status,
      };
    },
    generate: generateAssistantAnswer,
    finalize: async (id, generationToken, answer, sources) => {
      const { data, error } = await supabase.rpc("finalize_conversation_answer", {
        p_question_id: id,
        p_generation_token: generationToken,
        p_answer: answer,
        p_sources: sources.map((source) => ({
          resourceId: source.resourceId,
          chunkId: source.chunkId ?? null,
          revision: source.revision ?? null,
        })),
      });
      if (error) {
        throw error;
      }
      return data === true;
    },
    finish: async (id, generationToken, status) => {
      const { data, error } = await supabase.rpc("finish_conversation_question", {
        p_question_id: id,
        p_generation_token: generationToken,
        p_status: status,
      });
      if (error) {
        throw error;
      }
      return data === true;
    },
    logError: logConversationError,
  });
}

export async function listMyConversations(): Promise<ConversationListResult | null> {
  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    unstable_rethrow(error);
    logConversationError("Impossible de charger la liste.");
    return { status: "error" };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const conversations = [];
    for (let offset = 0; ; offset += CONVERSATION_PAGE_SIZE) {
      const { data: page, error: conversationError } = await supabase
        .from("conversations")
        .select("id, last_question_at")
        .order("last_question_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + CONVERSATION_PAGE_SIZE - 1);
      if (conversationError) {
        throw conversationError;
      }
      conversations.push(...page);
      if (page.length < CONVERSATION_PAGE_SIZE) {
        break;
      }
    }

    if (!conversations.length) {
      return { status: "ok", conversations: [] };
    }

    const conversationIds = conversations.map((conversation) => conversation.id);
    const questions = [];
    for (let start = 0; start < conversationIds.length; start += CONVERSATION_ID_BATCH_SIZE) {
      const batch = conversationIds.slice(start, start + CONVERSATION_ID_BATCH_SIZE);
      for (let offset = 0; ; offset += CONVERSATION_PAGE_SIZE) {
        const { data: page, error: messageError } = await supabase
          .from("messages")
          .select("conversation_id, content, status, created_at")
          .in("conversation_id", batch)
          .eq("role", "user")
          .order("created_at", { ascending: true })
          .range(offset, offset + CONVERSATION_PAGE_SIZE - 1);
        if (messageError) {
          throw messageError;
        }
        questions.push(
          ...page.map((question) => ({
            ...question,
            status: question.status as ConversationQuestionStatus,
          })),
        );
        if (page.length < CONVERSATION_PAGE_SIZE) {
          break;
        }
      }
    }

    return {
      status: "ok",
      conversations: buildConversationSummaries(conversations, questions),
    };
  } catch {
    logConversationError("Impossible de charger la liste.");
    return { status: "error" };
  }
}
