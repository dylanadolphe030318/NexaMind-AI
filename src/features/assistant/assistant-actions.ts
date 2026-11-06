"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { askAndSaveQuestion } from "./conversations";
import { nextAssistantQuestionId } from "./assistant-conversation-core";
import type { AssistantFormState } from "./assistant-state";

export async function submitQuestion(
  _previousState: AssistantFormState,
  formData: FormData,
): Promise<AssistantFormState> {
  const question = String(formData.get("question") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const submission = await askAndSaveQuestion(question, questionId);
  if (submission === null) {
    redirect("/login");
  }

  if (
    submission.status === "saved" ||
    submission.status === "already-complete" ||
    submission.status === "generation-error" ||
    submission.status === "in-progress"
  ) {
    revalidatePath("/assistant/conversations");
  }

  return {
    question,
    questionId: nextAssistantQuestionId(questionId, submission, randomUUID),
    submission,
  };
}
