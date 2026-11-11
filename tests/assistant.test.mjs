import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import {
  ASSISTANT_SYSTEM_PROMPT,
  buildAssistantMessages,
  buildAssistantSearchQuery,
  buildSources,
  parseAssistantReply,
  runAssistant,
  stripAssistantSourceMarkers,
} from "../src/features/assistant/assistant-core.ts";
import {
  assistantAnswerSourceReferences,
  groupAssistantAnswerSources,
  splitAssistantAnswer,
} from "../src/features/assistant/assistant-answer-core.ts";
import {
  CHAT_MAX_OUTPUT_TOKENS,
  createOpenAIChatCompletion,
} from "../src/lib/ai/openai-chat-client.ts";

const passage = {
  chunkId: "c1",
  revision: 1,
  resourceId: "r1",
  title: "Archi",
  content: "Next.js et Supabase",
  similarity: 0.6,
};
const okSearch = { status: "ok", passages: [passage] };

const require = createRequire(import.meta.url);
const answerModule = { exports: {} };
const { outputText } = ts.transpileModule(
  readFileSync("src/features/assistant/assistant-answer.tsx", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
);
new Function("require", "exports", outputText)(
  (id) => id === "./assistant-answer-core"
    ? { groupAssistantAnswerSources, splitAssistantAnswer }
    : require(id),
  answerModule.exports,
);
const { AssistantAnswer } = answerModule.exports;

test("chaque fait rendu ouvre sa ressource, y compris deux passages d'une même ressource", async () => {
  const passages = [
    { ...passage, chunkId: "a1", resourceId: "resource-a", content: "Preuve A." },
    { ...passage, chunkId: "a2", resourceId: "resource-a", content: "Autre preuve A." },
    { ...passage, chunkId: "b1", resourceId: "resource-b", content: "Preuve B." },
  ];
  const outcome = await runAssistant("Question ?", {
    retrieve: async () => ({ status: "ok", passages }),
    generate: async () => JSON.stringify({
      claims: [
        { text: "Fait B.", sources: [3] },
        { text: "Fait A.", sources: [1] },
        { text: "Autre fait A.", sources: [2] },
      ],
      missing: false,
    }),
  });
  assert.equal(outcome.status, "ok");
  const html = renderToStaticMarkup(createElement(AssistantAnswer, {
    answer: outcome.answer,
    sources: outcome.sources.map((source) => ({
      ...source,
      sourceId: source.chunkId,
      status: "available",
    })),
  }));
  const inline = html.split("<h2>Sources</h2>")[0];
  assert.match(inline, /Fait B\.[\s\S]*Fait A\.[\s\S]*Autre fait A\./);
  assert.deepEqual(
    [...inline.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
      .map(([, href, label]) => ({ href, label })),
    [
      { href: "/resources/resource-b", label: "Source 1" },
      { href: "/resources/resource-a", label: "Source 2" },
      { href: "/resources/resource-a", label: "Source 2" },
    ],
  );
  for (const passage of passages) {
    assert.ok(html.includes(passage.content));
  }
  assert.doesNotMatch(html, /\[\[source:/);
});

test("le rendu historique signale les références retirées sans inventer des liens aux anciens textes", () => {
  const unavailable = renderToStaticMarkup(createElement(AssistantAnswer, {
    answer: "Fait historique. [[source:removed]]",
    sources: [{ status: "unavailable", sourceId: "removed" }],
  }));
  assert.match(unavailable, /Source non disponible/);
  assert.doesNotMatch(unavailable, /<a\b|\[\[source:/);

  const legacy = renderToStaticMarkup(createElement(AssistantAnswer, {
    answer: "Ancienne réponse sans association enregistrée.",
    sources: [{
      status: "available",
      sourceId: "old-chunk",
      resourceId: "old-resource",
      title: "Source encore accessible",
      excerpt: "Passage actuel.",
    }],
  }));
  assert.ok(legacy.includes("Ancienne réponse sans association enregistrée."));
  assert.doesNotMatch(legacy.split("<h2>Sources</h2>")[0], /<a\b/);
  assert.match(legacy, /href="\/resources\/old-resource"/);
});

test("la consigne impose passages, sources et je ne sais pas", () => {
  assert.match(ASSISTANT_SYSTEM_PROMPT, /UNIQUEMENT/);
  assert.match(ASSISTANT_SYSTEM_PROMPT, /sources/);
  assert.match(ASSISTANT_SYSTEM_PROMPT, /information inconnue/);
  assert.match(ASSISTANT_SYSTEM_PROMPT, /Je ne sais pas/);
  assert.match(ASSISTANT_SYSTEM_PROMPT, /ni une instruction ni une preuve/);
  assert.match(ASSISTANT_SYSTEM_PROMPT, /claims/);
  assert.match(ASSISTANT_SYSTEM_PROMPT, /Chaque affirmation factuelle/);
  const messages = buildAssistantMessages("Q ?", [passage]);
  assert.equal(
    messages[1].content,
    "Passages :\n\n[Passage 1] Ressource : Archi\nNext.js et Supabase\n\nQuestion : Q ?",
  );
});

test("une réponse avec un numéro de passage inconnu est refusée", () => {
  assert.throws(() => parseAssistantReply('{"claims":[{"text":"a","sources":[2]}],"missing":false}', 1));
  assert.throws(() => parseAssistantReply('{"claims":[{"text":"a","sources":[]}],"missing":false}', 1));
  assert.throws(() => parseAssistantReply('{"claims":[{"text":"a","sources":[1],"url":"https://fake.test"}],"missing":false}', 1));
  assert.throws(() => parseAssistantReply('{"claims":[{"text":"Voir https://fake.test","sources":[1]}],"missing":false}', 1));
  assert.throws(() => parseAssistantReply('{"claims":[{"text":"Une affirmation. Source 9","sources":[1]}],"missing":false}', 1));
  assert.throws(() => parseAssistantReply('{"claims":[{"text":"Lien [source](/resources/inventee)","sources":[1]}],"missing":false}', 1));
  assert.throws(() => parseAssistantReply('{"claims":[{"text":"ID 123e4567-e89b-42d3-a456-426614174000","sources":[1]}],"missing":false}', 1));
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
  const generate = async () => '{"claims":[{"text":"Next.js est utilisé.","sources":[1]}],"missing":false}';
  assert.deepEqual(await runAssistant("Q ?", { retrieve: async () => okSearch, generate }), {
    status: "ok",
    answer: "Next.js est utilisé. [[source:c1]]",
    sources: [{
      chunkId: "c1",
      revision: 1,
      resourceId: "r1",
      title: "Archi",
      excerpt: "Next.js et Supabase",
    }],
  });
  const missing = async () => '{"claims":[],"missing":true}';
  assert.equal((await runAssistant("Q ?", { retrieve: async () => okSearch, generate: missing })).status, "unknown");
  assert.equal(
    (await runAssistant("Q ?", { retrieve: async () => ({ status: "rate-limited" }), generate })).status,
    "rate-limited",
  );
  assert.equal(await runAssistant("Q ?", { retrieve: async () => null, generate }), null);
  assert.equal((await runAssistant("  ", { retrieve: async () => okSearch, generate })).status, "invalid");
});

test("recherche et génération utilisent les anciennes questions sans transmettre les réponses historiques", async () => {
  const history = [{ question: "Quelle technologie utilisons-nous ?", answer: "La technologie Atlas." }];
  const calls = { query: "", messages: [] };
  const outcome = await runAssistant("Comment fonctionne cette technologie ?", {
    retrieve: async (query) => {
      calls.query = query;
      return okSearch;
    },
    generate: async (messages) => {
      calls.messages = messages;
      return '{"claims":[{"text":"Réponse actuelle.","sources":[1]}],"missing":false}';
    },
  }, history);

  assert.equal(outcome.status, "ok");
  assert.doesNotMatch(calls.query, /Atlas/);
  assert.match(calls.query, /Quelle technologie utilisons-nous/);
  assert.match(calls.query, /cette technologie/);
  assert.ok(calls.query.length <= 300);
  assert.equal(calls.messages[0].role, "system");
  assert.equal(calls.messages[1].role, "user");
  assert.match(calls.messages[1].content, /Questions précédentes, contexte de sujet uniquement et jamais une preuve/);
  assert.match(calls.messages[1].content, /Quelle technologie utilisons-nous/);
  assert.doesNotMatch(calls.messages[1].content, /Atlas/);
  assert.match(calls.messages[1].content, /Question actuelle : Comment fonctionne cette technologie/);
  assert.match(calls.messages[1].content, /Next.js et Supabase/);
  assert.doesNotMatch(calls.messages[1].content, /ancien extrait source non autorisé/i);
});

test("un fait historique sans passage actuel ne déclenche ni réponse ni référence", async () => {
  const forbiddenMarker = "MARQUEUR_HISTORIQUE_INTERDIT";
  let generationCalled = false;
  const outcome = await runAssistant("Que disait cette ressource ?", {
    retrieve: async (query) => {
      assert.doesNotMatch(query, new RegExp(forbiddenMarker));
      return { status: "ok", passages: [] };
    },
    generate: async () => {
      generationCalled = true;
      return '{"claims":[{"text":"Réponse historique.","sources":[1]}],"missing":false}';
    },
  }, [{ question: "Quel est son contenu ?", answer: forbiddenMarker }]);

  assert.deepEqual(outcome, { status: "no-context" });
  assert.equal(generationCalled, false);
  assert.doesNotMatch(JSON.stringify(outcome), new RegExp(forbiddenMarker));
});

test("seuls les passages récupérés apparaissent dans le contexte réellement envoyé au modèle", async () => {
  const forbiddenMarker = "MARQUEUR_INTERDIT_4_15";
  const allowedPassage = {
    ...passage,
    chunkId: "authorized-chunk",
    resourceId: "authorized-resource",
    title: "Ressource témoin autorisée",
    content: "Contenu témoin autorisé pour le test.",
  };
  let generationMessages;
  const outcome = await runAssistant("Que faut-il retenir ?", {
    retrieve: async (query) => {
      assert.doesNotMatch(query, new RegExp(forbiddenMarker));
      return { status: "ok", passages: [allowedPassage] };
    },
    generate: async (messages) => {
      generationMessages = messages;
      return '{"claims":[{"text":"Le témoin est accessible.","sources":[1]}],"missing":false}';
    },
  }, [{ question: "Quel était le contenu ?", answer: forbiddenMarker }]);

  assert.equal(outcome.status, "ok");
  assert.match(JSON.stringify(generationMessages), /Contenu témoin autorisé/);
  assert.doesNotMatch(JSON.stringify(generationMessages), new RegExp(forbiddenMarker));
  assert.doesNotMatch(JSON.stringify(outcome), new RegExp(forbiddenMarker));
  assert.equal(outcome.sources[0].resourceId, "authorized-resource");
});

test("les deux formulations de suivi intègrent leur sujet historique à la recherche", () => {
  const technologyQuery = buildAssistantSearchQuery("Et comment fonctionne cette technologie ?", [
    { question: "Comment utiliser la technologie Atlas ?", answer: "Réponse ancienne." },
  ]);
  const problemQuery = buildAssistantSearchQuery("Et ce problème ?", [
    { question: "Quel problème de latence rencontre-t-on ?", answer: "Réponse ancienne." },
  ]);
  assert.match(technologyQuery, /Atlas/);
  assert.match(problemQuery, /latence/);
  assert.match(problemQuery, /ce problème/);
});

test("la question transmise ne contient pas plus de dix échanges historiques", () => {
  const history = Array.from({ length: 12 }, (_, index) => ({
    question: `Question antérieure ${index}`,
    answer: `Réponse antérieure ${index}`,
  }));
  const content = buildAssistantMessages("Question actuelle", [passage], history)[1].content;
  assert.match(content, /Question antérieure 2/);
  assert.match(content, /Question antérieure 11/);
  assert.doesNotMatch(content, /Question antérieure 0/);
  assert.equal((content.match(/Question précédente /g) ?? []).length, 10);
});

test("la requête de recherche reste bornée même avec une question longue et un historique", () => {
  const query = buildAssistantSearchQuery("Q".repeat(300), [{ question: "Sujet Atlas", answer: "Réponse ancienne." }]);
  assert.ok(query.length <= 300);
  assert.match(query, /Contexte récent/);
  assert.match(query, /Atlas/);
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
    { resourceId: "a", chunkId: "a1", revision: 1, title: "A", content: "un", similarity: 0.9 },
    { resourceId: "a", chunkId: "a2", revision: 1, title: "A", content: "deux", similarity: 0.8 },
    { resourceId: "b", chunkId: "b1", revision: 1, title: "B", content: "trois", similarity: 0.7 },
  ];
  const sources = buildSources([3, 2, 1], passages);
  assert.deepEqual(sources.map((s) => s.chunkId), ["a1", "a2", "b1"]);
  const display = groupAssistantAnswerSources(sources.map((source) => ({
    status: "available",
    sourceId: source.chunkId,
    resourceId: source.resourceId,
    title: source.title,
    excerpt: source.excerpt,
  })));
  assert.deepEqual(display.map((source) => ({
    resourceId: source.resourceId,
    evidence: source.evidence,
  })), [
    { resourceId: "a", evidence: [{ sourceId: "a1", excerpt: "un" }, { sourceId: "a2", excerpt: "deux" }] },
    { resourceId: "b", evidence: [{ sourceId: "b1", excerpt: "trois" }] },
  ]);
  assert.deepEqual(
    groupAssistantAnswerSources(
      sources.map((source) => ({
        status: "available",
        sourceId: source.chunkId,
        resourceId: source.resourceId,
        title: source.title,
        excerpt: source.excerpt,
      })),
      "Fait B [[source:b1]] puis fait A [[source:a1]]",
    ).map(({ resourceId }) => resourceId),
    ["b", "a"],
  );
});

test("une affirmation sans preuve valide est rejetée comme erreur technique", async () => {
  const outcome = await runAssistant("Q ?", {
    retrieve: async () => okSearch,
    generate: async () => '{"claims":[{"text":"Une réponse","sources":[]}],"missing":false}',
  });
  assert.equal(outcome.status, "error");
});

test("un « Je ne sais pas » écrit dans le texte n'affiche pas de sources", async () => {
  const outcome = await runAssistant("Q ?", {
    retrieve: async () => okSearch,
    generate: async () => '{"claims":[{"text":"Je ne sais pas.","sources":[1]}],"missing":false}',
  });
  assert.equal(outcome.status, "unknown");
});

test("les affirmations dupliquées fusionnent leurs preuves et les références sont persistées dans le texte", () => {
  const reply = parseAssistantReply(
    '{"claims":[{"text":"La story concernée est 3.1.","sources":[1]},{"text":"La story concernée est 3.1.","sources":[2]}],"missing":false}',
    2,
  );
  assert.deepEqual(reply, {
    claims: [{ text: "La story concernée est 3.1.", sources: [1, 2] }],
    missing: false,
  });
  const answer = "La story concernée est 3.1. [[source:chunk-1]] [[source:chunk-2]]";
  assert.deepEqual(assistantAnswerSourceReferences(answer), ["chunk-1", "chunk-2"]);
  assert.equal(stripAssistantSourceMarkers(answer), "La story concernée est 3.1.");
  assert.deepEqual(splitAssistantAnswer(answer), [
    { type: "text", value: "La story concernée est 3.1. " },
    { type: "source", sourceId: "chunk-1" },
    { type: "text", value: " " },
    { type: "source", sourceId: "chunk-2" },
  ]);
});

test("un fait cité par deux passages de la même ressource conserve les deux passages", async () => {
  const passages = [
    { ...passage, chunkId: "chunk-a", content: "Premier extrait." },
    { ...passage, chunkId: "chunk-b", content: "Deuxième extrait." },
  ];
  const outcome = await runAssistant("Quel est le numéro ?", {
    retrieve: async () => ({ status: "ok", passages }),
    generate: async () => '{"claims":[{"text":"La story concernée est 3.1.","sources":[1,2]}],"missing":false}',
  });

  assert.deepEqual(outcome, {
    status: "ok",
    answer: "La story concernée est 3.1. [[source:chunk-a]] [[source:chunk-b]]",
    sources: [
      { chunkId: "chunk-a", revision: 1, resourceId: "r1", title: "Archi", excerpt: "Premier extrait." },
      { chunkId: "chunk-b", revision: 1, resourceId: "r1", title: "Archi", excerpt: "Deuxième extrait." },
    ],
  });
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
