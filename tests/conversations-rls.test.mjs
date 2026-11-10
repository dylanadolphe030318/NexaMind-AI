import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

import {
  nextAssistantQuestionId,
  submitSavedAssistantQuestion,
} from "../src/features/assistant/assistant-conversation-core.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const accounts = {
  memberA: [process.env.RLS_TEST_MEMBER_A_EMAIL, process.env.RLS_TEST_MEMBER_A_PASSWORD],
  memberB: [process.env.RLS_TEST_MEMBER_B_EMAIL, process.env.RLS_TEST_MEMBER_B_PASSWORD],
  manager: [process.env.RLS_TEST_MANAGER_EMAIL, process.env.RLS_TEST_MANAGER_PASSWORD],
};

let skipReason = "";
let continuationSkipReason = "";
let deletionSkipReason = "";
if (!supabaseUrl || !publishableKey || Object.values(accounts).flat().some((value) => !value)) {
  skipReason = "Variables de session de test absentes.";
  continuationSkipReason = skipReason;
  deletionSkipReason = skipReason;
} else if (publishableKey.startsWith("sb_secret_")) {
  throw new Error("Les tests refusent toute clé Supabase privilégiée.");
} else {
  const probe = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { error: loginError } = await probe.auth.signInWithPassword({
    email: accounts.memberA[0],
    password: accounts.memberA[1],
  });
  assert.ifError(loginError);
  const { error } = await probe.from("conversations").select("id").limit(0);
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    skipReason =
      "Migration requise avant ces tests : supabase/migrations/20261106120000_create_conversations.sql";
    continuationSkipReason = skipReason;
    deletionSkipReason = skipReason;
  } else if (error) {
    throw new Error(`Impossible de vérifier la migration conversations (${error.code}).`);
  } else {
    const { error: continuationError } = await probe.rpc(
      "claim_conversation_question_in_conversation",
      { p_question_id: null, p_question: null, p_conversation_id: randomUUID() },
    );
    if (continuationError?.code === "PGRST202") {
      continuationSkipReason =
        "Migration requise avant ces tests : supabase/migrations/20261109130000_continue_conversations.sql";
    } else if (continuationError) {
      throw new Error(`Impossible de vérifier la migration de continuation (${continuationError.code}).`);
    }

    const { error: deletionError } = await probe.rpc("delete_owned_conversation", {
      p_conversation_id: randomUUID(),
    });
    if (deletionError?.code === "PGRST202") {
      deletionSkipReason =
        "Migration requise avant ces tests : supabase/migrations/20261110140000_delete_owned_conversation.sql";
    } else if (deletionError) {
      throw new Error(`Impossible de vérifier la migration de suppression (${deletionError.code}).`);
    }
  }
}

async function login([email, password]) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  return { client, userId: data.user.id };
}

async function claim(client, questionId, question) {
  const { data, error } = await client.rpc("claim_conversation_question", {
    p_question_id: questionId,
    p_question: question,
  });
  assert.ifError(error);
  return Array.isArray(data) ? data[0] : data;
}

async function claimInConversation(client, conversationId, questionId, question) {
  const { data, error } = await client.rpc("claim_conversation_question_in_conversation", {
    p_question_id: questionId,
    p_question: question,
    p_conversation_id: conversationId,
  });
  assert.ifError(error);
  return Array.isArray(data) ? data[0] : data;
}

