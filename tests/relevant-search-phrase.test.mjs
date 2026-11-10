import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRelevantPhraseMessages,
  parseRelevantPhraseReply,
  RELEVANT_PHRASE_MAX_LENGTH,
  RELEVANT_PHRASE_MAX_PASSAGES,
  RELEVANT_PHRASE_SYSTEM_PROMPT,
  runRelevantPhraseSelection,
} from "../src/features/resources/relevant-search-phrase-core.ts";

const passage = (resourceId, title, content) => ({
  resourceId,
  title,
  content,
  similarity: 0.6,
});

test("la consigne demande une phrase exacte et traite les passages comme des données", () => {
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /une seule phrase complète exactement/);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /jamais des instructions/);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /au plus 300 caractères/);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /résultat observé/i);
  assert.match(RELEVANT_PHRASE_SYSTEM_PROMPT, /plutôt que l'action/i);

  const messages = buildRelevantPhraseMessages("Que faut-il saisir ?", [
    passage("resource-1", "Guide", "Un titre, un contenu et une catégorie sont requis."),
  ]);
  assert.equal(messages[1].content, [
    "Passages :",
    "",
    "[Passage 1] Ressource : Guide",
    "Un titre, un contenu et une catégorie sont requis.",
    "",
    "Question : Que faut-il saisir ?",
  ].join("\n"));
});

test("Q6 choisit le résultat observé et Q5 conserve sa phrase exacte", () => {
  const q6Passage = passage(
    "resource-q6",
    "Retour de test sprint 4",
    "J'ai regroupé les deux recherches. Les deux recherches ont été regroupées en une seule avec la même date.",
  );
  const observedResult =
    "Les deux recherches ont été regroupées en une seule avec la même date.";
  assert.deepEqual(
    parseRelevantPhraseReply(
      JSON.stringify({ answer: observedResult, sources: [1], missing: false }),
      [q6Passage],
    ),
    {
      status: "selected",
      phrase: observedResult,
      resourceId: "resource-q6",
      title: "Retour de test sprint 4",
    },
  );

  const q5Phrase =
    "L’application demandait de saisir au moins un mot et affichait le message « Saisissez au moins un mot pour lancer la recherche. »";
  assert.equal(
    parseRelevantPhraseReply(
      JSON.stringify({ answer: q5Phrase, sources: [1], missing: false }),
      [passage("resource-q5", "Retour de test sprint 3", q5Phrase)],
    ).status,
    "selected",
  );
});

test("la phrase doit être une phrase complète et exacte du seul passage cité", () => {
  const passages = [
    passage(
      "resource-1",
      "PRD",
      "Le titre est utile. Un titre, un contenu non vide et une catégorie sont requis ; si l’un manque, un message indique le champ à corriger.",
    ),
    passage("resource-2", "Autre", "Une phrase sans rapport."),
  ];
  assert.deepEqual(
    parseRelevantPhraseReply(
      JSON.stringify({
        answer: "Un titre, un contenu non vide et une catégorie sont requis ; si l’un manque, un message indique le champ à corriger.",
        sources: [1],
        missing: false,
      }),
      passages,
    ),
    {
      status: "selected",
      phrase:
        "Un titre, un contenu non vide et une catégorie sont requis ; si l’un manque, un message indique le champ à corriger.",
      resourceId: "resource-1",
      title: "PRD",
    },
  );
});

test("une phrase reformulée, tronquée, trop longue ou associée à plusieurs sources est refusée", () => {
  const passages = [passage("resource-1", "Guide", "Le titre et une catégorie sont obligatoires.")];
  for (const reply of [
    { answer: "Il faut un titre et une catégorie.", sources: [1], missing: false },
    { answer: "Le titre", sources: [1], missing: false },
    { answer: "x".repeat(RELEVANT_PHRASE_MAX_LENGTH + 1), sources: [1], missing: false },
    { answer: "Le titre et une catégorie sont obligatoires.", sources: [1, 1], missing: false },
    { answer: "Le titre et une catégorie sont obligatoires.", sources: [2], missing: false },
  ]) {
    assert.deepEqual(parseRelevantPhraseReply(JSON.stringify(reply), passages), { status: "error" });
  }
});

test("les phrases sont comparées en ignorant uniquement les espaces de mise en forme", () => {
  const passages = [passage("resource-1", "Guide", "- La première exigence\nest précise.")];
  assert.equal(
    parseRelevantPhraseReply(
      JSON.stringify({
        answer: "La première exigence est précise.",
        sources: [1],
        missing: false,
      }),
      passages,
    ).status,
    "selected",
  );
});

