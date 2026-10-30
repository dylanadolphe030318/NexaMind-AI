import assert from "node:assert/strict";
import test from "node:test";

import { formatResourceDate, isUuid } from "./resource-format.ts";

test("formate une date de mise \u00e0 jour en fran\u00e7ais", () => {
  assert.equal(formatResourceDate("2026-10-30T12:00:00Z"), "30 octobre 2026");
});

test("g\u00e8re une date invalide", () => {
  assert.equal(formatResourceDate("pas une date"), "Date indisponible");
});

test("reconna\u00eet les identifiants UUID", () => {
  assert.equal(isUuid("0b9f3c7e-1d2a-4b5c-8d6e-7f8091a2b3c4"), true);
  assert.equal(isUuid("abc"), false);
});
