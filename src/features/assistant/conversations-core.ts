import type { ConversationQuestionStatus } from "./assistant-conversation-core.ts";
import type { AssistantHistoryExchange } from "./assistant-core.ts";
import { buildPassageExcerpt } from "../resources/semantic-search-core.ts";

type ConversationRow = {
  id: string;
  last_question_at: string;
};

type QuestionRow = {
  conversation_id: string;
  content: string;
  created_at: string;
  status: ConversationQuestionStatus;
};

export type ConversationSummary = {
  id: string;
  firstQuestion: string;
  lastQuestionAt: string;
  status: ConversationQuestionStatus;
};

export function buildConversationSummaries(
  conversations: ConversationRow[],
  questions: QuestionRow[],
): ConversationSummary[] {
  const sortedConversations = [...conversations].sort(
    (left, right) =>
      new Date(right.last_question_at).getTime() - new Date(left.last_question_at).getTime(),
  );
  const firstQuestions = new Map<string, QuestionRow>();

  for (const question of [...questions].sort(
    (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  )) {
    if (!firstQuestions.has(question.conversation_id)) {
      firstQuestions.set(question.conversation_id, question);
    }
  }

  return sortedConversations.flatMap((conversation) => {
    const firstQuestion = firstQuestions.get(conversation.id);
    return firstQuestion
      ? [{
        id: conversation.id,
        firstQuestion: firstQuestion.content,
        lastQuestionAt: conversation.last_question_at,
        status: firstQuestion.status,
      }]
      : [];
  });
}

export type ConversationMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  created_at: string;
};

export type ConversationSourceRow = {
  answer_message_id: string;
  resource_id: string | null;
  chunk_id: string | null;
  resource_revision: number | null;
};

export type ConversationResourceRow = {
  id: string;
  title: string;
  revision: number;
};

export type ConversationChunkRow = {
  id: string;
  resource_id: string;
  revision: number;
  content: string;
};

export type ConversationHistorySource =
  | { status: "available"; resourceId: string; title: string; excerpt: string }
  | { status: "unavailable" };

export type ConversationHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  createdAt: string;
  sources: ConversationHistorySource[];
  hasUnavailableSources: boolean;
};

export type ConversationContextMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  created_at: string;
  question_id?: string | null;
};

export type RecentConversationExchanges = {
  exchanges: AssistantHistoryExchange[];
  omittedCount: number;
};

export function buildRecentConversationExchanges(
  questions: ConversationContextMessage[],
  answers: ConversationContextMessage[],
  currentQuestionId: string,
): RecentConversationExchanges {
  const historicalQuestions = questions
    .filter((message) => message.role === "user" && message.id !== currentQuestionId && message.status !== "generating")
    .sort((left, right) => {
      const timeDifference = Date.parse(left.created_at) - Date.parse(right.created_at);
      return timeDifference || left.id.localeCompare(right.id);
    });
  const selectedQuestions = historicalQuestions.slice(-10);
  const answerByQuestionId = new Map(
    answers
      .filter((message) => message.role === "assistant" && message.status === "complete" && message.question_id)
      .map((message) => [message.question_id as string, message.content]),
  );

  return {
    exchanges: selectedQuestions.map((message) => ({
      question: message.content,
      ...(answerByQuestionId.has(message.id) ? { answer: answerByQuestionId.get(message.id) } : {}),
    })),
    omittedCount: Math.max(0, historicalQuestions.length - selectedQuestions.length),
  };
}

export type ConversationHistoryResult =
  | { status: "ok"; messages: ConversationHistoryMessage[] }
  | { status: "unavailable" }
  | { status: "error" };

type ReadResult<T> = { status: "ok"; data: T } | { status: "error" };

export type ConversationHistoryDeps = {
  findConversation: (conversationId: string) => Promise<ReadResult<boolean>>;
  readMessages: (conversationId: string) => Promise<ReadResult<ConversationMessageRow[]>>;
  readSources: (answerIds: string[]) => Promise<ReadResult<ConversationSourceRow[]>>;
  readResources: (resourceIds: string[]) => Promise<ReadResult<ConversationResourceRow[]>>;
  readChunks: (chunkIds: string[]) => Promise<ReadResult<ConversationChunkRow[]>>;
};