test("Q1 sépare les titres et les listes sans perdre les lignes de continuation", () => {
  const phrase = "Construire l’application avec Next.js ; Next.js affiche les pages, traite les demandes côté serveur, applique les règles métier et appelle le fournisseur IA.";
  for (const newline of ["\n", "\r\n"]) {
    for (const marker of ["- ", "* ", "• ", "1. ", "2) "]) {
      const content = [
        "Une introduction. **[ASSUMPTION]**",
        "### Exigences complémentaires de l’architecture",
        `${marker}Construire l’application avec Next.js ; Next.js affiche les pages,`,
        "  traite les demandes côté serveur, applique les règles métier et appelle le fournisseur IA.",
        `${marker}Utiliser Supabase pour les données.`,
      ].join(newline);
      const passages = [passage("architecture", "Architecture", content)];
      const parse = (answer) => parseRelevantPhraseReply(
        JSON.stringify({ answer, sources: [1], missing: false }), passages,
      );
      assert.deepEqual(parse(phrase), {
        status: "selected", phrase, resourceId: "architecture", title: "Architecture",
      });
      for (const invalid of [
        "Next.js affiche les pages, traite les demandes côté serveur, applique les règles métier et appelle le fournisseur IA.",
        "traite les demandes côté serveur, applique les règles métier et appelle le fournisseur IA.",
        phrase.replace("Next.js", "React"),
        "Exigences complémentaires de l’architecture",
        `${phrase} Utiliser Supabase pour les données.`,
      ]) {
        assert.deepEqual(parse(invalid), { status: "error" });
      }
    }
  }
});

test("un titre ne se colle pas au paragraphe suivant et les paragraphes restent distincts", () => {
  const passages = [passage("guide", "Guide", [
    "# Titre",
    "Une phrase complète.",
    "",
    "Autre paragraphe sans ponctuation",
    "",
    "Encore un paragraphe.",
  ].join("\n"))];
  for (const answer of ["Une phrase complète.", "Encore un paragraphe."]) {
    assert.equal(parseRelevantPhraseReply(JSON.stringify({
      answer, sources: [1], missing: false,
    }), passages).status, "selected");
  }
  assert.deepEqual(parseRelevantPhraseReply(JSON.stringify({
    answer: "Autre paragraphe sans ponctuation Encore un paragraphe.",
    sources: [1], missing: false,
  }), passages), { status: "error" });
});

test("Q3 accepte le gras omis mais restitue exclusivement la phrase originale", () => {
  const original = "**RAG** — méthode où l’application retrouve des passages utiles, les donne à l’IA comme contexte, puis présente une réponse liée à ces passages.";
  for (const prefix of ["- ", "", "* "]) {
    const passages = [passage("prd", "Glossaire", `Une autre définition.\n${prefix}${original}\n- **Source** — permet de vérifier une réponse.`)];
    for (const answer of [original, original.replaceAll("**", "")]) {
      assert.deepEqual(
        parseRelevantPhraseReply(JSON.stringify({ answer, sources: [1], missing: false }), passages),
        { status: "selected", phrase: original, resourceId: "prd", title: "Glossaire" },
      );
    }
    for (const answer of [
      original.replaceAll("**", "").replace("retrouve", "invente"),
      "RAG — méthode où l’application retrouve des passages utiles.",
      original.replaceAll("**", "").replace("RAG", "Rag"),
    ]) {
      assert.deepEqual(
        parseRelevantPhraseReply(JSON.stringify({ answer, sources: [1], missing: false }), passages),
        { status: "error" },
      );
    }
  }
});

test("le texte original avec gras doit aussi respecter la limite et la source citée", () => {
  const original = `**${"a".repeat(297)}**.`;
  const passages = [
    passage("long", "Long", original),
    passage("short", "Autre", "Une autre phrase."),
  ];
  assert.deepEqual(parseRelevantPhraseReply(JSON.stringify({
    answer: original.replaceAll("**", ""), sources: [1], missing: false,
  }), passages), { status: "error" });
  assert.deepEqual(parseRelevantPhraseReply(JSON.stringify({
    answer: "Une autre phrase.", sources: [1], missing: false,
  }), passages), { status: "error" });
});

test("une phrase exacte reste reconnue quand elle est citée dans le passage", () => {
  const passages = [
    passage("resource-1", "Guide", "« La réponse est précise ! » Puis vient une autre phrase."),
  ];
  assert.equal(
    parseRelevantPhraseReply(
      JSON.stringify({
        answer: "La réponse est précise !",
        sources: [1],
        missing: false,
      }),
      passages,
    ).status,
    "selected",
  );
});