test(
  "la continuation refuse les tiers, reste idempotente et prolonge seulement une nouvelle question",
  { skip: continuationSkipReason || false },
  async () => {
    const owner = await login(accounts.memberA);
    const otherMember = await login(accounts.memberB);
    const manager = await login(accounts.manager);
    const seedId = randomUUID();
    const seed = await claim(owner.client, seedId, `conversation racine ${Date.now()}`);
    assert.equal(seed.claimed, true);

    const { data: before, error: beforeError } = await owner.client
      .from("conversations")
      .select("expires_at")
      .eq("id", seed.conversation_id)
      .single();
    assert.ifError(beforeError);

    const questionId = randomUUID();
    const question = `question de suivi ${Date.now()}`;
    const concurrentClaims = await Promise.all([
      claimInConversation(owner.client, seed.conversation_id, questionId, question),
      claimInConversation(owner.client, seed.conversation_id, questionId, question),
    ]);
    assert.equal(concurrentClaims.filter((result) => result.claimed).length, 1);
    const accepted = concurrentClaims.find((result) => result.claimed);
    assert.equal(accepted.conversation_id, seed.conversation_id);
    assert.equal(accepted.question_status, "generating");
    const concurrentDuplicate = concurrentClaims.find((result) => !result.claimed);
    assert.equal(concurrentDuplicate.question_status, "generating");

    const afterAccept = await owner.client
      .from("conversations")
      .select("expires_at")
      .eq("id", seed.conversation_id)
      .single();
    assert.ifError(afterAccept.error);
    assert.ok(Date.parse(afterAccept.data.expires_at) > Date.parse(before.expires_at));

    const duplicate = await claimInConversation(owner.client, seed.conversation_id, questionId, question);
    assert.equal(duplicate.claimed, false);
    assert.equal(duplicate.question_status, "generating");
    const afterDuplicate = await owner.client
      .from("conversations")
      .select("expires_at")
      .eq("id", seed.conversation_id)
      .single();
    assert.ifError(afterDuplicate.error);
    assert.equal(afterDuplicate.data.expires_at, afterAccept.data.expires_at);

    for (const client of [otherMember.client, manager.client]) {
      const deniedId = randomUUID();
      const denied = await claimInConversation(client, seed.conversation_id, deniedId, "question tierce");
      assert.equal(denied.claimed, false);
      assert.equal(denied.question_status, "unavailable");
      const { data: visibleRows, error } = await owner.client
        .from("messages")
        .select("id")
        .eq("id", deniedId);
      assert.ifError(error);
      assert.deepEqual(visibleRows, []);
    }

    for (const [id, token] of [[seedId, seed.generation_token], [questionId, accepted.generation_token]]) {
      const { data, error } = await owner.client.rpc("finish_conversation_question", {
        p_question_id: id,
        p_generation_token: token,
        p_status: "no-context",
      });
      assert.ifError(error);
      assert.equal(data, true);
    }
  },
);

