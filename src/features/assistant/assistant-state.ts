import type { AssistantOutcome } from "./assistant-core";

export type AssistantFormState = {
  question: string;
  outcome: AssistantOutcome | null;
};

export const initialAssistantState: AssistantFormState = { question: "", outcome: null };
