import assert from "node:assert/strict";
import test from "node:test";

import {
  SEMANTIC_MIN_SIMILARITY,
  SEMANTIC_QUERY_MAX_LENGTH,
  SEMANTIC_RESULT_LIMIT,
  buildPassageExcerpt,
  formatVector,
  normalizeQuestion,
  runSemanticSearch,
} from "../src/features/resources/semantic-search-core.ts";

const row = (id, similarity) => ({
  resource_id: id,
  title: `Titre ${id}`,
  content: `Passage ${id}`,
  similarity,
});

function deps(overrides = {}) {
  const calls = { embed: 0, search: [] };
  return {
    calls,
    embed: async () => {
      calls.embed += 1;
      return [[0.1, 0.2]];
    },
    search: async (...args) => {
      calls.search.push(args);
      return { data: [], error: null };
    },
    ...overrides,
  };
}

test("une question vide ou trop longue est refusée sans appel à OpenAI", async () => {
  for (const question of ["", "   ", "a".repeat(SEMANTIC_QUERY_MAX_LENGTH + 1)]) {
    const d = deps();
    assert.deepEqual(await runSemanticSearch(question, d), { status: "invalid" });
    assert.equal(d.calls.embed, 0);
  }
  assert.equal(normalizeQuestion("  bonjour  "), "bonjour");
});

test("la recherche envoie le vecteur, la limite et le seuil", async () => {
  const d = deps();
  await runSemanticSearch("Quelle technologie ?", d);
  assert.deepEqual(d.calls.search, [["[0.1,0.2]", SEMANTIC_RESULT_LIMIT, SEMANTIC_MIN_SIMILARITY]]);
  assert.equal(formatVector([1, 2, 3]), "[1,2,3]");
});

test("les passages sont triés, limités à 5 et filtrés par le seuil", async () => {
  const rows = [
    row("a", 0.4),
    row("b", 0.9),
    row("c", 0.1),
    row("d", 0.8),
    row("e", 0.7),
    row("f", 0.6),
    row("g", 0.5),
  ];
  const outcome = await runSemanticSearch("question", deps({ search: async () => ({ data: rows, error: null }) }));
  assert.equal(outcome.status, "ok");
  assert.deepEqual(
    outcome.passages.map((p) => p.resourceId),
    ["b", "d", "e", "f", "g"],
  );
});

test("aucun passage au-dessus du seuil donne une liste vide", async () => {
  const outcome = await runSemanticSearch(
    "question",
    deps({ search: async () => ({ data: [row("a", 0.05)], error: null }) }),
  );
  assert.deepEqual(outcome, { status: "ok", passages: [] });
});

test("l'extrait garde un texte court tel quel et coupe proprement un texte long", () => {
  assert.equal(buildPassageExcerpt("  Un   texte\ncourt. "), "Un texte court.");

  const long = Array.from({ length: 80 }, (_, i) => `mot${i}`).join(" ");
  const excerpt = buildPassageExcerpt(long);
  assert.ok(excerpt.endsWith("\u2026"));
  assert.ok(excerpt.length <= 201);
  assert.ok(long.startsWith(excerpt.slice(0, -1)));
  assert.match(excerpt.slice(0, -1), /mot\d+$/, "ne coupe pas un mot en deux");
});

test("une erreur d'embedding ou de base donne un échec journalisé sans le texte de la question", async () => {
  const logs = [];
  const secretQuestion = "question confidentielle";
  const embedFails = await runSemanticSearch(
    secretQuestion,
    deps({
      embed: async () => {
        throw new Error("HTTP 500");
      },
      logError: (m) => logs.push(m),
    }),
  );
  const searchFails = await runSemanticSearch(
    secretQuestion,
    deps({ search: async () => ({ data: null, error: { message: "boom" } }), logError: (m) => logs.push(m) }),
  );
  assert.deepEqual(embedFails, { status: "error" });
  assert.deepEqual(searchFails, { status: "error" });
  assert.equal(logs.length, 2);
  assert.ok(logs.every((m) => !m.includes(secretQuestion)));
});
