import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ASSISTANT_SYSTEM_PROMPT,
  buildAssistantMessages,
  buildSources,
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
    sources: [{ resourceId: "r1", title: "Archi", excerpt: "Next.js et Supabase" }],
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

test("les sources sont dédoublonnées par ressource et ordonnées par pertinence", () => {
  const passages = [
    { resourceId: "a", title: "A", content: "un", similarity: 0.9 },
    { resourceId: "a", title: "A", content: "deux", similarity: 0.8 },
    { resourceId: "b", title: "B", content: "trois", similarity: 0.7 },
  ];
  const sources = buildSources([3, 2, 1], passages);
  assert.deepEqual(sources.map((s) => s.resourceId), ["a", "b"]);
});

test("une réponse sans source valide n'est pas présentée comme fiable", async () => {
  const outcome = await runAssistant("Q ?", {
    retrieve: async () => okSearch,
    generate: async () => '{"answer":"Une réponse","sources":[],"missing":false}',
  });
  assert.equal(outcome.status, "unknown");
});

test("un « Je ne sais pas » écrit dans le texte n'affiche pas de sources", async () => {
  const outcome = await runAssistant("Q ?", {
    retrieve: async () => okSearch,
    generate: async () => '{"answer":"Je ne sais pas.","sources":[1],"missing":false}',
  });
  assert.equal(outcome.status, "unknown");
});

test("le code de l'assistant utilise searchPassages et aucune clé privilégiée", () => {
  const assistant = readFileSync("src/features/assistant/assistant.ts", "utf8");
  assert.match(assistant, /import "server-only"/);
  assert.match(assistant, /retrieve: searchPassages/);
  for (const file of ["assistant.ts", "assistant-core.ts", "assistant-form.tsx"]) {
    assert.ok(!/service_role|SERVICE_ROLE/.test(readFileSync(`src/features/assistant/${file}`, "utf8")));
  }
  assert.ok(!/OPENAI_API_KEY/.test(readFileSync("src/features/assistant/assistant-form.tsx", "utf8")));
});

test("l'écran prévoit attente, absence de réponse, erreur avec réessai et quota", () => {
  const form = readFileSync("src/features/assistant/assistant-form.tsx", "utf8");
  for (const text of ["prépare sa réponse|pr&eacute;pare sa r&eacute;ponse", "Je ne trouve pas cette information", "Réessayer|R&eacute;essayer", "Trop de questions"]) {
    assert.match(form, new RegExp(text));
  }
  assert.match(form, /disabled=\{pending\}/);
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
