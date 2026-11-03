import assert from "node:assert/strict";
import test from "node:test";

import {
  createResourceIndexer,
  indexResourceWithEmbeddings,
} from "../src/features/resources/indexing-core.ts";

const EMBEDDING_DIMENSIONS = 1536;
const fakeEmbedding = (value = 0.25) => Array(EMBEDDING_DIMENSIONS).fill(value);

function fakeSupabase(responses = []) {
  const calls = [];
  return {
    calls,
    async rpc(functionName, args) {
      calls.push({ functionName, args });
      return responses.shift() ?? { data: true, error: null };
    },
  };
}

test("calcule un embedding par passage et publie les vecteurs en une seule fois", async () => {
  const supabase = fakeSupabase();
  const texts = [];
  const success = await indexResourceWithEmbeddings(
    supabase,
    "resource-id",
    3,
    "Premier passage. Deuxième passage.",
    async (input) => {
      texts.push(input);
      return input.map((_, index) => fakeEmbedding(index));
    },
  );

  assert.equal(success.success, true);
  assert.equal(texts.length, 1);
  assert.equal(supabase.calls.length, 1);
  assert.equal(supabase.calls[0].functionName, "publish_resource_chunks");
  assert.equal(supabase.calls[0].args.p_revision, 3);
  assert.equal(supabase.calls[0].args.p_chunks.length, texts[0].length);
  assert.ok(
    supabase.calls[0].args.p_chunks.every(
      (chunk) => chunk.embedding.length === EMBEDDING_DIMENSIONS,
    ),
  );
});

test("l'adaptateur transmet le fournisseur configuré au flux d'indexation", async () => {
  const supabase = fakeSupabase();
  const generateEmbeddings = async (input) => input.map(() => fakeEmbedding(0.75));
  const indexResource = createResourceIndexer(generateEmbeddings);

  const success = await indexResource(
    supabase,
    "resource-id",
    7,
    "Passage autorisé.",
  );

  assert.equal(success.success, true);
  assert.equal(supabase.calls[0].functionName, "publish_resource_chunks");
  assert.equal(supabase.calls[0].args.p_chunks[0].embedding[0], 0.75);
});

test("une erreur fournisseur marque la révision en échec sans publier", async () => {
  const supabase = fakeSupabase();
  const success = await indexResourceWithEmbeddings(
    supabase,
    "resource-id",
    4,
    "Texte fictif.",
    async () => {
      throw new Error("provider unavailable");
    },
  );

  assert.equal(success.success, false);
  assert.match(success.message, /fournisseur/);
  assert.equal(supabase.calls.length, 1);
  assert.equal(supabase.calls[0].functionName, "mark_resource_failed");
  assert.equal(supabase.calls[0].args.p_revision, 4);
});

test("refuse les vecteurs incomplets et marque la révision en échec", async () => {
  const supabase = fakeSupabase();
  const success = await indexResourceWithEmbeddings(
    supabase,
    "resource-id",
    5,
    "Texte fictif.",
    async () => [[1, 2]],
  );

  assert.equal(success.success, false);
  assert.deepEqual(
    supabase.calls.map((call) => call.functionName),
    ["mark_resource_failed"],
  );
});

test("une révision périmée refusée par PostgreSQL n'est pas publiée", async () => {
  const supabase = fakeSupabase([
    { data: false, error: null },
    { data: false, error: null },
  ]);
  const success = await indexResourceWithEmbeddings(
    supabase,
    "resource-id",
    6,
    "Texte fictif.",
    async (input) => input.map(() => fakeEmbedding()),
  );

  assert.equal(success.success, false);
  assert.deepEqual(
    supabase.calls.map((call) => call.functionName),
    ["publish_resource_chunks", "mark_resource_failed"],
  );
});
