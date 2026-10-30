import assert from "node:assert/strict";
import test from "node:test";

import { parseCategoryName } from "./category-validation.ts";

test("refuse les noms de cat\u00e9gorie absents ou vides", () => {
  assert.deepEqual(parseCategoryName(null), {
    ok: false,
    message: "Saisissez un nom de cat\u00e9gorie.",
  });
  assert.deepEqual(parseCategoryName("  "), {
    ok: false,
    message: "Saisissez un nom de cat\u00e9gorie.",
  });
  assert.equal(parseCategoryName("\t\n ").ok, false);
});

test("normalise les espaces sans modifier le nom saisi", () => {
  assert.deepEqual(parseCategoryName("  \u00c9quipe produit  "), {
    ok: true,
    value: "\u00c9quipe produit",
  });
});

test("refuse les valeurs de formulaire non textuelles", () => {
  assert.deepEqual(parseCategoryName(new File(["nom"], "nom.txt")), {
    ok: false,
    message: "Saisissez un nom de cat\u00e9gorie.",
  });
});
