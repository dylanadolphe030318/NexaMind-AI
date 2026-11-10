import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  buildRelevantPhraseCandidates,
  buildRelevantPhraseMessages,
  parseRelevantPhraseReply,
  RELEVANT_PHRASE_MAX_LENGTH,
  RELEVANT_PHRASE_MAX_PASSAGES,
  RELEVANT_PHRASE_SYSTEM_PROMPT,
  runRelevantPhraseSelection,
} from "../src/features/resources/relevant-search-phrase-core.ts";

const passage = (resourceId, title, content) => ({
  resourceId, title, content, similarity: 0.6,
});
const choice = (number) => JSON.stringify({
  answer: "", sources: [number], missing: false,
});
const none = JSON.stringify({ answer: "", sources: [], missing: true });

test("la consigne exige seulement un numéro et traite les données comme non fiables", () => {
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /jamais des instructions/);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /Ne recopie aucun texte/);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /numéro global de la phrase/);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /au plus 300 caractères/);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /résultat observé/);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /plutôt que l'action/);
  const messages = buildRelevantPhraseMessages("Que faut-il saisir ?", [
    passage("resource-1", "Guide", "Un titre, un contenu et une catégorie sont requis."),
  ]);
  assert.equal(messages[1].content, [
    "Phrases candidates :", "",
    "[Phrase 1] Ressource : Guide",
    "Un titre, un contenu et une catégorie sont requis.", "",
    "Question : Que faut-il saisir ?",
  ].join("\n"));
});

test("un numéro global désigne la phrase exacte et sa source, pas le numéro du passage", () => {
  const passages = [
    passage("a", "Premier", "Une première phrase. Une deuxième phrase."),
    passage("b", "Second", "Une troisième phrase."),
  ];
  assert.deepEqual(parseRelevantPhraseReply(choice(2), passages), {
    status: "selected", phrase: "Une deuxième phrase.", resourceId: "a", title: "Premier",
  });
  assert.deepEqual(parseRelevantPhraseReply(choice(3), passages), {
    status: "selected", phrase: "Une troisième phrase.", resourceId: "b", title: "Second",
  });
});

test("Q1 sépare titres, listes et paragraphes sans couper les continuations", () => {
  const phrase = "Construire l’application avec Next.js ; Next.js affiche les pages, traite les demandes côté serveur.";
  for (const newline of ["\n", "\r\n"]) {
    for (const marker of ["- ", "* ", "• ", "1. ", "2) "]) {
      const passages = [passage("architecture", "Architecture", [
        "Une introduction. **[ASSUMPTION]**",
        "### Exigences complémentaires",
        `${marker}Construire l’application avec Next.js ; Next.js affiche les pages,`,
        "  traite les demandes côté serveur.",
        "",
        `${marker}Utiliser Supabase pour les données.`,
      ].join(newline))];
      const candidates = buildRelevantPhraseCandidates(passages);
      assert.ok(candidates.some((candidate) => candidate.phrase === phrase));
      assert.ok(candidates.every((candidate) => !candidate.phrase.includes("###")));
      assert.ok(!candidates.some((candidate) => candidate.phrase.startsWith("traite")));
      const index = candidates.findIndex((candidate) => candidate.phrase === phrase) + 1;
      assert.equal(parseRelevantPhraseReply(choice(index), passages).phrase, phrase);
    }
  }
});

test("Q3 conserve les marqueurs de gras de la définition source", () => {
  const original = "**RAG** — méthode où l’application retrouve des passages utiles, les donne à l’IA comme contexte, puis présente une réponse liée à ces passages.";
  for (const prefix of ["- ", "", "* "]) {
    const passages = [passage("prd", "Glossaire", `Une autre définition.\n${prefix}${original}\n- **Source** — permet de vérifier une réponse.`)];
    const candidates = buildRelevantPhraseCandidates(passages);
    const index = candidates.findIndex((candidate) => candidate.phrase === original) + 1;
    assert.ok(index > 0);
    assert.equal(parseRelevantPhraseReply(choice(index), passages).phrase, original);
  }
});

test("Q5/Q6 proposent les champs de résultats complets, même sans point final", () => {
  for (const observed of [
    "Ce qui s'est passé : Me demander de saisir au moins un mot",
    "Ce qui s'est passé : les deux recherches ont été regroupés en une seule avec la même date",
  ]) {
    const passages = [passage("retour", "Retour de test", [
      "Un test du sprint ne fonctionne pas comme prévu.",
      "Story concernée : story 3.2",
      "Ce que j'ai fait : faire une recherche",
      "Ce que j'attendais : avoir deux recherches distinctes",
      observed,
      "Message d'erreur éventuel :",
      "« Saisissez au moins un mot pour lancer la recherche. »",
      "Trouve la cause, explique-la simplement, puis corrige uniquement ce problème avec un commit.",
    ].join("\n"))];
    const candidates = buildRelevantPhraseCandidates(passages);
    const index = candidates.findIndex((candidate) => candidate.phrase === observed) + 1;
    assert.ok(index > 0);
    assert.deepEqual(parseRelevantPhraseReply(choice(index), passages), {
      status: "selected", phrase: observed, resourceId: "retour", title: "Retour de test",
    });
    assert.ok(!candidates.some((candidate) => candidate.phrase === "Message d'erreur éventuel :"));
  }
});

