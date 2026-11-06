import type { AssistantSubmission } from "./assistant-conversation-core";

export type AssistantFormState = {
  question: string;
  questionId: string;
  submission: AssistantSubmission | null;
};
