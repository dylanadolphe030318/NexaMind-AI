import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  conversationQuestionStatusLabel,
  editAssistantQuestion,
  nextAssistantQuestionId,
  submitSavedAssistantQuestion,
} from "../src/features/assistant/assistant-conversation-core.ts";
import {
  buildConversationHistoryMessages,
  buildConversationSummaries,
  buildRecentConversationExchanges,
  generateConversationFollowup,
  hasOmittedConversationExchanges,
  loadRecentConversationContext,
  readConversationHistory,
} from "../src/features/assistant/conversations-core.ts";

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

test("le contexte de suivi conserve les dix derniers échanges sans anciens extraits", () => {
  const questions = Array.from({ length: 12 }, (_, index) => ({
    id: `question-${index}`,
    role: "user",
    content: `Question ${index}`,
    status: "complete",
    created_at: `2026-01-${String(index + 1).padStart(2, "0")}T10:00:00Z`,
  }));
  const answers = questions.map((question, index) => ({
    id: `answer-${index}`,
    role: "assistant",
    content: `Réponse ${index}`,
    sourceExcerpt: "ANCIEN EXTRAIT SOURCE NON AUTORISÉ",
    status: "complete",
    question_id: question.id,
    created_at: `2026-01-${String(index + 1).padStart(2, "0")}T10:00:01Z`,
  }));
  const context = buildRecentConversationExchanges(questions, answers, "current-question");

  assert.equal(context.omittedCount, 2);
  assert.equal(context.exchanges.length, 10);
  assert.equal(context.exchanges[0].question, "Question 2");
  assert.equal(context.exchanges.at(-1).answer, "Réponse 11");
  assert.doesNotMatch(JSON.stringify(context), /ANCIEN EXTRAIT SOURCE NON AUTORISÉ/);
});

test("la continuation transmet au générateur le contexte chargé de la conversation", async () => {
  const selectedConversationId = "conversation-selected";
  const currentQuestionId = "question-current";
  const messages = [
    {
      id: "question-selected",
      conversation_id: selectedConversationId,
      role: "user",
      content: "Quelle technologie ?",
      status: "complete",
      created_at: "2026-01-01T10:00:00Z",
    },
    {
      id: "answer-selected",
      conversation_id: selectedConversationId,
      role: "assistant",
      content: "Atlas.",
      status: "complete",
      created_at: "2026-01-01T10:00:01Z",
      question_id: "question-selected",
    },
    {
      id: "question-other",
      conversation_id: "conversation-other",
      role: "user",
      content: "Private other conversation",
      status: "complete",
      created_at: "2026-01-02T10:00:00Z",
    },
    {
      id: "question-current",
      conversation_id: selectedConversationId,
      role: "user",
      content: "Comment fonctionne cette technologie ?",
      status: "generating",
      created_at: "2026-01-03T10:00:00Z",
    },
  ];
  const calls = [];
  const outcome = await generateConversationFollowup(
    "Comment fonctionne cette technologie ?",
    selectedConversationId,
    currentQuestionId,
    {
      readRecentContext: async (conversationId, questionId) =>
        loadRecentConversationContext(conversationId, questionId, {
          findConversation: async (id) => id === selectedConversationId,
          readQuestions: async (id, currentId, limit) => {
            assert.equal(id, selectedConversationId);
            assert.equal(currentId, currentQuestionId);
            assert.equal(limit, 11);
            return messages.filter(
              (message) =>
                message.conversation_id === id &&
                message.role === "user" &&
                message.id !== currentId &&
                message.status !== "generating",
            );
          },
          readAnswers: async (id, questionIds) => {
            assert.equal(id, selectedConversationId);
            assert.deepEqual(questionIds, ["question-selected"]);
            return messages.filter(
              (message) => message.conversation_id === id && message.role === "assistant",
            );
          },
        }),
      generate: async (...args) => {
        calls.push(args);
        return { status: "unknown" };
      },
    },
  );

  assert.deepEqual(calls, [[
    "Comment fonctionne cette technologie ?",
    [{ question: "Quelle technologie ?", answer: "Atlas." }],
  ]]);
  assert.deepEqual(outcome, { status: "unknown" });
});

