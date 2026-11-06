import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  conversationQuestionStatusLabel,
  editAssistantQuestion,
  nextAssistantQuestionId,
  submitSavedAssistantQuestion,
} from "../src/features/assistant/assistant-conversation-core.ts";
import { buildConversationSummaries } from "../src/features/assistant/conversations-core.ts";

const successfulOutcome = {
  status: "ok",
  answer: "Réponse fondée.",
  sources: [
    {
      chunkId: "passage-1",
      resourceId: "resource-1",
      revision: 3,
      title: "Ressource",
      excerpt: "Extrait non persisté",
    },
  ],
};

test("modifier la question change son identifiant, mais une vraie relance le conserve", () => {
  const initial = { question: "Question initiale ?", questionId: "initial-id" };
  let created = 0;
  const createId = () => `edited-id-${++created}`;

  assert.deepEqual(editAssistantQuestion(initial, "  Question initiale ?  ", createId), {
    question: "  Question initiale ?  ",
    questionId: "initial-id",
  });
  assert.equal(created, 0);

  const edited = editAssistantQuestion(initial, "Question modifiée ?", createId);
  assert.equal(edited.questionId, "edited-id-1");
  assert.equal(editAssistantQuestion(initial, initial.question, createId).questionId, "initial-id");
  assert.notEqual(editAssistantQuestion(initial, "", createId).questionId, initial.questionId);
  assert.equal(created, 2);
});

test("une nouvelle question après un échec ne réutilise pas l'identifiant du texte enregistré", async () => {
  const storedQuestions = new Map();
  let generated = 0;
  const deps = dependencies({
    claim: async (id, question) => {
      if (storedQuestions.has(id) && storedQuestions.get(id) !== question) {
        return { claimed: false, generationToken: null, status: "conflict" };
      }
      storedQuestions.set(id, question);
      return { claimed: true, generationToken: "attempt-token", status: "generating" };
    },
    generate: async () => ++generated === 1 ? { status: "error" } : successfulOutcome,
  });
  const initial = { question: "Première question ?", questionId: "first-id" };
  const failed = await submitSavedAssistantQuestion(initial.question, initial.questionId, deps);
  assert.equal(failed.status, "generation-error");
  assert.equal(nextAssistantQuestionId(initial.questionId, failed, () => "unused-id"), "first-id");

  const edited = editAssistantQuestion(initial, "Question modifiée ?", () => "second-id");
  const saved = await submitSavedAssistantQuestion(edited.question, edited.questionId, deps);
  assert.equal(saved.status, "saved");
  assert.deepEqual([...storedQuestions], [
    ["first-id", "Première question ?"],
    ["second-id", "Question modifiée ?"],
  ]);
  assert.equal(generated, 2);
});

test("l'état du formulaire conserve l'identifiant en échec et le réutilise à la tentative suivante", async () => {
  const id = "same-question-id";
  let attempts = 0;
  const deps = dependencies({
    generate: async () => ++attempts === 1 ? { status: "error" } : successfulOutcome,
  });
  const failed = await submitSavedAssistantQuestion("Question ?", id, deps);
  const retryId = nextAssistantQuestionId(id, failed, () => "new-question-id");
  assert.equal(retryId, id);
  const retried = await submitSavedAssistantQuestion("Question ?", retryId, deps);
  assert.equal(nextAssistantQuestionId(retryId, retried, () => "new-question-id"), "new-question-id");
  assert.deepEqual(deps.calls.claimed.map((call) => call.id), [id, id]);
  const action = readFileSync("src/features/assistant/assistant-actions.ts", "utf8");
  assert.match(action, /questionId: nextAssistantQuestionId\(questionId, submission, randomUUID\)/);
});

function dependencies(overrides = {}) {
  const calls = { claimed: [], generated: [], finalized: [], finished: [] };
  return {
    calls,
    claim: async (id, question) => {
      calls.claimed.push({ id, question });
      return { claimed: true, generationToken: "attempt-token", status: "generating" };
    },
    generate: async (question) => {
      calls.generated.push(question);
      return successfulOutcome;
    },
    finalize: async (...args) => {
      calls.finalized.push(args);
      return true;
    },
    finish: async (...args) => {
      calls.finished.push(args);
      return true;
    },
    ...overrides,
  };
}

test("sauvegarde atomiquement réponse et références seulement après génération", async () => {
  const deps = dependencies();
  const result = await submitSavedAssistantQuestion("  Question ? ", "question-id", deps);

  assert.deepEqual(result, { status: "saved", outcome: successfulOutcome });
  assert.deepEqual(deps.calls.claimed, [{ id: "question-id", question: "Question ?" }]);
  assert.deepEqual(deps.calls.generated, ["Question ?"]);
  assert.deepEqual(deps.calls.finalized, [
    ["question-id", "attempt-token", "Réponse fondée.", successfulOutcome.sources],
  ]);
  assert.deepEqual(deps.calls.finished, []);
});

