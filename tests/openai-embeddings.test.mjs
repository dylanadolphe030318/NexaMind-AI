import assert from "node:assert/strict";
import test from "node:test";

import {
  createOpenAIEmbeddings,
  EMBEDDING_DIMENSIONS,
  OPENAI_EMBEDDING_MODEL,
} from "../src/lib/ai/openai-embeddings-client.ts";

test("envoie les passages en un lot et restitue les embeddings dans l'ordre", async () => {
  let requestUrl;
  let requestOptions;
  const input = ["Premier passage", "Deuxième passage"];
  const result = await createOpenAIEmbeddings(input, "fake-key", async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return new Response(
      JSON.stringify({
        data: [
          { index: 1, embedding: Array(EMBEDDING_DIMENSIONS).fill(0.2) },
          { index: 0, embedding: Array(EMBEDDING_DIMENSIONS).fill(0.1) },
        ],
      }),
      { status: 200 },
    );
  });

  assert.equal(requestUrl, "https://api.openai.com/v1/embeddings");
  assert.equal(requestOptions.method, "POST");
  assert.equal(requestOptions.headers.Authorization, "Bearer fake-key");
  assert.ok(requestOptions.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(requestOptions.body), {
    model: OPENAI_EMBEDDING_MODEL,
    input,
    dimensions: EMBEDDING_DIMENSIONS,
    encoding_format: "float",
  });
  assert.equal(result.length, 2);
  assert.equal(result[0][0], 0.1);
  assert.equal(result[1][0], 0.2);
});

test("signale une clé absente sans effectuer de requête", async () => {
  let requested = false;
  await assert.rejects(
    createOpenAIEmbeddings(["Texte"], "", async () => {
      requested = true;
      return new Response();
    }),
    /OPENAI_API_KEY/,
  );
  assert.equal(requested, false);
});

test("retourne une erreur explicite sur une erreur HTTP sans exposer la réponse", async () => {
  await assert.rejects(
    createOpenAIEmbeddings(["Texte"], "fake-key", async () =>
      new Response("sensitive provider details", { status: 429 }),
    ),
    (error) => {
      assert.match(error.message, /HTTP 429/);
      assert.doesNotMatch(error.message, /sensitive provider details/);
      return true;
    },
  );
});

test("refuse une réponse avec des dimensions invalides", async () => {
  await assert.rejects(
    createOpenAIEmbeddings(["Texte"], "fake-key", async () =>
      new Response(
        JSON.stringify({ data: [{ index: 0, embedding: [0.1, 0.2] }] }),
        { status: 200 },
      ),
    ),
    /embedding invalide/,
  );
});
