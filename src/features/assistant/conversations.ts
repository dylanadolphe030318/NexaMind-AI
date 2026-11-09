import "server-only";

import { unstable_rethrow } from "next/navigation";

import {
  submitSavedAssistantQuestion,
  type AssistantSubmission,
  type ConversationClaim,
  type ConversationQuestionStatus,
} from "./assistant-conversation-core";
import {
  buildConversationSummaries,
  readConversationHistory,
  type ConversationHistoryResult,
} from "./conversations-core";
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
    generate: async (text) => {
      const { generateAssistantAnswer } = await import("./assistant");
      return generateAssistantAnswer(text);
    },
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

export async function getMyConversation(
  conversationId: string,
): Promise<ConversationHistoryResult | null> {
  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    unstable_rethrow(error);
    logConversationError("Impossible de charger la conversation.");
    return { status: "error" };
  }

  try {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logConversationError("Impossible de vérifier la session.");
      return { status: "error" };
    }
    if (!auth.user) {
      return null;
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
      return { status: "unavailable" };
    }

    const result = await readConversationHistory(conversationId, {
      findConversation: async (id) => {
        const { data, error } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", id)
          .maybeSingle();
        if (error) {
          throw error;
        }
        return { status: "ok", data: Boolean(data) };
      },
      readMessages: async (id) => {
        const messages = [];
        for (let offset = 0; ; offset += CONVERSATION_PAGE_SIZE) {
          const { data: page, error } = await supabase
            .from("messages")
            .select("id, role, content, status, created_at")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .range(offset, offset + CONVERSATION_PAGE_SIZE - 1);
          if (error) {
            throw error;
          }
          messages.push(...page);
          if (page.length < CONVERSATION_PAGE_SIZE) {
            break;
          }
        }
        return { status: "ok", data: messages };
      },
      readSources: async (answerIds) => {
        const sources = [];
        for (let start = 0; start < answerIds.length; start += CONVERSATION_ID_BATCH_SIZE) {
          const batch = answerIds.slice(start, start + CONVERSATION_ID_BATCH_SIZE);
          for (let offset = 0; ; offset += CONVERSATION_PAGE_SIZE) {
            const { data: page, error } = await supabase
              .from("message_sources")
              .select("answer_message_id, resource_id, chunk_id, resource_revision")
              .in("answer_message_id", batch)
              .order("created_at", { ascending: true })
              .order("id", { ascending: true })
              .range(offset, offset + CONVERSATION_PAGE_SIZE - 1);
            if (error) {
              throw error;
            }
            sources.push(...page);
            if (page.length < CONVERSATION_PAGE_SIZE) {
              break;
            }
          }
        }
        return { status: "ok", data: sources };
      },
      readResources: async (resourceIds) => {
        const resources = [];
        for (let start = 0; start < resourceIds.length; start += CONVERSATION_ID_BATCH_SIZE) {
          const batch = resourceIds.slice(start, start + CONVERSATION_ID_BATCH_SIZE);
          for (let offset = 0; ; offset += CONVERSATION_PAGE_SIZE) {
            const { data: page, error } = await supabase
              .from("resources")
              .select("id, title, revision")
              .in("id", batch)
              .range(offset, offset + CONVERSATION_PAGE_SIZE - 1);
            if (error) {
              throw error;
            }
            resources.push(...page);
            if (page.length < CONVERSATION_PAGE_SIZE) {
              break;
            }
          }
        }
        return { status: "ok", data: resources };
      },
      readChunks: async (chunkIds) => {
        const chunks = [];
        for (let start = 0; start < chunkIds.length; start += CONVERSATION_ID_BATCH_SIZE) {
          const batch = chunkIds.slice(start, start + CONVERSATION_ID_BATCH_SIZE);
          for (let offset = 0; ; offset += CONVERSATION_PAGE_SIZE) {
            const { data: page, error } = await supabase
              .from("resource_chunks")
              .select("id, resource_id, revision, content")
              .in("id", batch)
              .range(offset, offset + CONVERSATION_PAGE_SIZE - 1);
            if (error) {
              throw error;
            }
            chunks.push(...page);
            if (page.length < CONVERSATION_PAGE_SIZE) {
              break;
            }
          }
        }
        return { status: "ok", data: chunks };
      },
    });
    if (result.status === "error") {
      logConversationError("Impossible de charger la conversation.");
    }
    return result;
  } catch {
    logConversationError("Impossible de charger la conversation.");
    return { status: "error" };
  }
}