test("une erreur de génération conserve la question et n'invente aucune réponse", async () => {
  const deps = dependencies({
    generate: async () => ({ status: "error" }),
  });
  const result = await submitSavedAssistantQuestion("Question ?", "question-id", deps);

  assert.deepEqual(result, { status: "generation-error", reason: "error" });
  assert.deepEqual(deps.calls.finished, [["question-id", "attempt-token", "failed"]]);
  assert.deepEqual(deps.calls.finalized, []);
});

test("un échec de sauvegarde final n'est pas annoncé comme succès ni relancé automatiquement", async () => {
  const deps = dependencies({
    finalize: async () => {
      throw new Error("database error");
    },
  });
  const result = await submitSavedAssistantQuestion("Question ?", "question-id", deps);

  assert.deepEqual(result, { status: "save-error" });
  assert.equal(deps.calls.generated.length, 1);
  assert.deepEqual(deps.calls.finished, [["question-id", "attempt-token", "failed"]]);
});

test("une revendication reprise ne peut pas être finalisée par l'ancien jeton", async () => {
  const deps = dependencies({
    finalize: async () => false,
    finish: async () => false,
  });
  const result = await submitSavedAssistantQuestion("Question ?", "question-id", deps);
  assert.deepEqual(result, { status: "in-progress" });
});

test("une limite de débit reste visible comme telle dans l'état enregistré", async () => {
  const deps = dependencies({
    generate: async () => ({ status: "rate-limited" }),
  });
  const result = await submitSavedAssistantQuestion("Question ?", "question-id", deps);
  assert.deepEqual(result, { status: "generation-error", reason: "rate-limited" });
  assert.deepEqual(deps.calls.finished, [["question-id", "attempt-token", "rate-limited"]]);
});

test("une revendication déjà active ou terminée ne rappelle pas le fournisseur", async () => {
  for (const status of ["generating", "complete"]) {
    const deps = dependencies({
      claim: async () => ({ claimed: false, generationToken: null, status }),
    });
    const result = await submitSavedAssistantQuestion("Question ?", "question-id", deps);

    assert.deepEqual(
      result,
      status === "generating" ? { status: "in-progress" } : { status: "already-complete" },
    );
    assert.deepEqual(deps.calls.generated, []);
  }
});

test("une entrée invalide ne crée pas de question et une absence de contexte est persistée", async () => {
  const invalidDeps = dependencies();
  assert.deepEqual(await submitSavedAssistantQuestion("  ", "question-id", invalidDeps), {
    status: "invalid",
  });
  assert.deepEqual(invalidDeps.calls.claimed, []);

  const noContextDeps = dependencies({
    generate: async () => ({ status: "no-context" }),
  });
  assert.deepEqual(await submitSavedAssistantQuestion("Question ?", "question-id", noContextDeps), {
    status: "saved",
    outcome: { status: "no-context" },
  });
  assert.deepEqual(noContextDeps.calls.finished, [
    ["question-id", "attempt-token", "no-context"],
  ]);
});

test("la migration masque les expirés sous RLS et détache les références aux passages retirés", () => {
  const migration = readFileSync("supabase/migrations/20261106120000_create_conversations.sql", "utf8");
  assert.match(migration, /owner_id = \(select auth\.uid\(\)\) and expires_at > now\(\)/);
  assert.match(migration, /conversations\.expires_at > now\(\)/);
  assert.match(migration, /chunk_id uuid references public\.resource_chunks \(id\) on delete set null/);
  assert.match(migration, /resource_id uuid references public\.resources \(id\) on delete set null/);
  assert.match(migration, /revoke all on public\.conversations, public\.messages, public\.message_sources/);
  assert.doesNotMatch(migration, /responsable/i);
});

test("l'historique traduit explicitement l'état d'échec et l'état enregistré", () => {
  assert.equal(conversationQuestionStatusLabel("failed"), "La réponse n'a pas pu être produite");
  assert.equal(conversationQuestionStatusLabel("complete"), "Réponse enregistrée");
  assert.equal(conversationQuestionStatusLabel("inconnu"), "État indisponible");
});

test("l'historique trie par activité récente et titre chaque conversation par sa première question", () => {
  const summaries = buildConversationSummaries(
    [
      { id: "older", last_question_at: "2026-01-01T10:00:00Z" },
      { id: "newer", last_question_at: "2026-02-01T10:00:00Z" },
    ],
    [
      {
        conversation_id: "newer",
        content: "Question initiale",
        created_at: "2026-01-30T10:00:00Z",
        status: "failed",
      },
      {
        conversation_id: "newer",
        content: "Question suivante",
        created_at: "2026-01-31T10:00:00Z",
        status: "complete",
      },
      {
        conversation_id: "older",
        content: "Ancienne question",
        created_at: "2026-01-01T10:00:00Z",
        status: "complete",
      },
    ],
  );
  assert.deepEqual(
    summaries.map(({ id, firstQuestion, status }) => ({ id, firstQuestion, status })),
    [
      { id: "newer", firstQuestion: "Question initiale", status: "failed" },
      { id: "older", firstQuestion: "Ancienne question", status: "complete" },
    ],
  );
});
