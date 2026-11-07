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

function nearAxis(similarity) {
  const vector = Array(DIMENSIONS).fill(0);
  vector[0] = similarity;
  vector[1] = Math.sqrt(1 - similarity ** 2);
  return vector;
}

function nearAxisAt(index, similarity) {
  const vector = Array(DIMENSIONS).fill(0);
  vector[index] = similarity;
  vector[index + 1] = Math.sqrt(1 - similarity ** 2);
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
  const hybridSearch = (session, vector, queryText, limit = 5, minSimilarity = 0.3) =>
    session.client.rpc("search_resource_chunks_hybrid", {
      p_query_embedding: literal(vector),
      p_query_text: queryText,
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

    async function createResource(label, axisIndex, publish = true, content = `Passage ${label}`) {
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
          p_chunks: [{
            content,
            embedding: Array.isArray(axisIndex) ? axisIndex : axis(axisIndex),
          }],
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
      assert.equal(hit.revision, ready.revision);
      const { data: chunk, error: chunkError } = await a.client
        .from("resource_chunks")
        .select("id")
        .eq("resource_id", ready.id)
        .single();
      assert.ifError(chunkError);
      assert.equal(hit.chunk_id, chunk.id);
      const { data: hybridHits, error: hybridError } = await hybridSearch(a, axis(0), "prete");
      assert.ifError(hybridError);
      const hybridHit = hybridHits.find((row) => row.resource_id === ready.id);
      assert.ok(hybridHit);
      assert.equal(hybridHit.chunk_id, chunk.id);
      assert.equal(hybridHit.revision, ready.revision);

      const { data: far, error: farError } = await search(a, axis(1));
      assert.ifError(farError);
      assert.equal(far.some((row) => row.resource_id === ready.id), false);
    });

    await t.test("la recherche de ressources accepte le seuil 0,20 dans la fenêtre hybride 0,20", async () => {
      let queryAxisIndex = -1;
      for (let index = DIMENSIONS - 2; index >= DIMENSIONS - 40; index -= 1) {
        const { data, error } = await hybridSearch(a, axis(index), "termeabsenttest", 5, 0);
        assert.ifError(error);
        if (data.every((row) => row.similarity < 0.2)) {
          queryAxisIndex = index;
          break;
        }
      }
      assert.notEqual(queryAxisIndex, -1, "un axe de test sans passages vectoriellement proches est disponible");

      const anchor = await createResource(
        "window-anchor",
        nearAxisAt(queryAxisIndex, 0.39),
        true,
        "Passage témoin pour la fenêtre sémantique.",
      );
      const lowerThresholdHit = await createResource(
        "window-low-threshold",
        nearAxisAt(queryAxisIndex, 0.25),
        true,
        "Passage attendu sous le seuil historique.",
      );
      const belowNewThreshold = await createResource(
        "window-below-threshold",
        nearAxisAt(queryAxisIndex, 0.19),
        true,
        "Passage toujours sous le nouveau seuil.",
      );
      const { data, error } = await hybridSearch(
        a,
        axis(queryAxisIndex),
        "termeabsenttest",
        5,
        0.2,
      );
      assert.ifError(error);
      assert.ok(data.length <= 5);
      assert.ok(data.some((row) => row.resource_id === anchor.id));
      assert.ok(
        data.some((row) => row.resource_id === lowerThresholdHit.id),
        "un passage à 0,25 reste candidat sous le seuil et dans la fenêtre de 0,20",
      );
      assert.equal(
        data.some((row) => row.resource_id === belowNewThreshold.id),
        false,
        "le nouveau seuil brut de 0,20 continue d'écarter les passages plus faibles",
      );
    });

    await t.test("le texte exact départage les passages proches sans dépasser cinq résultats", async () => {
      const distractor = await createResource(
        "hybrid-distractor",
        0,
        true,
        "La story 3.2 revient sur le test où la recherche était vide.",
      );
      const relevant = await createResource(
        "hybrid-relevant",
        nearAxis(0.95),
        true,
        "La story 3.1 précise ce qui s'est passé quand la recherche était vide.",
      );
      const farIdentifierMatch = await createResource(
        "hybrid-far-identifier",
        nearAxis(0.5),
        true,
        "La story 3.1 précise ce qui s'est passé quand la recherche était vide.",
      );
      const query = "Lors du test de la story 3.1, que s'est-il passé quand la recherche était vide ?";
      const { data, error } = await hybridSearch(a, axis(0), query, 100, 0.4);
      assert.ifError(error);
      assert.ok(data.length <= 5);
      const relevantIndex = data.findIndex((row) => row.resource_id === relevant.id);
      const distractorIndex = data.findIndex((row) => row.resource_id === distractor.id);
      assert.ok(relevantIndex >= 0, "le passage avec les termes exacts doit être retrouvé");
      assert.ok(distractorIndex >= 0, "le distracteur proche doit être retrouvé");
      assert.ok(relevantIndex < distractorIndex, "le passage textuellement pertinent passe devant");
      assert.ok(data[relevantIndex].similarity < data[distractorIndex].similarity);
      assert.equal(
        data.some((row) => row.resource_id === farIdentifierMatch.id),
        false,
        "un numéro exact ne fait pas remonter un passage éloigné sémantiquement",
      );

      const belowThresholdIdentifier = await createResource(
        "hybrid-below-threshold",
        nearAxis(0.39),
        true,
        "La story 3.1 précise ce qui s'est passé quand la recherche était vide.",
      );
      const { data: thresholdResults, error: thresholdError } = await hybridSearch(
        a,
        axis(0),
        query,
        5,
        0.4,
      );
      assert.ifError(thresholdError);
      assert.equal(
        thresholdResults.some((row) => row.resource_id === belowThresholdIdentifier.id),
        false,
        "un numéro exact ne fait pas remonter un passage sous le seuil",
      );

      const { data: memberBResults, error: memberBError } = await hybridSearch(b, axis(0), query);
      assert.ifError(memberBError);
      assert.ok(
        memberBResults.some((row) => row.resource_id === relevant.id),
        "la recherche hybride respecte la session authentifiée du membre",
      );

      const anonymous = await hybridSearch({ client: newClient() }, axis(0), query);
      assert.ok(anonymous.error, "un visiteur sans session ne peut pas appeler le classement hybride");
      assert.equal(anonymous.data, null);
    });

    await t.test("sans numéro, le signal lexical départage les passages proches sous RLS", async () => {
      const distractor = await createResource(
        "hybrid-lexical-distractor",
        nearAxis(0.97),
        true,
        "Les règles de publication décrivent le calendrier des mises à jour.",
      );
      const relevant = await createResource(
        "hybrid-lexical-relevant",
        nearAxis(0.95),
        true,
        "Le diagnostic explique pourquoi la recherche affiche zéro passage après l'indexation.",
      );
      const query = "Quel diagnostic explique la recherche après indexation ?";
      const { data, error } = await hybridSearch(a, axis(0), query, 5, 0.4);
      assert.ifError(error);

      const relevantIndex = data.findIndex((row) => row.resource_id === relevant.id);
      const distractorIndex = data.findIndex((row) => row.resource_id === distractor.id);
      assert.ok(relevantIndex >= 0, "le passage lexicalement pertinent doit être retrouvé");
      assert.ok(distractorIndex >= 0, "le distracteur vectoriel doit être retrouvé");
      assert.ok(relevantIndex < distractorIndex, "le signal lexical départage le distracteur plus proche");
      assert.ok(data[relevantIndex].similarity < data[distractorIndex].similarity);
    });

    await t.test("un autre membre du même espace retrouve les passages de ressources prêtes", async () => {
      const { data, error } = await search(b, axis(0));
      assert.ifError(error);
      assert.ok(data.some((row) => row.resource_id === ready.id));
    });

    await t.test("le classement hybride plafonne à cinq même si le RPC en demande davantage", async () => {
      for (let i = 1; i <= 6; i += 1) {
        await createResource(`hybrid-limit${i}`, 0);
      }
      const { data, error } = await hybridSearch(a, axis(0), "termeabsent", 100, -1);
      assert.ifError(error);
      assert.equal(data.length, 5);
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

      const { data: hybridData, error: hybridError } = await hybridSearch(a, axis(30), "en préparation", 5, -1);
      assert.ifError(hybridError);
      assert.equal(hybridData.some((row) => row.resource_id === notReady.id), false);
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