test(
  "conversations : propriété, expiration, état idempotent et finalisation concurrente",
  { skip: skipReason || false },
  async (t) => {
    const a = await login(accounts.memberA);
    const b = await login(accounts.memberB);
    const manager = await login(accounts.manager);
    const questionId = randomUUID();
    const managerQuestionId = randomUUID();
    const question = `S8 conversation RLS ${Date.now()}`;
    let resourceId;
    t.after(async () => {
      if (resourceId) {
        const { error } = await a.client.from("resources").delete().eq("id", resourceId);
        assert.ifError(error);
      }
    });

    const { data: profile, error: profileError } = await a.client
      .from("profiles")
      .select("workspace_id")
      .eq("id", a.userId)
      .single();
    assert.ifError(profileError);
    const { data: category, error: categoryError } = await a.client
      .from("categories")
      .select("id")
      .eq("workspace_id", profile.workspace_id)
      .limit(1)
      .maybeSingle();
    assert.ifError(categoryError);
    let categoryId = category?.id;
    if (!categoryId) {
      const { data: createdCategory, error: createCategoryError } = await manager.client
        .from("categories")
        .insert({ workspace_id: profile.workspace_id, name: `S8 catégorie test ${Date.now()}` })
        .select("id")
        .single();
      assert.ifError(createCategoryError);
      categoryId = createdCategory.id;
    }
    const { data: resource, error: resourceError } = await a.client
      .from("resources")
      .insert({
        workspace_id: profile.workspace_id,
        category_id: categoryId,
        owner_id: a.userId,
        title: `S8 conversation source ${Date.now()}`,
        body: "Contenu source de test.",
      })
      .select("id, revision")
      .single();
    assert.ifError(resourceError);
    resourceId = resource.id;
    const sourceEmbedding = Array(1536).fill(0);
    sourceEmbedding[1535] = 1;
    const { data: published, error: publishError } = await a.client.rpc("publish_resource_chunks", {
      p_resource_id: resource.id,
      p_revision: resource.revision,
      p_chunks: [{
        content: "Contenu du passage source de test.",
        embedding: sourceEmbedding,
      }],
    });
    assert.ifError(publishError);
    assert.equal(published, true);
    const { data: chunks, error: chunksError } = await a.client
      .from("resource_chunks")
      .select("id")
      .eq("resource_id", resource.id)
      .single();
    assert.ifError(chunksError);

    await t.test("le RPC refuse les questions uniquement composées d'espaces, tabulations et retours", async () => {
      for (const emptyQuestion of ["   ", "\t", "\n", "\r\n\t "]) {
        const invalidId = randomUUID();
        const invalid = await claim(a.client, invalidId, emptyQuestion);
        assert.equal(invalid.claimed, false);
        assert.equal(invalid.question_status, "invalid");
        const { data: rows, error } = await a.client.from("messages").select("id").eq("id", invalidId);
        assert.ifError(error);
        assert.deepEqual(rows, []);
      }
    });

    await t.test("une abstention déjà enregistrée est idempotente et ne relance pas l'IA", async () => {
      for (const status of ["no-context", "unknown"]) {
        const terminalId = randomUUID();
        const terminalQuestion = `S8 état terminal ${status}`;
        const initial = await claim(a.client, terminalId, terminalQuestion);
        assert.equal(initial.claimed, true);
        const { data: finished, error: finishError } = await a.client.rpc(
          "finish_conversation_question",
          {
            p_question_id: terminalId,
            p_generation_token: initial.generation_token,
            p_status: status,
          },
        );

        assert.ifError(finishError);
        assert.equal(finished, true);

        const result = await submitSavedAssistantQuestion(terminalQuestion, terminalId, {
          claim: async (id, text) => {
            const row = await claim(a.client, id, text);
            assert.equal(row.question_status, status);
            return {
              claimed: row.claimed,
              generationToken: row.generation_token,
              status: row.question_status,
            };
          },
          generate: async () => assert.fail("Une abstention enregistrée ne doit pas rappeler l'IA."),
          finalize: async () => assert.fail("Aucune réponse ne doit être ajoutée."),
          finish: async () => assert.fail("L'état terminal doit rester inchangé."),
        });
        assert.deepEqual(result, { status: "already-complete" });
        assert.notEqual(nextAssistantQuestionId(terminalId, result, randomUUID), terminalId);

        const { data: questions, error } = await a.client
          .from("messages")
          .select("id, status")
          .eq("id", terminalId);
        assert.ifError(error);
        assert.deepEqual(questions, [{ id: terminalId, status }]);
      }
    });

    const created = await claim(a.client, questionId, question);
    assert.equal(created.claimed, true);
    assert.equal(created.question_status, "generating");
    assert.ok(created.generation_token);

    const { data: nullStatus, error: nullStatusError } = await a.client.rpc(
      "finish_conversation_question",
      { p_question_id: questionId, p_generation_token: created.generation_token, p_status: null },
    );
    assert.ifError(nullStatusError);
    assert.equal(nullStatus, false);

    const duplicate = await claim(a.client, questionId, question);
    assert.equal(duplicate.claimed, false);
    assert.equal(duplicate.conversation_id, created.conversation_id);
    assert.equal(duplicate.generation_token, null);

    const { data: conversation, error: conversationError } = await a.client
      .from("conversations")
      .select("id, owner_id, last_question_at, expires_at")
      .eq("id", created.conversation_id)
      .single();
    assert.ifError(conversationError);
    assert.equal(conversation.owner_id, a.userId);
    const lifetime = new Date(conversation.expires_at).getTime() - new Date(conversation.last_question_at).getTime();
    assert.ok(Math.abs(lifetime - 30 * 24 * 60 * 60 * 1000) < 5000);
    const { data: readAgain, error: readAgainError } = await a.client
      .from("conversations")
      .select("expires_at")
      .eq("id", created.conversation_id)
      .single();
    assert.ifError(readAgainError);
    assert.equal(readAgain.expires_at, conversation.expires_at);

    await t.test("un membre et un responsable ne lisent pas les conversations du membre A", async () => {
      for (const client of [b.client, manager.client]) {
        const { data: rows, error } = await client
          .from("conversations")
          .select("id")
          .eq("id", created.conversation_id);
        assert.ifError(error);
        assert.deepEqual(rows, []);

        const { data: messages, error: messageError } = await client
          .from("messages")
          .select("id")
          .eq("id", questionId);
        assert.ifError(messageError);
        assert.deepEqual(messages, []);
      }

      const { error: forgedDates } = await a.client
        .from("conversations")
        .update({ expires_at: "2099-01-01T00:00:00Z" })
        .eq("id", created.conversation_id);
      assert.ok(forgedDates, "un membre ne peut pas modifier la date d'expiration");
    });

    await t.test("une reprise réutilise la même question et une seule finalisation gagne", async () => {
      const { data: failed, error: failError } = await a.client.rpc("finish_conversation_question", {
        p_question_id: questionId,
        p_generation_token: created.generation_token,
        p_status: "failed",
      });
      assert.ifError(failError);
      assert.equal(failed, true);

      const retry = await claim(a.client, questionId, question);
      assert.equal(retry.claimed, true);
      assert.equal(retry.conversation_id, created.conversation_id);
      assert.ok(retry.generation_token);
      assert.notEqual(retry.generation_token, created.generation_token);

      const { data: staleFinish, error: staleFinishError } = await a.client.rpc(
        "finish_conversation_question",
        {
          p_question_id: questionId,
          p_generation_token: created.generation_token,
          p_status: "failed",
        },
      );
      assert.ifError(staleFinishError);
      assert.equal(staleFinish, false);

      const { data: staleAnswer, error: staleAnswerError } = await a.client.rpc(
        "finalize_conversation_answer",
        {
          p_question_id: questionId,
          p_generation_token: created.generation_token,
          p_answer: "Réponse obsolète.",
          p_sources: [],
        },
      );
      assert.ifError(staleAnswerError);
      assert.equal(staleAnswer, false);

      const finalize = () =>
        a.client.rpc("finalize_conversation_answer", {
          p_question_id: questionId,
          p_generation_token: retry.generation_token,
          p_answer: "Réponse test enregistrée.",
          p_sources: [{
            resourceId: resource.id,
            chunkId: chunks.id,
            revision: resource.revision,
          }],
        });
      const results = await Promise.all([finalize(), finalize()]);
      for (const result of results) {
        assert.ifError(result.error);
      }
      assert.deepEqual(results.map((result) => result.data).sort(), [false, true]);

      const { data: answers, error: answerError } = await a.client
        .from("messages")
        .select("id, content")
        .eq("question_id", questionId);
      assert.ifError(answerError);
      assert.equal(answers.length, 1);
      assert.equal(answers[0].content, "Réponse test enregistrée.");

      const { data: sources, error: sourcesError } = await a.client
        .from("message_sources")
        .select("resource_id, chunk_id, resource_revision")
        .eq("answer_message_id", answers[0].id);
      assert.ifError(sourcesError);
      assert.deepEqual(sources, [{
        resource_id: resource.id,
        chunk_id: chunks.id,
        resource_revision: resource.revision,
      }]);

      for (const client of [b.client, manager.client]) {
        const { data: hiddenSources, error: hiddenSourcesError } = await client
          .from("message_sources")
          .select("id")
          .eq("answer_message_id", answers[0].id);
        assert.ifError(hiddenSourcesError);
        assert.deepEqual(hiddenSources, []);
      }

      // Une nouvelle révision rend les anciennes sources indisponibles (4.11).
      {
        const { data: newRevision, error: revisionError } = await a.client.rpc("begin_resource_revision", {
          p_resource_id: resource.id,
          p_title: "S8 source modifiee",
          p_body: "Nouveau contenu de ressource.",
          p_category_id: categoryId,
        });
        assert.ifError(revisionError);
        assert.equal(newRevision, resource.revision + 1);

        const { data: currentResource, error: currentResourceError } = await a.client
          .from("resources")
          .select("id, title, revision")
          .eq("id", resource.id)
          .single();
        assert.ifError(currentResourceError);
        assert.equal(currentResource.title, "S8 source modifiee");
        assert.equal(currentResource.revision, newRevision);

        const { data: oldChunks, error: oldChunksError } = await a.client
          .from("resource_chunks")
          .select("id")
          .eq("id", chunks.id);
        assert.ifError(oldChunksError);
        assert.deepEqual(oldChunks, []);

        const { data: staleSources, error: staleError } = await a.client
          .from("message_sources")
          .select("resource_id, chunk_id, resource_revision")
          .eq("answer_message_id", answers[0].id);
        assert.ifError(staleError);
        assert.deepEqual(staleSources, [{
          resource_id: resource.id,
          chunk_id: null,
          resource_revision: resource.revision,
        }]);
      }

      const { error: deleteResourceError } = await a.client
        .from("resources")
        .delete()
        .eq("id", resource.id);
      assert.ifError(deleteResourceError);

      const { data: detachedSources, error: detachedError } = await a.client
        .from("message_sources")
        .select("resource_id, chunk_id, resource_revision")
        .eq("answer_message_id", answers[0].id);
      assert.ifError(detachedError);
      assert.deepEqual(detachedSources, [{
        resource_id: null,
        chunk_id: null,
        resource_revision: resource.revision,
      }]);

      const { data: retainedAnswer, error: retainedAnswerError } = await a.client
        .from("messages")
        .select("id")
        .eq("id", answers[0].id)
        .single();
      assert.ifError(retainedAnswerError);
      assert.equal(retainedAnswer.id, answers[0].id);
    });

    const managerClaim = await claim(manager.client, managerQuestionId, `${question} responsable`);
    assert.equal(managerClaim.claimed, true);
    const { data: managerFinished, error: managerFinishError } = await manager.client.rpc("finish_conversation_question", {
      p_question_id: managerQuestionId,
      p_generation_token: managerClaim.generation_token,
      p_status: "no-context",
    });
    assert.ifError(managerFinishError);
    assert.equal(managerFinished, true);
    const { data: managerRows, error: managerRowsError } = await manager.client
      .from("conversations")
      .select("id");
    assert.ifError(managerRowsError);
    assert.ok(managerRows.some((row) => row.id === managerClaim.conversation_id));
    assert.ok(!managerRows.some((row) => row.id === created.conversation_id));
  },
);

