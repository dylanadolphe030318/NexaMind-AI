import type { ConversationQuestionStatus } from "./assistant-conversation-core.ts";

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