export async function readConversationHistory(
  conversationId: string,
  deps: ConversationHistoryDeps,
): Promise<ConversationHistoryResult> {
  try {
    const conversation = await deps.findConversation(conversationId);
    if (conversation.status === "error") {
      return { status: "error" };
    }
    if (!conversation.data) {
      return { status: "unavailable" };
    }

    const messageResult = await deps.readMessages(conversationId);
    if (messageResult.status === "error") {
      return { status: "error" };
    }

    const answerIds = messageResult.data
      .filter((message) => message.role === "assistant")
      .map((message) => message.id);
    if (!answerIds.length) {
      return {
        status: "ok",
        messages: buildConversationHistoryMessages(messageResult.data, [], [], []),
      };
    }

    const sourceResult = await deps.readSources(answerIds);
    if (sourceResult.status === "error") {
      return { status: "error" };
    }
    const resourceIds = [...new Set(
      sourceResult.data.flatMap((source) => source.resource_id ? [source.resource_id] : []),
    )];
    const chunkIds = [...new Set(
      sourceResult.data.flatMap((source) => source.chunk_id ? [source.chunk_id] : []),
    )];

    const [resourceResult, chunkResult] = await Promise.all([
      resourceIds.length
        ? deps.readResources(resourceIds)
        : Promise.resolve({ status: "ok" as const, data: [] }),
      chunkIds.length
        ? deps.readChunks(chunkIds)
        : Promise.resolve({ status: "ok" as const, data: [] }),
    ]);
    if (resourceResult.status === "error" || chunkResult.status === "error") {
      return { status: "error" };
    }

    return {
      status: "ok",
      messages: buildConversationHistoryMessages(
        messageResult.data,
        sourceResult.data,
        resourceResult.data,
        chunkResult.data,
      ),
    };
  } catch {
    return { status: "error" };
  }
}

export type DeleteConversationResult =
  | "unauthenticated"
  | "deleted"
  | "unavailable"
  | "error";

export type DeleteConversationDeps = {
  isAuthenticated: () => Promise<boolean>;
  deleteOwnedConversation: (conversationId: string) => Promise<boolean>;
};

export async function processConversationDeletion(
  formData: FormData,
  deps: {
    deleteConversation: (id: string) => Promise<Exclude<DeleteConversationResult, "unauthenticated"> | null>;
    revalidate: (path: string) => void;
  },
): Promise<string> {
  const id = formData.get("conversationId");
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return "/assistant/conversations?deleteError=1";
  }
  const result = await deps.deleteConversation(id);
  if (result === null) {
    return "/login";
  }
  if (result === "deleted") {
    deps.revalidate("/assistant/conversations");
    deps.revalidate(`/assistant/conversations/${id}`);
    return "/assistant/conversations?deleted=1";
  }
  if (result === "error") {
    return `/assistant/conversations/${id}?delete=confirm&error=1`;
  }
  return "/assistant/conversations?deleteError=1";
}

export async function deleteConversationWith(
  conversationId: string,
  deps: DeleteConversationDeps,
): Promise<DeleteConversationResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
    return "unavailable";
  }

  try {
    if (!await deps.isAuthenticated()) {
      return "unauthenticated";
    }
    return await deps.deleteOwnedConversation(conversationId) ? "deleted" : "unavailable";
  } catch {
    return "error";
  }
}

export function buildConversationHistoryMessages(
  messages: ConversationMessageRow[],
  sources: ConversationSourceRow[],
  resources: ConversationResourceRow[],
  chunks: ConversationChunkRow[],
): ConversationHistoryMessage[] {
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  const chunkById = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const sourcesByAnswer = new Map<string, ConversationSourceRow[]>();

  for (const source of sources) {
    const grouped = sourcesByAnswer.get(source.answer_message_id) ?? [];
    grouped.push(source);
    sourcesByAnswer.set(source.answer_message_id, grouped);
  }

  return [...messages]
    .sort((left, right) => {
      const timeDifference = Date.parse(left.created_at) - Date.parse(right.created_at);
      if (timeDifference) {
        return timeDifference;
      }
      if (left.created_at !== right.created_at) {
        return left.created_at.localeCompare(right.created_at);
      }
      if (left.role !== right.role) {
        return left.role === "user" ? -1 : 1;
      }
      return left.id.localeCompare(right.id);
    })
    .map((message) => {
      const messageSources = message.role === "assistant" ? sourcesByAnswer.get(message.id) ?? [] : [];
      const resolvedSources = messageSources.map((source): ConversationHistorySource => {
        const resource = source.resource_id ? resourceById.get(source.resource_id) : undefined;
        const chunk = source.chunk_id ? chunkById.get(source.chunk_id) : undefined;
        if (
          !resource ||
          !chunk ||
          source.resource_revision === null ||
          resource.revision !== source.resource_revision ||
          chunk.resource_id !== resource.id ||
          chunk.revision !== source.resource_revision ||
          !resource.title.trim()
        ) {
          return { status: "unavailable" };
        }
        return {
          status: "available",
          resourceId: resource.id,
          title: resource.title,
          excerpt: buildPassageExcerpt(chunk.content),
        };
      });

      return {
        id: message.id,
        role: message.role,
        content: message.content,
        status: message.status,
        createdAt: message.created_at,
        sources: resolvedSources,
        hasUnavailableSources: resolvedSources.some((source) => source.status === "unavailable"),
      };
    });
}