test("la continuation arrêtée avant génération ne transmet pas de contexte", async () => {
  let generated = false;
  const outcome = await generateConversationFollowup(
    "Question de suivi ?",
    "conversation-supprimée",
    "question-id",
    {
      readRecentContext: async () => null,
      generate: async () => {
        generated = true;
        return { status: "unknown" };
      },
    },
  );

  assert.equal(outcome, null);
  assert.equal(generated, false);
});

test("le contexte exclut la question actuelle et les demandes encore en cours", () => {
  const context = buildRecentConversationExchanges([
    { id: "old", role: "user", content: "Ancienne question", status: "complete", created_at: "2026-01-01T10:00:00Z" },
    { id: "current", role: "user", content: "Question courante", status: "generating", created_at: "2026-01-02T10:00:00Z" },
    { id: "other-pending", role: "user", content: "Question pendante", status: "generating", created_at: "2026-01-03T10:00:00Z" },
  ], [], "current");

  assert.deepEqual(context, { exchanges: [{ question: "Ancienne question" }], omittedCount: 0 });
});

test("l'avis d'exclusion ne compte pas les questions encore en cours", () => {
  const completedQuestions = Array.from({ length: 10 }, () => ({ role: "user", status: "complete" }));
  assert.equal(
    hasOmittedConversationExchanges([
      ...completedQuestions,
      { role: "user", status: "generating" },
    ]),
    false,
  );
  assert.equal(
    hasOmittedConversationExchanges([
      ...completedQuestions,
      { role: "user", status: "failed" },
    ]),
    true,
  );
});

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
  for (const status of ["generating", "complete", "no-context", "unknown"]) {
    const deps = dependencies({
      claim: async () => ({ claimed: false, generationToken: null, status }),
    });
    const result = await submitSavedAssistantQuestion("Question ?", "question-id", deps);

    assert.deepEqual(
      result,
      status === "generating" ? { status: "in-progress" } : { status: "already-complete" },
    );
    assert.deepEqual(deps.calls.generated, []);
    assert.deepEqual(deps.calls.finalized, []);
    assert.deepEqual(deps.calls.finished, []);
    assert.equal(
      nextAssistantQuestionId("question-id", result, () => "new-question-id"),
      status === "generating" ? "question-id" : "new-question-id",
    );
  }
});