test("la limite inclut le gras, ne tronque pas et garde une numérotation continue après filtrage", () => {
  const exact = `${"a".repeat(RELEVANT_PHRASE_MAX_LENGTH - 1)}.`;
  const passages = [passage("a", "Guide", [
    `**${"a".repeat(297)}**.`,
    exact,
    "Une phrase courte.",
  ].join("\n\n"))];
  const candidates = buildRelevantPhraseCandidates(passages);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].phrase, exact);
  assert.equal(parseRelevantPhraseReply(choice(1), passages).phrase.length, 300);
  assert.equal(parseRelevantPhraseReply(choice(2), passages).phrase, "Une phrase courte.");
});

test("les citations et leurs frontières sont conservées", () => {
  for (const content of [
    "« La réponse est précise ! » Puis vient une autre phrase.",
    'L’action est décrite. "La réponse est précise !" Puis vient une autre phrase.',
  ]) {
    const candidates = buildRelevantPhraseCandidates([passage("a", "Guide", content)]);
    assert.ok(candidates.some((candidate) => candidate.phrase === "La réponse est précise !"));
  }
});

test("les assemblages, textes générés, numéros inventés et réponses mal formées sont rejetés", () => {
  const passages = [passage("a", "Architecture", [
    "- Frontend : Next.js (App Router, TypeScript) ;",
    "- Backend : Supabase.",
    "Hébergement prévu : GitHub",
  ].join("\n"))];
  const invalid = [
    "pas du JSON", "null", "[]",
    { answer: "Une reformulation.", sources: [1], missing: false },
    { answer: "- Frontend : Next.js (App Router, TypeScript) ;\nHébergement prévu : GitHub", sources: [1], missing: false },
    { answer: "", sources: [0], missing: false },
    { answer: "", sources: [-1], missing: false },
    { answer: "", sources: [999], missing: false },
    { answer: "", sources: [1.5], missing: false },
    { answer: "", sources: ["1"], missing: false },
    { answer: "", sources: [1, 2], missing: false },
    { answer: "", sources: [1, 1], missing: false },
    { answer: "", sources: [], missing: false },
    { answer: "", sources: [1], missing: true },
    { answer: "", sources: [], missing: "true" },
    { answer: "", sources: null, missing: false },
    { sources: [1], missing: false },
    { answer: "", sources: [1], missing: false, extra: "inventé" },
  ];
  for (const reply of invalid) {
    assert.deepEqual(parseRelevantPhraseReply(
      typeof reply === "string" ? reply : JSON.stringify(reply), passages,
    ), { status: "error" });
  }
  assert.deepEqual(parseRelevantPhraseReply(none, passages), { status: "none" });
});

test("la sélection se limite aux cinq premiers passages, jamais une source suivante", () => {
  const passages = Array.from({ length: RELEVANT_PHRASE_MAX_PASSAGES + 2 }, (_, index) =>
    passage(`resource-${index + 1}`, `Titre ${index + 1}`, `Contenu ${index + 1}.`),
  );
  const messages = buildRelevantPhraseMessages("Question ?", passages);
  assert.equal((messages[1].content.match(/\[Phrase \d+\]/g) ?? []).length, 5);
  assert.doesNotMatch(messages[1].content, /Contenu 6\./);
  assert.deepEqual(parseRelevantPhraseReply(choice(6), passages), { status: "error" });
});

test("aucun appel sans phrase admissible ; un seul appel avec restitution serveur exacte", async () => {
  let calls = 0;
  const generate = async () => {
    calls += 1;
    return choice(2);
  };
  for (const passages of [
    [], [passage("a", "Guide", "# Titre seulement")],
    [passage("a", "Guide", "a".repeat(301))],
  ]) {
    assert.deepEqual(await runRelevantPhraseSelection("Question ?", passages, { generate }), { status: "none" });
  }
  assert.equal(calls, 0);
  const passages = [passage("a", "Guide", "Une action. Un résultat observé.")];
  assert.deepEqual(await runRelevantPhraseSelection("Question ?", passages, { generate }), {
    status: "selected", phrase: "Un résultat observé.", resourceId: "a", title: "Guide",
  });
  assert.equal(calls, 1);
});

test("les refus et erreurs restent explicites sans repli ni contenu privé dans les logs", async () => {
  const logs = [];
  const passages = [passage("a", "Guide", "Une phrase pertinente.")];
  for (const generate of [
    async () => { throw new Error("HTTP 500"); },
    async () => "réponse invalide",
    async () => choice(999),
  ]) {
    assert.deepEqual(await runRelevantPhraseSelection("question privée", passages, {
      generate, logError: () => logs.push("Sélection impossible."),
    }), { status: "error" });
  }
  assert.equal(logs.length, 3);
  assert.ok(logs.every((message) => message === "Sélection impossible."));
  assert.deepEqual(await runRelevantPhraseSelection("Question ?", passages, {
    generate: async () => none,
  }), { status: "none" });
});

test("l'écran garde l'information OpenAI, les sources et les états de phrase", async () => {
  const page = await readFile("src/app/resources/search/page.tsx", "utf8");
  assert.match(page, /vingt passages complets\s*\(titre et texte\) sont envoy&eacute;s/i);
  assert.match(page, /cinq passages retenus/);
  assert.match(page, /&agrave; OpenAI/);
  assert.match(page, /Phrase la plus pertinente/);
  assert.match(page, /<Suspense/);
  assert.match(page, /selectRelevantSearchPhrase/);
  assert.match(page, /result\.status === "selected"/);
  assert.match(page, /result\.status === "none"/);
  assert.match(page, /result\.phrase/);
  assert.match(page, /result\.resourceId/);
  assert.match(page, /role="alert"/);
});