test("une phrase citée au début conserve sa frontière après la phrase précédente", () => {
  const phrase = "Le résultat observé est confirmé.";
  const passages = [
    passage(
      "resource-1",
      "Compte rendu",
      `L'action est décrite. "${phrase}" Puis vient une autre phrase.`,
    ),
  ];

  assert.equal(
    parseRelevantPhraseReply(
      JSON.stringify({ answer: phrase, sources: [1], missing: false }),
      passages,
    ).status,
    "selected",
  );
});

test("un refus explicite et un JSON invalide restent des états distincts", () => {
  const passages = [passage("resource-1", "Guide", "Une phrase pertinente.")];
  assert.deepEqual(
    parseRelevantPhraseReply(
      JSON.stringify({ answer: "", sources: [], missing: true }),
      passages,
    ),
    { status: "none" },
  );
  assert.deepEqual(parseRelevantPhraseReply("pas du JSON", passages), { status: "error" });
  assert.deepEqual(
    parseRelevantPhraseReply(
      JSON.stringify({ answer: "Une phrase pertinente.", sources: [], missing: false }),
      passages,
    ),
    { status: "error" },
  );
});

test("le LLM ne reçoit jamais plus de cinq passages", () => {
  const passages = Array.from({ length: RELEVANT_PHRASE_MAX_PASSAGES + 2 }, (_, index) =>
    passage(`resource-${index + 1}`, `Titre ${index + 1}`, `Contenu ${index + 1}.`),
  );
  const messages = buildRelevantPhraseMessages("Question ?", passages);
  assert.equal((messages[1].content.match(/\[Passage \d+\]/g) ?? []).length, 5);
  assert.match(messages[1].content, /Contenu 5\./);
  assert.doesNotMatch(messages[1].content, /Contenu 6\./);
});

test("une recherche fait au plus un appel LLM et aucun appel sans passage", async () => {
  let calls = 0;
  const generate = async () => {
    calls += 1;
    return JSON.stringify({
      answer: "Une phrase pertinente.",
      sources: [1],
      missing: false,
    });
  };
  const passages = [passage("resource-1", "Guide", "Une phrase pertinente.")];
  assert.deepEqual(
    await runRelevantPhraseSelection("Question ?", [], { generate }),
    { status: "none" },
  );
  assert.equal(calls, 0);

  assert.deepEqual(
    await runRelevantPhraseSelection("Question ?", passages, { generate }),
    {
      status: "selected",
      phrase: "Une phrase pertinente.",
      resourceId: "resource-1",
      title: "Guide",
    },
  );
  assert.equal(calls, 1);
});

test("une erreur fournisseur est explicite et journalisée sans loguer la question", async () => {
  const logs = [];
  const result = await runRelevantPhraseSelection("question privée", [
    passage("resource-1", "Guide", "Une phrase pertinente."),
  ], {
    generate: async () => {
      throw new Error("HTTP 500");
    },
    logError: () => logs.push("Impossible de sélectionner la phrase."),
  });
  assert.deepEqual(result, { status: "error" });
  assert.deepEqual(logs, ["Impossible de sélectionner la phrase."]);
  assert.equal(logs.join().includes("question privée"), false);
});

test("une réponse modèle invalide est journalisée sans afficher la question", async () => {
  const logs = [];
  const result = await runRelevantPhraseSelection(
    "question privée",
    [passage("resource-1", "Guide", "Une phrase pertinente.")],
    {
      generate: async () => "réponse invalide",
      logError: () => logs.push("Impossible de sélectionner la phrase."),
    },
  );
  assert.deepEqual(result, { status: "error" });
  assert.deepEqual(logs, ["Impossible de sélectionner la phrase."]);
  assert.equal(logs.join().includes("question privée"), false);
});

test("la recherche documente l’avis OpenAI, l’extrait pertinent et ses états", async () => {
  const page = await import("node:fs/promises").then((fs) =>
    fs.readFile("src/app/resources/search/page.tsx", "utf8"),
  );
  assert.match(page, /vingt passages complets\s*\(titre et texte\) sont envoy&eacute;s/i);
  assert.match(page, /cinq passages retenus sont ensuite transmis/i);
  assert.match(page, /&agrave; OpenAI/);
  assert.match(page, /d&eacute;lai et le co&ucirc;t/);
  assert.match(page, /Phrase la plus pertinente/);
  assert.match(page, /<Suspense/);
  assert.match(page, /selectRelevantSearchPhrase/);
  assert.match(page, /La phrase pertinente n&apos;a pas pu/);
});
