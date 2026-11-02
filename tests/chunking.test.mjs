import assert from "node:assert/strict";
import test from "node:test";

import { chunkText, CHUNK_TARGET_LENGTH } from "../src/features/resources/chunking.ts";

test("un texte vide ne donne aucun passage", () => {
  assert.deepEqual(chunkText(""), []);
  assert.deepEqual(chunkText("  \n "), []);
});

test("un texte court donne un seul passage", () => {
  assert.deepEqual(chunkText("Bonjour le monde."), ["Bonjour le monde."]);
});

test("un texte long est découpé en passages bornés qui se chevauchent", () => {
  const sentence = "Ceci est une phrase de test assez simple. ";
  const text = sentence.repeat(60);
  const chunks = chunkText(text);

  assert.ok(chunks.length > 1);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= CHUNK_TARGET_LENGTH, "passage trop long");
    assert.ok(chunk.length > 0);
  }
  const tail = chunks[0].slice(-30);
  assert.ok(chunks[1].includes(tail.trim().split(" ").slice(-3).join(" ")), "chevauchement attendu");
});

test("le découpage préfère la fin d'un paragraphe", () => {
  const paragraph = "a".repeat(600);
  const chunks = chunkText(`${paragraph}\n\n${"b".repeat(600)}`);
  assert.equal(chunks[0], paragraph);
});

test("un texte sans espace est tout de même découpé", () => {
  const chunks = chunkText("x".repeat(2000));
  assert.ok(chunks.length >= 3);
  assert.ok(chunks.every((chunk) => chunk.length <= CHUNK_TARGET_LENGTH));
});

test("le texte entier est couvert par les passages", () => {
  const words = Array.from({ length: 400 }, (_, i) => `mot${i}`);
  const chunks = chunkText(words.join(" "));
  const joined = chunks.join(" ");
  for (const word of words) {
    assert.ok(joined.includes(word), `${word} manquant`);
  }
});
