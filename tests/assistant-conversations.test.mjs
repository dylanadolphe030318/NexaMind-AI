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
  deleteConversationWith,
  processConversationDeletion,
  readConversationHistory,
} from "../src/features/assistant/conversations-core.ts";

const successfulOutcome = {
  status: "ok",
  answer: "Réponse fondée. [[source:passage-1]]",
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
    status: "complete",
    question_id: question.id,
    created_at: `2026-01-${String(index + 1).padStart(2, "0")}T10:00:01Z`,
  }));
  const context = buildRecentConversationExchanges(questions, answers, "current-question");

  assert.equal(context.omittedCount, 2);
  assert.equal(context.exchanges.length, 10);
  assert.equal(context.exchanges[0].question, "Question 2");
  assert.equal(context.exchanges.at(-1).answer, "Réponse 11");
  assert.equal(JSON.stringify(context).includes("source"), false);

  const citedContext = buildRecentConversationExchanges(
    [{ id: "q", role: "user", content: "Question", status: "complete", created_at: "2026-01-01T10:00:00Z" }],
    [{ id: "a", role: "assistant", content: "Fait. [[source:chunk-id]]", status: "complete", question_id: "q", created_at: "2026-01-01T10:00:01Z" }],
    "current",
  );
  assert.equal(citedContext.exchanges[0].answer, "Fait.");
});

test("le contexte exclut la question actuelle et les demandes encore en cours", () => {
  const context = buildRecentConversationExchanges([
    { id: "old", role: "user", content: "Ancienne question", status: "complete", created_at: "2026-01-01T10:00:00Z" },
    { id: "current", role: "user", content: "Question courante", status: "generating", created_at: "2026-01-02T10:00:00Z" },
    { id: "other-pending", role: "user", content: "Question pendante", status: "generating", created_at: "2026-01-03T10:00:00Z" },
  ], [], "current");

  assert.deepEqual(context, { exchanges: [{ question: "Ancienne question" }], omittedCount: 0 });
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
    ["question-id", "attempt-token", "Réponse fondée. [[source:passage-1]]", successfulOutcome.sources],
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
      sourceId: "current-chunk",
      resourceId: "current-resource",
      title: "Current title",
      excerpt: "Currently verifiable passage.",
    },
    { status: "unavailable", sourceId: "old-chunk" },
    { status: "unavailable" },
  ]);
  assert.equal(messages[1].hasUnavailableSources, true);
  assert.equal(JSON.stringify(messages).includes("Old private title"), false);
});

test("les associations à plusieurs passages de la même ressource survivent à la relecture", () => {
  const answer = "La story concernée est 3.1. [[source:chunk-1]] [[source:chunk-2]]";
  const messages = buildConversationHistoryMessages(
    [{
      id: "answer",
      role: "assistant",
      content: answer,
      status: "complete",
      created_at: "2026-01-01T10:00:01Z",
    }],
    [
      { answer_message_id: "answer", resource_id: "resource-1", chunk_id: "chunk-1", resource_revision: 4 },
      { answer_message_id: "answer", resource_id: "resource-1", chunk_id: "chunk-2", resource_revision: 4 },
    ],
    [{ id: "resource-1", title: "Story", revision: 4 }],
    [
      { id: "chunk-1", resource_id: "resource-1", revision: 4, content: "Preuve numéro 3.1." },
      { id: "chunk-2", resource_id: "resource-1", revision: 4, content: "Détail complémentaire." },
    ],
  );

  assert.equal(messages[0].content, answer);
  assert.deepEqual(messages[0].sources, [
    { status: "available", sourceId: "chunk-1", resourceId: "resource-1", title: "Story", excerpt: "Preuve numéro 3.1." },
    { status: "available", sourceId: "chunk-2", resourceId: "resource-1", title: "Story", excerpt: "Détail complémentaire." },
  ]);
  assert.equal(messages[0].hasUnavailableSources, false);
});

