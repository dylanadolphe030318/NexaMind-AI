import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSISTANT_SYSTEM_PROMPT,
  buildAssistantMessages,
  parseAssistantReply,
  runAssistant,
} from "../src/features/assistant/assistant-core.ts";
import {
  CHAT_MAX_OUTPUT_TOKENS,
  createOpenAIChatCompletion,
} from "../src/lib/ai/openai-chat-client.ts";

const passage = { resourceId: "r1", title: "Archi", content: "Next.js et Supabase", similarity: 0.6 };
const okSearch = { status: "ok", passages: [passage] };

test("la consigne impose passages, sources et je ne sais pas", () => {
  assert.match(ASSISTANT_SYSTEM_PROMPT, /UNIQUEMENT/);
  assert.match(ASSISTANT_SYSTEM_PROMPT, /sources/);
  assert.match(ASSISTANT_SYSTEM_PROMPT, /Je ne sais pas/);
  const messages = buildAssistantMessages("Q ?", [passage]);
  assert.match(messages[1].content, /\[Passage 1\]/);
});

test("une réponse avec un numéro de passage inconnu est refusée", () => {
  assert.throws(() => parseAssistantReply('{"answer":"a","sources":[2],"missing":false}', 1));
  assert.throws(() => parseAssistantReply("pas du json", 1));
});

test("aucun appel au modèle sans passage", async () => {
  let called = false;
  const outcome = await runAssistant("Q ?", {
    retrieve: async () => ({ status: "ok", passages: [] }),
    generate: async () => {
      called = true;
      return "";
    },
  });
  assert.equal(outcome.status, "no-context");
  assert.equal(called, false);
});

test("réponse normale, je ne sais pas, quota et session", async () => {
  const generate = async () => '{"answer":"Next.js","sources":[1],"missing":false}';
  assert.deepEqual(await runAssistant("Q ?", { retrieve: async () => okSearch, generate }), {
    status: "ok",
    answer: "Next.js",
  });
  const missing = async () => '{"answer":"Je ne sais pas.","sources":[],"missing":true}';
  assert.equal((await runAssistant("Q ?", { retrieve: async () => okSearch, generate: missing })).status, "unknown");
  assert.equal(
    (await runAssistant("Q ?", { retrieve: async () => ({ status: "rate-limited" }), generate })).status,
    "rate-limited",
  );
  assert.equal(await runAssistant("Q ?", { retrieve: async () => null, generate }), null);
  assert.equal((await runAssistant("  ", { retrieve: async () => okSearch, generate })).status, "invalid");
});

test("une erreur du modèle donne error sans journaliser la question", async () => {
  const logs = [];
  const outcome = await runAssistant("question secrète", {
    retrieve: async () => okSearch,
    generate: async () => {
      throw new Error("HTTP 500");
    },
    logError: (m) => logs.push(m),
  });
  assert.equal(outcome.status, "error");
  assert.ok(!logs.join().includes("secrète"));
});

test("le client envoie la limite de tokens et un délai, et ne divulgue pas la clé", async () => {
  let body;
  let signal;
  const content = await createOpenAIChatCompletion(
    [{ role: "user", content: "x" }],
    "sk-secret",
    "m",
    async (_url, init) => {
      body = JSON.parse(init.body);
      signal = init.signal;
      return { ok: true, json: async () => ({ choices: [{ finish_reason: "stop", message: { content: "{}" } }] }) };
    },
  );
  assert.equal(content, "{}");
  assert.equal(body.max_completion_tokens, CHAT_MAX_OUTPUT_TOKENS);
  assert.ok(signal);
  await assert.rejects(
    createOpenAIChatCompletion([], "sk-secret", "m", async () => ({ ok: false, status: 401 })),
    (e) => !e.message.includes("sk-secret"),
  );
  await assert.rejects(
    createOpenAIChatCompletion([], "k", "m", async () => ({
      ok: true,
      json: async () => ({ choices: [{ finish_reason: "length", message: { content: "{" } }] }),
    })),
  );
});
