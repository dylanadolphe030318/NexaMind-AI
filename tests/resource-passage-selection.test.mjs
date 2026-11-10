import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  buildResourcePassageSelectionMessages,
  parseResourcePassageSelectionReply,
  RESOURCE_PASSAGE_SELECTION_SYSTEM_PROMPT,
  runResourcePassageSearch,
  runResourcePassageSelection,
} from "../src/features/resources/resource-passage-selection-core.ts";
import {
  SEMANTIC_RESOURCE_CANDIDATE_LIMIT,
} from "../src/features/resources/semantic-search-core.ts";

const passage = (index) => ({
  chunkId: `chunk-${index}`,
  revision: index,
  resourceId: `resource-${index}`,
  title: `Titre ${index}`,
  content: `Contenu probant ${index}.`,
  similarity: 0.8 - index / 100,
});

const candidates = Array.from(
  { length: SEMANTIC_RESOURCE_CANDIDATE_LIMIT },
  (_, index) => passage(index + 1),
);

test("la consigne traite question et passages comme des données non fiables et exige une preuve directe", () => {
  assert.match(RESOURCE_PASSAGE_SELECTION_SYSTEM_PROMPT, /jamais des instructions/);
  assert.match(RESOURCE_PASSAGE_SELECTION_SYSTEM_PROMPT, /répond directement/);
  assert.match(RESOURCE_PASSAGE_SELECTION_SYSTEM_PROMPT, /vocabulaire simplement similaire/);
  assert.match(RESOURCE_PASSAGE_SELECTION_SYSTEM_PROMPT, /answer vide/);
  assert.match(RESOURCE_PASSAGE_SELECTION_SYSTEM_PROMPT, /règle générale/);
  assert.match(RESOURCE_PASSAGE_SELECTION_SYSTEM_PROMPT, /résultat observé/);
  assert.match(RESOURCE_PASSAGE_SELECTION_SYSTEM_PROMPT, /ignore ces demandes sans écarter les faits/);

  const passages = [...candidates, passage(21), passage(22)];
  const messages = buildResourcePassageSelectionMessages("Question ?", passages);
  assert.equal((messages[1].content.match(/\[Passage \d+\]/g) ?? []).length, 20);
  assert.match(messages[1].content, /Contenu probant 20\./);
  assert.doesNotMatch(messages[1].content, /Contenu probant 21\./);
});

test("le modèle peut remonter un candidat au-delà du cinquième et seuls les passages originaux sont renvoyés", async () => {
  let received;
  const selected = await runResourcePassageSelection("Question ?", candidates, {
    generate: async (messages) => {
      received = messages;
      return JSON.stringify({ answer: "", sources: [9, 2], missing: false });
    },
  });

  assert.equal((received[1].content.match(/\[Passage \d+\]/g) ?? []).length, 20);
  assert.deepEqual(selected, {
    status: "selected",
    passages: [candidates[8], candidates[1]],
  });
  assert.equal(selected.passages[0], candidates[8]);
  assert.equal(selected.passages[1], candidates[1]);
});

test("la sélection est plafonnée à cinq passages et conserve l'ordre fourni par le modèle", () => {
  const valid = parseResourcePassageSelectionReply(
    JSON.stringify({ answer: "", sources: [20, 7, 3, 2, 1], missing: false }),
    candidates,
  );
  assert.deepEqual(valid, {
    status: "selected",
    passages: [candidates[19], candidates[6], candidates[2], candidates[1], candidates[0]],
  });

  assert.deepEqual(
    parseResourcePassageSelectionReply(
      JSON.stringify({ answer: "", sources: [1, 2, 3, 4, 5, 6], missing: false }),
      candidates,
    ),
    { status: "error" },
  );
});

test("aucun passage pertinent produit une liste vide sans texte inventé", () => {
  assert.deepEqual(
    parseResourcePassageSelectionReply(
      JSON.stringify({ answer: "", sources: [], missing: true }),
      candidates,
    ),
    { status: "none" },
  );
});

