import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const accounts = {
  memberA: [process.env.RLS_TEST_MEMBER_A_EMAIL, process.env.RLS_TEST_MEMBER_A_PASSWORD],
  memberB: [process.env.RLS_TEST_MEMBER_B_EMAIL, process.env.RLS_TEST_MEMBER_B_PASSWORD],
  manager: [process.env.RLS_TEST_MANAGER_EMAIL, process.env.RLS_TEST_MANAGER_PASSWORD],
};

if (!supabaseUrl || !publishableKey || Object.values(accounts).flat().some((v) => !v)) {
  throw new Error("Variables manquantes pour les tests d'indexation.");
}
if (publishableKey.startsWith("sb_secret_")) {
  throw new Error("Les tests refusent toute clé Supabase privilégiée.");
}

async function login([email, password]) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  return { client, userId: data.user.id };
}

const PREFIX = "RLS-TEST-IDX-";

test("indexation : passages, révisions et droits (RLS active, sans clé de service)", async (t) => {
  const a = await login(accounts.memberA);
  const b = await login(accounts.memberB);
  const manager = await login(accounts.manager);
  const createdIds = [];

  try {
    const { data: profile, error: profileError } = await a.client
      .from("profiles")
      .select("workspace_id")
      .eq("id", a.userId)
      .single();
    assert.ifError(profileError);
    const { data: category, error: categoryError } = await a.client
      .from("categories")
      .select("id")
      .limit(1)
      .single();
    assert.ifError(categoryError);

    const { data: resource, error: insertError } = await a.client
      .from("resources")
      .insert({
        workspace_id: profile.workspace_id,
        category_id: category.id,
        owner_id: a.userId,
        title: `${PREFIX}${Date.now()}`,
        body: "Premier texte de test pour les passages.",
      })
      .select("id, revision, indexing_status")
      .single();
    assert.ifError(insertError);
    createdIds.push(resource.id);

    await t.test("une nouvelle ressource démarre en préparation, révision 1", () => {
      assert.equal(resource.revision, 1);
      assert.equal(resource.indexing_status, "processing");
    });

    await t.test("le propriétaire publie les passages de la révision courante", async () => {
      const { data, error } = await a.client.rpc("publish_resource_chunks", {
        p_resource_id: resource.id,
        p_revision: 1,
        p_chunks: [{ content: "Passage un" }, { content: "Passage deux" }],
      });
      assert.ifError(error);
      assert.equal(data, true);

      const { data: chunks } = await a.client
        .from("resource_chunks")
        .select("position, content")
        .eq("resource_id", resource.id)
        .order("position");
      assert.deepEqual(chunks, [
        { position: 0, content: "Passage un" },
        { position: 1, content: "Passage deux" },
      ]);
    });

    await t.test("un autre membre du même espace lit les passages mais ne peut pas écrire", async () => {
      const { data: chunks } = await b.client
        .from("resource_chunks")
        .select("id")
        .eq("resource_id", resource.id);
      assert.equal(chunks.length, 2);

      const { data: published } = await b.client.rpc("publish_resource_chunks", {
        p_resource_id: resource.id,
        p_revision: 1,
        p_chunks: [{ content: "Intrus" }],
      });
      assert.equal(published, false);

      const { error: directInsert } = await b.client
        .from("resource_chunks")
        .insert({ resource_id: resource.id, revision: 1, position: 9, content: "Intrus" });
      assert.ok(directInsert, "l'écriture directe doit être refusée");

      const { data: revision } = await b.client.rpc("begin_resource_revision", {
        p_resource_id: resource.id,
        p_title: "Piraté",
        p_body: "Piraté",
        p_category_id: category.id,
      });
      assert.equal(revision, null);
    });

    await t.test("une révision périmée est refusée et les anciens passages sont retirés", async () => {
      const { data: revision, error } = await a.client.rpc("begin_resource_revision", {
        p_resource_id: resource.id,
        p_title: `${PREFIX}${Date.now()}`,
        p_body: "Second texte de test.",
        p_category_id: category.id,
      });
      assert.ifError(error);
      assert.equal(revision, 2);

      const { data: remaining } = await a.client
        .from("resource_chunks")
        .select("id")
        .eq("resource_id", resource.id);
      assert.equal(remaining.length, 0);

      const { data: stale } = await a.client.rpc("publish_resource_chunks", {
        p_resource_id: resource.id,
        p_revision: 1,
        p_chunks: [{ content: "Ancien" }],
      });
      assert.equal(stale, false);
    });

    await t.test("le responsable peut publier et marquer en échec", async () => {
      const { data: published } = await manager.client.rpc("publish_resource_chunks", {
        p_resource_id: resource.id,
        p_revision: 2,
        p_chunks: [{ content: "Passage du responsable" }],
      });
      assert.equal(published, true);

      const { data: failed } = await manager.client.rpc("mark_resource_failed", {
        p_resource_id: resource.id,
        p_revision: 2,
      });
      assert.equal(failed, true);
    });

    await t.test("supprimer la ressource supprime ses passages", async () => {
      const { data: deleted, error } = await a.client
        .from("resources")
        .delete()
        .eq("id", resource.id)
        .select("id");
      assert.ifError(error);
      assert.equal(deleted.length, 1);
      createdIds.splice(createdIds.indexOf(resource.id), 1);

      const { data: chunks } = await a.client
        .from("resource_chunks")
        .select("id")
        .eq("resource_id", resource.id);
      assert.equal(chunks.length, 0);
    });
  } finally {
    for (const id of createdIds) {
      await a.client.from("resources").delete().eq("id", id);
    }
  }
});
