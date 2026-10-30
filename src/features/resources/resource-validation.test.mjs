import assert from "node:assert/strict";
import test from "node:test";

import { parseResourceForm } from "./resource-validation.ts";

const validCategory = "3f2b8c1e-5d4a-4b6c-8e7f-0a1b2c3d4e5f";

function form(entries) {
  return new Map(Object.entries(entries));
}

test("accepte une ressource valide et normalise les espaces", () => {
  const result = parseResourceForm(
    form({ title: "  Guide  ", body: "  Texte coll\u00e9 \n", categoryId: validCategory }),
  );
  assert.deepEqual(result, {
    ok: true,
    values: { title: "Guide", body: "Texte coll\u00e9", categoryId: validCategory },
  });
});

test("signale chaque champ manquant ou vide", () => {
  const result = parseResourceForm(form({ title: "  ", body: "", categoryId: "" }));
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, {
    title: "Saisissez un titre.",
    body: "Saisissez le texte de la ressource.",
    categoryId: "Choisissez une cat\u00e9gorie.",
  });
});

test("ne signale que le champ manquant et conserve les autres valeurs", () => {
  const result = parseResourceForm(
    form({ title: "Titre", body: "Texte", categoryId: "" }),
  );
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors), ["categoryId"]);
  assert.equal(result.values.title, "Titre");
  assert.equal(result.values.body, "Texte");
});

test("refuse une cat\u00e9gorie qui n'est pas un identifiant valide", () => {
  const result = parseResourceForm(
    form({ title: "T", body: "B", categoryId: "pas-un-uuid" }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors.categoryId, "Cette cat\u00e9gorie n\u2019est pas disponible.");
});

test("refuse les valeurs non textuelles (fichiers)", () => {
  const result = parseResourceForm(
    form({ title: new File(["x"], "x.txt"), body: "B", categoryId: validCategory }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.errors.title, "Saisissez un titre.");
});

test("refuse un titre ou un texte trop long", () => {
  const result = parseResourceForm(
    form({ title: "a".repeat(201), body: "b".repeat(20001), categoryId: validCategory }),
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.title);
  assert.ok(result.errors.body);
});