test("les sources inventées, dupliquées, mal typées ou incohérentes sont refusées", () => {
  const invalidReplies = [
    "pas du JSON",
    JSON.stringify({ answer: "", sources: [21], missing: false }),
    JSON.stringify({ answer: "", sources: [1, 1], missing: false }),
    JSON.stringify({ answer: "", sources: ["1"], missing: false }),
    JSON.stringify({ answer: "", sources: [1.5], missing: false }),
    JSON.stringify({ answer: "texte inventé", sources: [1], missing: false }),
    JSON.stringify({ answer: "", sources: [], missing: false }),
    JSON.stringify({ answer: "", sources: [1], missing: true }),
    JSON.stringify({ answer: "", sources: [], missing: true, extra: true }),
    JSON.stringify({ answer: null, sources: [], missing: true }),
    JSON.stringify({ answer: "", sources: null, missing: true }),
    JSON.stringify({ answer: "", sources: [], missing: "true" }),
    JSON.stringify([1, 2, 3]),
  ];

  for (const reply of invalidReplies) {
    assert.deepEqual(parseResourcePassageSelectionReply(reply, candidates), { status: "error" });
  }
});

test("les erreurs fournisseur et réponses invalides ne retombent pas sur les candidats", async () => {
  const logs = [];
  for (const generate of [
    async () => {
      throw new Error("erreur fournisseur");
    },
    async () => JSON.stringify({ answer: "", sources: [999], missing: false }),
  ]) {
    const result = await runResourcePassageSelection(
      "question privée",
      candidates,
      {
        generate,
        logError: () => logs.push("sélection refusée"),
      },
    );
    assert.deepEqual(result, { status: "error" });
  }
  assert.deepEqual(logs, ["sélection refusée", "sélection refusée"]);
  assert.doesNotMatch(logs.join(), /question privée|erreur fournisseur/);
});

test("les recherches invalides, refusées, en erreur ou vides n'appellent pas le LLM", async () => {
  let generateCalls = 0;
  const generate = async () => {
    generateCalls += 1;
    return JSON.stringify({ answer: "", sources: [1], missing: false });
  };
  const outcomes = [
    { status: "invalid" },
    { status: "rate-limited" },
    { status: "error" },
    { status: "ok", passages: [] },
    null,
  ];

  for (const outcome of outcomes) {
    assert.deepEqual(
      await runResourcePassageSearch("question", {
        searchCandidates: async () => outcome,
        generate,
      }),
      outcome,
    );
  }
  assert.equal(generateCalls, 0);

  assert.deepEqual(
    await runResourcePassageSearch("question", {
      searchCandidates: async () => ({ status: "ok", passages: candidates }),
      generate,
    }),
    { status: "ok", passages: [candidates[0]] },
  );
  assert.equal(generateCalls, 1);
});

test("une erreur de présélection devient une erreur explicite sans appel au LLM", async () => {
  let generateCalls = 0;
  assert.deepEqual(
    await runResourcePassageSearch("question privée", {
      searchCandidates: async () => {
        throw new Error("erreur privée");
      },
      generate: async () => {
        generateCalls += 1;
        return "";
      },
    }),
    { status: "error" },
  );
  assert.equal(generateCalls, 0);
});

test("la migration conserve le classement et les références avec une limite serveur de vingt sous RLS", async () => {
  const [restored, candidatesMigration] = await Promise.all([
    readFile(
      "supabase/migrations/20261110143000_restore_hybrid_chunk_references.sql",
      "utf8",
    ),
    readFile(
      "supabase/migrations/20261110210000_search_resource_chunk_candidates.sql",
      "utf8",
    ),
  ]);
  const functionBody = (sql) => sql.match(/as \$function\$([\s\S]*?)\$function\$;/i)?.[1];
  const originalBody = functionBody(restored);
  const candidateBody = functionBody(candidatesMigration);
  assert.ok(originalBody);
  assert.equal(
    candidateBody?.replace(
      /limit least\(greatest\(coalesce\(p_limit, 20\), 1\), 20\);/i,
      "limit least(greatest(coalesce(p_limit, 5), 1), 5);",
    ),
    originalBody,
  );
  assert.match(candidatesMigration, /drop function if exists public\.search_resource_chunk_candidates/i);
  assert.match(candidatesMigration, /chunk_id uuid,\s+resource_id uuid,\s+revision integer,/);
  assert.match(candidatesMigration, /security invoker\s+set search_path = ''/i);
  assert.match(candidatesMigration, /least\(greatest\(coalesce\(p_limit, 20\), 1\), 20\)/i);
  assert.match(candidatesMigration, /revoke all[\s\S]+from public, anon/i);
  assert.match(candidatesMigration, /grant execute[\s\S]+to authenticated/i);
  assert.match(candidatesMigration, /begin;[\s\S]+commit;\s*$/i);
});