test("une conversation expirée permet un nouvel envoi avec un identifiant neuf", async () => {
  const claimedIds = [];
  const deps = dependencies({
    claim: async (id) => {
      claimedIds.push(id);
      return id === "expired-id"
        ? { claimed: false, generationToken: null, status: "expired" }
        : { claimed: true, generationToken: "new-token", status: "generating" };
    },
  });
  const expired = await submitSavedAssistantQuestion("Question ?", "expired-id", deps);

  assert.deepEqual(expired, { status: "expired" });
  const newId = nextAssistantQuestionId("expired-id", expired, () => "fresh-id");
  assert.equal(newId, "fresh-id");

  const retried = await submitSavedAssistantQuestion("Question ?", newId, deps);
  assert.equal(retried.status, "saved");
  assert.deepEqual(claimedIds, ["expired-id", "fresh-id"]);
  assert.deepEqual(deps.calls.generated, ["Question ?"]);
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

test("la migration de continuation exige une conversation existante et son propriétaire", () => {
  const migration = readFileSync("supabase/migrations/20261109130000_continue_conversations.sql", "utf8");
  assert.match(migration, /claim_conversation_question_in_conversation/);
  assert.match(migration, /v_conversation_owner <> v_user/);
  assert.match(migration, /v_expires_at <= now\(\)/);
  assert.match(migration, /grant execute[\s\S]*to authenticated/);
  assert.doesNotMatch(migration, /insert into public\.conversations/i);
  assert.match(migration, /last_question_at = now\(\)/);
  assert.match(migration, /expires_at = now\(\) \+ interval '30 days'/);
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

test("la page de conversation propose un ajout et annonce la fenêtre de contexte", () => {
  const page = readFileSync("src/app/assistant/conversations/[id]/page.tsx", "utf8");
  const form = readFileSync("src/features/assistant/assistant-form.tsx", "utf8");
  const action = readFileSync("src/features/assistant/assistant-actions.ts", "utf8");
  assert.match(page, /Seuls les 10 derniers/);
  assert.match(page, /conversationMode/);
  assert.match(form, /Poser une nouvelle question/);
  assert.match(form, /jusqu'aux 10 derniers échanges de cette conversation/i);
  assert.match(form, /name="conversationId"/);
  assert.match(action, /askAndSaveQuestion\(question, questionId, conversationId \|\| undefined\)/);
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


test("la relecture n'affiche que les sources de la revision enregistree", () => {
  const messages = buildConversationHistoryMessages(
    [
      { id: "answer", role: "assistant", content: "Saved answer", status: "complete", created_at: "2026-01-01T10:00:01Z" },
      { id: "question", role: "user", content: "Saved question", status: "complete", created_at: "2026-01-01T10:00:00Z" },
    ],
    [
      { answer_message_id: "answer", resource_id: "current-resource", chunk_id: "current-chunk", resource_revision: 2 },
      { answer_message_id: "answer", resource_id: "changed-resource", chunk_id: "old-chunk", resource_revision: 2 },
      { answer_message_id: "answer", resource_id: null, chunk_id: null, resource_revision: 2 },
    ],
    [
      { id: "current-resource", title: "Current title", revision: 2 },
      { id: "changed-resource", title: "Old private title", revision: 3 },
    ],
    [
      { id: "current-chunk", resource_id: "current-resource", revision: 2, content: "Currently verifiable passage." },
    ],
  );

  assert.deepEqual(messages.map(({ role }) => role), ["user", "assistant"]);
  assert.deepEqual(messages[1].sources, [
    {
      status: "available",
      resourceId: "current-resource",
      title: "Current title",
      excerpt: "Currently verifiable passage.",
    },
    { status: "unavailable" },
    { status: "unavailable" },
  ]);
  assert.equal(messages[1].hasUnavailableSources, true);
  assert.equal(JSON.stringify(messages).includes("Old private title"), false);
});

test("la relecture distingue une conversation indisponible d'une erreur de chargement", async () => {
  let readCount = 0;
  const unavailable = await readConversationHistory("expired-id", {
    findConversation: async () => ({ status: "ok", data: false }),
    readMessages: async () => { readCount++; return { status: "ok", data: [] }; },
    readSources: async () => { readCount++; return { status: "ok", data: [] }; },
    readResources: async () => { readCount++; return { status: "ok", data: [] }; },
    readChunks: async () => { readCount++; return { status: "ok", data: [] }; },
  });
  assert.deepEqual(unavailable, { status: "unavailable" });
  assert.equal(readCount, 0);

  const failure = await readConversationHistory("active-id", {
    findConversation: async () => ({ status: "ok", data: true }),
    readMessages: async () => ({ status: "ok", data: [
      { id: "answer", role: "assistant", content: "History", status: "complete", created_at: "2026-01-01T10:00:00Z" },
    ] }),
    readSources: async () => ({ status: "ok", data: [
      { answer_message_id: "answer", resource_id: "resource", chunk_id: "chunk", resource_revision: 1 },
    ] }),
    readResources: async () => ({ status: "error" }),
    readChunks: async () => ({ status: "ok", data: [] }),
  });
  assert.deepEqual(failure, { status: "error" });
});