test(
  "suppression : propriétaire seulement, cascade des enfants et préservation des ressources",
  { skip: deletionSkipReason || continuationSkipReason || false },
  async (t) => {
    const anonymous = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    const { error: anonymousError } = await anonymous.rpc("delete_owned_conversation", {
      p_conversation_id: randomUUID(),
    });
    assert.ok(anonymousError, "Le rôle anonyme ne doit pas pouvoir exécuter la suppression.");
    const owner = await login(accounts.memberA);
    const otherMember = await login(accounts.memberB);
    const manager = await login(accounts.manager);
    const resourceQuestionId = randomUUID();
    const pendingQuestionId = randomUUID();
    const otherConversationQuestionId = randomUUID();
    const question = `S8 suppression ${Date.now()}`;
    const conversationIds = new Set();
    let resourceId;
    let categoryCreatedId;

    t.after(async () => {
      for (const id of conversationIds) {
        const { error } = await owner.client.rpc("delete_owned_conversation", {
          p_conversation_id: id,
        });
        assert.ifError(error);
      }
      if (resourceId) {
        const { error } = await owner.client.from("resources").delete().eq("id", resourceId);
        assert.ifError(error);
      }
      if (categoryCreatedId) {
        const { error } = await manager.client.from("categories").delete().eq("id", categoryCreatedId);
        assert.ifError(error);
      }
    });

    const { data: profile, error: profileError } = await owner.client
      .from("profiles")
      .select("workspace_id")
      .eq("id", owner.userId)
      .single();
    assert.ifError(profileError);

    const { data: existingCategory, error: categoryError } = await owner.client
      .from("categories")
      .select("id")
      .eq("workspace_id", profile.workspace_id)
      .limit(1)
      .maybeSingle();
    assert.ifError(categoryError);
    let categoryId = existingCategory?.id;
    if (!categoryId) {
      const { data: createdCategory, error: createCategoryError } = await manager.client
        .from("categories")
        .insert({ workspace_id: profile.workspace_id, name: `S8 suppression ${Date.now()}` })
        .select("id")
        .single();
      assert.ifError(createCategoryError);
      categoryId = createdCategory.id;
      categoryCreatedId = createdCategory.id;
    }

    const { data: resource, error: resourceError } = await owner.client
      .from("resources")
      .insert({
        workspace_id: profile.workspace_id,
        category_id: categoryId,
        owner_id: owner.userId,
        title: `S8 suppression source ${Date.now()}`,
        body: "Contenu source de test.",
      })
      .select("id, revision")
      .single();
    assert.ifError(resourceError);
    resourceId = resource.id;

    const sourceEmbedding = Array(1536).fill(0);
    sourceEmbedding[1535] = 1;
    const { data: published, error: publishError } = await owner.client.rpc("publish_resource_chunks", {
      p_resource_id: resource.id,
      p_revision: resource.revision,
      p_chunks: [{
        content: "Contenu du passage à préserver.",
        embedding: sourceEmbedding,
      }],
    });
    assert.ifError(publishError);
    assert.equal(published, true);
    const { data: chunks, error: chunksError } = await owner.client
      .from("resource_chunks")
      .select("id")
      .eq("resource_id", resource.id)
      .single();
    assert.ifError(chunksError);

    const initial = await claim(owner.client, resourceQuestionId, question);
    assert.equal(initial.claimed, true);
    conversationIds.add(initial.conversation_id);
    const { data: finalized, error: finalizeError } = await owner.client.rpc(
      "finalize_conversation_answer",
      {
        p_question_id: resourceQuestionId,
        p_generation_token: initial.generation_token,
        p_answer: "Réponse avec une source.",
        p_sources: [{
          resourceId: resource.id,
          chunkId: chunks.id,
          revision: resource.revision,
        }],
      },
    );
    assert.ifError(finalizeError);
    assert.equal(finalized, true);

    const pending = await claimInConversation(
      owner.client,
      initial.conversation_id,
      pendingQuestionId,
      "Question encore en génération",
    );
    assert.equal(pending.claimed, true);

    const otherConversation = await claim(
      owner.client,
      otherConversationQuestionId,
      "Conversation indépendante",
    );
    assert.equal(otherConversation.claimed, true);
    conversationIds.add(otherConversation.conversation_id);
    const { data: otherFinished, error: otherFinishError } = await owner.client.rpc(
      "finish_conversation_question",
      {
        p_question_id: otherConversationQuestionId,
        p_generation_token: otherConversation.generation_token,
        p_status: "no-context",
      },
    );
    assert.ifError(otherFinishError);
    assert.equal(otherFinished, true);

    for (const client of [otherMember.client, manager.client]) {
      const { data: denied, error } = await client.rpc("delete_owned_conversation", {
        p_conversation_id: initial.conversation_id,
      });
      assert.ifError(error);
      assert.equal(denied, false);
    }

    const { error: directDeleteError } = await owner.client
      .from("conversations")
      .delete()
      .eq("id", initial.conversation_id);
    assert.ok(directDeleteError, "La suppression directe ne doit pas être autorisée.");

    const { data: stillPresent, error: stillPresentError } = await owner.client
      .from("conversations")
      .select("id")
      .eq("id", initial.conversation_id)
      .single();
    assert.ifError(stillPresentError);
    assert.equal(stillPresent.id, initial.conversation_id);

    const { data: answers, error: answersError } = await owner.client
      .from("messages")
      .select("id")
      .eq("question_id", resourceQuestionId)
      .single();
    assert.ifError(answersError);
    const { data: sources, error: sourcesError } = await owner.client
      .from("message_sources")
      .select("id")
      .eq("answer_message_id", answers.id)
      .single();
    assert.ifError(sourcesError);

    const { data: deleted, error: deleteError } = await owner.client.rpc(
      "delete_owned_conversation",
      { p_conversation_id: initial.conversation_id },
    );
    assert.ifError(deleteError);
    assert.equal(deleted, true);
    conversationIds.delete(initial.conversation_id);

    const { data: lateAnswer, error: lateAnswerError } = await owner.client.rpc(
      "finalize_conversation_answer",
      {
        p_question_id: pendingQuestionId,
        p_generation_token: pending.generation_token,
        p_answer: "Réponse tardive.",
        p_sources: [],
      },
    );
    assert.ifError(lateAnswerError);
    assert.equal(lateAnswer, false);
    const { data: lateFinish, error: lateFinishError } = await owner.client.rpc(
      "finish_conversation_question",
      {
        p_question_id: pendingQuestionId,
        p_generation_token: pending.generation_token,
        p_status: "failed",
      },
    );
    assert.ifError(lateFinishError);
    assert.equal(lateFinish, false);

    const { data: deletedConversation, error: deletedConversationError } = await owner.client
      .from("conversations")
      .select("id")
      .eq("id", initial.conversation_id);
    assert.ifError(deletedConversationError);
    assert.deepEqual(deletedConversation, []);
    const { data: deletedMessages, error: deletedMessagesError } = await owner.client
      .from("messages")
      .select("id")
      .eq("conversation_id", initial.conversation_id);
    assert.ifError(deletedMessagesError);
    assert.deepEqual(deletedMessages, []);
    const { data: deletedSources, error: deletedSourcesError } = await owner.client
      .from("message_sources")
      .select("id")
      .eq("id", sources.id);
    assert.ifError(deletedSourcesError);
    assert.deepEqual(deletedSources, []);

    const { data: preservedResource, error: preservedResourceError } = await owner.client
      .from("resources")
      .select("id")
      .eq("id", resource.id)
      .single();
    assert.ifError(preservedResourceError);
    assert.equal(preservedResource.id, resource.id);
    const { data: preservedChunk, error: preservedChunkError } = await owner.client
      .from("resource_chunks")
      .select("id")
      .eq("id", chunks.id)
      .single();
    assert.ifError(preservedChunkError);
    assert.equal(preservedChunk.id, chunks.id);

    const { data: preservedConversation, error: preservedConversationError } = await owner.client
      .from("conversations")
      .select("id")
      .eq("id", otherConversation.conversation_id)
      .single();
    assert.ifError(preservedConversationError);
    assert.equal(preservedConversation.id, otherConversation.conversation_id);
    const { data: preservedMessage, error: preservedMessageError } = await owner.client
      .from("messages")
      .select("id")
      .eq("id", otherConversationQuestionId)
      .single();
    assert.ifError(preservedMessageError);
    assert.equal(preservedMessage.id, otherConversationQuestionId);

    const { data: missingDeletion, error: missingDeletionError } = await owner.client.rpc(
      "delete_owned_conversation",
      { p_conversation_id: initial.conversation_id },
    );
    assert.ifError(missingDeletionError);
    assert.equal(missingDeletion, false);
  },
);