test("une référence sans passage accessible est indiquée comme indisponible sans exposer de titre ancien", () => {
  const messages = buildConversationHistoryMessages(
    [{
      id: "answer",
      role: "assistant",
      content: "Fait. [[source:removed-chunk]]",
      status: "complete",
      created_at: "2026-01-01T10:00:01Z",
    }],
    [],
    [],
    [],
  );

  assert.equal(messages[0].hasUnavailableSources, true);
  assert.deepEqual(messages[0].sources, []);
  assert.equal(messages[0].content.includes("Ancien titre"), false);
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

test("la suppression appelle le RPC propriétaire seulement après authentification", async () => {
  const calls = [];
  const result = await deleteConversationWith("f43560ae-f2fc-4d7b-bf0f-d1f69f33d968", {
    isAuthenticated: async () => true,
    deleteOwnedConversation: async (id) => {
      calls.push(id);
      return true;
    },
  });

  assert.equal(result, "deleted");
  assert.deepEqual(calls, ["f43560ae-f2fc-4d7b-bf0f-d1f69f33d968"]);

  const unauthenticated = await deleteConversationWith("f43560ae-f2fc-4d7b-bf0f-d1f69f33d968", {
    isAuthenticated: async () => false,
    deleteOwnedConversation: async () => assert.fail("Un utilisateur déconnecté ne doit pas supprimer."),
  });
  assert.equal(unauthenticated, "unauthenticated");
});

test("une cible refusée ou une erreur de suppression ne devient jamais un succès", async () => {
  const unavailable = await deleteConversationWith("f43560ae-f2fc-4d7b-bf0f-d1f69f33d968", {
    isAuthenticated: async () => true,
    deleteOwnedConversation: async () => false,
  });
  assert.equal(unavailable, "unavailable");

  const failed = await deleteConversationWith("f43560ae-f2fc-4d7b-bf0f-d1f69f33d968", {
    isAuthenticated: async () => true,
    deleteOwnedConversation: async () => { throw new Error("database error"); },
  });
  assert.equal(failed, "error");

  let called = false;
  assert.equal(await deleteConversationWith("not-a-uuid", {
    isAuthenticated: async () => true,
    deleteOwnedConversation: async () => { called = true; return true; },
  }), "unavailable");
  assert.equal(called, false);
});

test("la confirmation est un formulaire explicite et Annuler n'appelle aucune mutation", () => {
  const action = readFileSync("src/features/assistant/assistant-actions.ts", "utf8");
  const service = readFileSync("src/features/assistant/conversations.ts", "utf8");
  const list = readFileSync("src/app/assistant/conversations/page.tsx", "utf8");
  const detail = readFileSync("src/app/assistant/conversations/[id]/page.tsx", "utf8");

  assert.ok(list.includes("?delete=confirm"));
  assert.ok(detail.includes("Supprimer la conversation"));
  assert.ok(detail.includes("<form action={deleteConversationAction}"));
  assert.ok(detail.includes('<button className="button auth-submit" type="submit">'));
  assert.ok(detail.includes('href={`/assistant/conversations/${id}`}'));
  assert.ok(detail.includes("Annuler"));
  assert.ok(action.includes("processConversationDeletion(formData"));
  assert.ok(detail.includes("La conversation n&apos;a pas pu &ecirc;tre supprim&eacute;e"));
  assert.ok(service.includes("supabase.auth.getUser()"));
  assert.ok(service.includes('supabase.rpc("delete_owned_conversation"'));
});

test("le formulaire transmet son identifiant au service et traite chaque résultat sans faux succès", async () => {
  const id = "f43560ae-f2fc-4d7b-bf0f-d1f69f33d968";
  for (const [result, destination] of [
    ["deleted", "/assistant/conversations?deleted=1"],
    ["unavailable", "/assistant/conversations?deleteError=1"],
    ["error", `/assistant/conversations/${id}?delete=confirm&error=1`],
    [null, "/login"],
  ]) {
    const form = new FormData();
    form.set("conversationId", id);
    const calls = [];
    const invalidations = [];
    assert.equal(await processConversationDeletion(form, {
      deleteConversation: async (target) => { calls.push(target); return result; },
      revalidate: (path) => invalidations.push(path),
    }), destination);
    assert.deepEqual(calls, [id]);
    assert.deepEqual(invalidations, result === "deleted"
      ? ["/assistant/conversations", `/assistant/conversations/${id}`] : []);
  }
  for (const value of [null, "invalid", new Blob(["invalid"])]) {
    const form = new FormData();
    if (value !== null) form.set("conversationId", value);
    assert.equal(await processConversationDeletion(form, {
      deleteConversation: async () => assert.fail("Aucune mutation sur une saisie invalide"),
      revalidate: () => assert.fail("Aucune invalidation sur une saisie invalide"),
    }), "/assistant/conversations?deleteError=1");
  }
});

test("la migration autorise une suppression propriétaire atomique sans toucher aux ressources", () => {
  const migration = readFileSync(
    "supabase/migrations/20261110140000_delete_owned_conversation.sql",
    "utf8",
  );
  const schema = readFileSync("supabase/migrations/20261106120000_create_conversations.sql", "utf8");

  assert.ok(migration.includes("security definer"));
  assert.ok(migration.includes("set search_path = ''"));
  assert.ok(migration.includes("auth.uid()"));
  assert.ok(migration.includes("conversation.owner_id = v_user"));
  assert.ok(migration.includes("revoke all on function public.delete_owned_conversation(uuid) from public, anon"));
  assert.ok(migration.includes("grant execute on function public.delete_owned_conversation(uuid) to authenticated"));
  assert.doesNotMatch(migration, /service_role|public\.resources|resource_chunks|message_sources/i);
  assert.ok(schema.includes("for update of message, conversation"));
  assert.ok(schema.includes("if not found then"));
  assert.ok(schema.includes("return false;"));
});
