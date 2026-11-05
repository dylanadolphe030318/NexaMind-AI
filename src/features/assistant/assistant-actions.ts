"use server";

import { redirect } from "next/navigation";

import { askAssistant } from "./assistant";
import type { AssistantFormState } from "./assistant-state";

export async function submitQuestion(
  _previousState: AssistantFormState,
  formData: FormData,
): Promise<AssistantFormState> {
  const question = String(formData.get("question") ?? "");
  const outcome = await askAssistant(question);
  if (!outcome) {
    redirect("/login");
  }
  return { question, outcome };
}
