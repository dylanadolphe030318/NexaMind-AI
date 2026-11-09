import { normalizeAssistantQuestion, type AssistantOutcome } from "./assistant-core.ts";

export type AssistantSubmission =
  | { status: "saved"; outcome: AssistantOutcome }
  | { status: "generation-error"; reason?: "error" | "rate-limited" }
  | { status: "save-error" }
  | { status: "in-progress" }
  | { status: "already-complete" }
  | { status: "expired" }
  | { status: "unavailable" }
  | { status: "invalid" };

export type AssistantQuestionDraft = {
  question: string;
  questionId: string;
};

export function editAssistantQuestion(
  initial: AssistantQuestionDraft,
  question: string,
  createId: () => string,
): AssistantQuestionDraft {
  return {
    question,
    questionId: question.trim() === initial.question.trim() ? initial.questionId : createId(),
  };
}

export function nextAssistantQuestionId(
  questionId: string,
  submission: AssistantSubmission,
  createId: () => string,
): string {
  return (
    submission.status === "saved" ||
    submission.status === "already-complete" ||
    submission.status === "expired" ||
    submission.status === "unavailable"
  )
    ? createId()
    : questionId;
}

export type ConversationClaim = {
  claimed: boolean;
  generationToken: string | null;
  status: string;
};

export type ConversationQuestionStatus =
  | "generating"
  | "complete"
  | "failed"
  | "no-context"
  | "unknown"
  | "rate-limited";

export function conversationQuestionStatusLabel(status: string): string {
  const labels: Record<ConversationQuestionStatus, string> = {
    generating: "Réponse en cours",
    complete: "Réponse enregistrée",
    failed: "La réponse n'a pas pu être produite",
    "no-context": "Aucune ressource pertinente",
    unknown: "Information introuvable dans les ressources",
    "rate-limited": "Limite de questions atteinte",
  };
  return Object.hasOwn(labels, status) ? labels[status as ConversationQuestionStatus] : "État indisponible";
}

export type SavedAssistantDeps = {
  claim: (questionId: string, question: string) => Promise<ConversationClaim>;
  generate: (question: string) => Promise<AssistantOutcome | null>;
  finalize: (
    questionId: string,
    generationToken: string,
    answer: string,
    sources: NonNullable<Extract<AssistantOutcome, { status: "ok" }>["sources"]>,
  ) => Promise<boolean>;
  finish: (
    questionId: string,
    generationToken: string,
    status: "failed" | "no-context" | "unknown" | "rate-limited",
  ) => Promise<boolean>;
  logError?: (message: string) => void;
};

async function finishQuietly(
  questionId: string,
  generationToken: string,
  status: "failed" | "no-context" | "unknown" | "rate-limited",
  deps: SavedAssistantDeps,
): Promise<boolean> {
  try {
    return await deps.finish(questionId, generationToken, status);
  } catch {
    deps.logError?.("Impossible d'enregistrer l'état de la question.");
    return false;
  }
}

export async function submitSavedAssistantQuestion(
  rawQuestion: string,
  questionId: string,
  deps: SavedAssistantDeps,
): Promise<AssistantSubmission> {
  const question = normalizeAssistantQuestion(rawQuestion);
  if (!question) {
    return { status: "invalid" };
  }

  let claim: ConversationClaim;
  try {
    claim = await deps.claim(questionId, question);
  } catch {
    deps.logError?.("Impossible d'enregistrer la question.");
    return { status: "save-error" };
  }

  if (!claim.claimed) {
    if (["complete", "no-context", "unknown"].includes(claim.status)) {
      return { status: "already-complete" };
    }
    if (claim.status === "generating") {
      return { status: "in-progress" };
    }
    if (claim.status === "invalid") {
      return { status: "invalid" };
    }
    if (claim.status === "expired") {
      return { status: "expired" };
    }
    if (claim.status === "unavailable") {
      return { status: "unavailable" };
    }
    return { status: "save-error" };
  }
  if (!claim.generationToken) {
    deps.logError?.("La revendication de la question n'a pas fourni de jeton.");
    return { status: "save-error" };
  }
  const generationToken = claim.generationToken;

  let outcome: AssistantOutcome | null;
  try {
    outcome = await deps.generate(question);
  } catch {
    deps.logError?.("La génération de la réponse a échoué.");
    outcome = { status: "error" };
  }

  if (!outcome || outcome.status === "error" || outcome.status === "rate-limited") {
    const finished = await finishQuietly(
      questionId,
      generationToken,
      outcome?.status === "rate-limited" ? "rate-limited" : "failed",
      deps,
    );
    if (!finished) {
      return { status: "in-progress" };
    }
    return {
      status: "generation-error",
      reason: outcome?.status === "rate-limited" ? "rate-limited" : "error",
    };
  }

  if (outcome.status === "ok") {
    try {
      const saved = await deps.finalize(questionId, generationToken, outcome.answer, outcome.sources);
      if (!saved) {
        const finished = await finishQuietly(questionId, generationToken, "failed", deps);
        return finished ? { status: "save-error" } : { status: "in-progress" };
      }
    } catch {
      deps.logError?.("Impossible d'enregistrer la réponse et ses sources.");
      const finished = await finishQuietly(questionId, generationToken, "failed", deps);
      return finished ? { status: "save-error" } : { status: "in-progress" };
    }

    return { status: "saved", outcome };
  }

  if (outcome.status === "invalid") {
    const finished = await finishQuietly(questionId, generationToken, "failed", deps);
    return finished ? { status: "generation-error" } : { status: "in-progress" };
  }

  const finished = await finishQuietly(questionId, generationToken, outcome.status, deps);
  if (!finished) {
    return { status: "in-progress" };
  }
  return { status: "saved", outcome };
}
