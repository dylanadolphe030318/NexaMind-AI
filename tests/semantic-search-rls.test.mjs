import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const accounts = {
  memberA: [process.env.RLS_TEST_MEMBER_A_EMAIL, process.env.RLS_TEST_MEMBER_A_PASSWORD],
  memberB: [process.env.RLS_TEST_MEMBER_B_EMAIL, process.env.RLS_TEST_MEMBER_B_PASSWORD],
};

if (!supabaseUrl || !publishableKey || Object.values(accounts).flat().some((v) => !v)) {
  throw new Error("Variables manquantes pour les tests de recherche sémantique.");
}
if (publishableKey.startsWith("sb_secret_")) {
  throw new Error("Les tests refusent toute clé Supabase privilégiée.");
}

const PREFIX = "RLS-TEST-SEM-";
const DIMENSIONS = 1536;

function newClient() {
  return createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

async function login([email, password]) {
  const client = newClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  return { client, userId: data.user.id };
}

// Vecteur unitaire : deux axes différents ont une proximité cosinus de 0.
function axis(index) {
  const vector = Array(DIMENSIONS).fill(0);
  vector[index] = 1;
  return vector;
}

function literal(vector) {
  return `[${vector.join(",")}]`;
}

test("recherche sémantique : proximité, limite et droits (RLS active, sans clé de service)", async (t) => {
  const a = await login(accounts.memberA);
  const b = await login(accounts.memberB);
  const createdIds = [];

  const search = (session, vector, limit = 5, minSimilarity = 0.3) =>
    session.client.rpc("search_resource_chunks", {
      p_query_embedding: literal(vector),
      p_limit: limit,
      p_min_similarity: minSimilarity,
    });

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

    async function createResource(label, axisIndex, publish = true) {
      const { data, error } = await a.client
        .from("resources")
        .insert({
          workspace_id: profile.workspace_id,
          category_id: category.id,
          owner_id: a.userId,
          title: `${PREFIX}${label}-${Date.now()}`,
          body: `Texte de test ${label}.`,
        })
        .select("id, revision")
        .single();
      assert.ifError(error);
      createdIds.push(data.id);
      if (publish) {
        const { data: ok, error: publishError } = await a.client.rpc("publish_resource_chunks", {
          p_resource_id: data.id,
          p_revision: data.revision,
          p_chunks: [{ content: `Passage ${label}`, embedding: axis(axisIndex) }],
        });
        assert.ifError(publishError);
        assert.equal(ok, true);
      }
      return data;
    }

    const ready = await createResource("prete", 0);

    await t.test("un passage proche est retrouvé, un passage hors sujet ne l'est pas", async () => {
      const { data: near, error } = await search(a, axis(0));
      assert.ifError(error);
      const hit = near.find((row) => row.resource_id === ready.id);
      assert.ok(hit, "le passage proche doit être retrouvé");
      assert.equal(hit.content, "Passage prete");
      assert.ok(hit.similarity > 0.99);

      const { data: far, error: farError } = await search(a, axis(1));
      assert.ifError(farError);
      assert.equal(far.some((row) => row.resource_id === ready.id), false);
    });

    await t.test("jamais plus de 5 résultats, même si on en demande davantage", async () => {
      for (let i = 1; i <= 6; i += 1) {
        await createResource(`lot${i}`, 10 + i);
      }
      const { data, error } = await search(a, axis(10), 100, -1);
      assert.ifError(error);
      assert.equal(data.length, 5);
    });

    await t.test("une ressource en préparation ou en échec n'est pas retrouvée", async () => {
      const notReady = await createResource("enpreparation", 30, false);
      const { data: chunks } = await a.client
        .from("resource_chunks")
        .select("id")
        .eq("resource_id", notReady.id);
      assert.equal(chunks.length, 0);

      const { data, error } = await search(a, axis(30), 5, -1);
      assert.ifError(error);
      assert.equal(data.some((row) => row.resource_id === notReady.id), false);
    });

    await t.test("un autre membre du même espace retrouve les passages de ressources prêtes", async () => {
      const { data, error } = await search(b, axis(0));
      assert.ifError(error);
      assert.ok(data.some((row) => row.resource_id === ready.id));
    });

    await t.test("un visiteur sans session ne peut pas lancer la recherche", async () => {
      const { data, error } = await search({ client: newClient() }, axis(0));
      assert.ok(error, "l'appel anonyme doit être refusé");
      assert.equal(data, null);
    });

    await t.test("une ressource supprimée n'est plus retrouvée", async () => {
      const { data: deleted, error } = await a.client
        .from("resources")
        .delete()
        .eq("id", ready.id)
        .select("id");
      assert.ifError(error);
      assert.equal(deleted.length, 1);
      createdIds.splice(createdIds.indexOf(ready.id), 1);

      const { data } = await search(a, axis(0));
      assert.equal(data.some((row) => row.resource_id === ready.id), false);
    });
  } finally {
    for (const id of createdIds) {
      await a.client.from("resources").delete().eq("id", id);
    }
  }
});

test("limite de recherches : refus au-delà du plafond, compteur propre à chaque membre", async () => {
  const b = await login(accounts.memberB);
  const a = await login(accounts.memberA);
  const consume = (session, max) =>
    session.client.rpc("consume_semantic_search_quota", { p_max_per_minute: max });

  try {
    await b.client.from("semantic_search_calls").delete().eq("user_id", b.userId);
    await a.client.from("semantic_search_calls").delete().eq("user_id", a.userId);

    for (let i = 0; i < 3; i += 1) {
      const { data, error } = await consume(b, 3);
      assert.ifError(error);
      assert.equal(data, true);
    }
    const { data: refused, error } = await consume(b, 3);
    assert.ifError(error);
    assert.equal(refused, false);

    const { data: other } = await consume(a, 3);
    assert.equal(other, true, "la limite d'un membre ne bloque pas les autres");

    const { data: seen } = await a.client.from("semantic_search_calls").select("user_id");
    assert.ok(seen.every((row) => row.user_id === a.userId), "un membre ne voit que ses propres appels");

    const anonymous = await newClient().rpc("consume_semantic_search_quota", { p_max_per_minute: 3 });
    assert.ok(anonymous.error, "un visiteur sans session est refusé");
  } finally {
    await b.client.from("semantic_search_calls").delete().eq("user_id", b.userId);
    await a.client.from("semantic_search_calls").delete().eq("user_id", a.userId);
  }
});
