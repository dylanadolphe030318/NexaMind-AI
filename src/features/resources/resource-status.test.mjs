import assert from "node:assert/strict";
import test from "node:test";

import {
  canRetryResourceIndexing,
  getResourceIndexingLabel,
  getResourceIndexingFailureMessage,
  RESOURCE_INDEXING_FAILURE_MESSAGE,
} from "./resource-status.ts";

test("affiche le libellé de chaque état de préparation", () => {
  assert.equal(getResourceIndexingLabel("processing"), "Préparation en cours");
  assert.equal(getResourceIndexingLabel("ready"), "Prête pour la recherche");
  assert.equal(getResourceIndexingLabel("failed"), "Préparation en échec");
});

test("propose la relance uniquement en échec au propriétaire ou responsable", () => {
  assert.equal(canRetryResourceIndexing("failed", true), true);
  assert.equal(canRetryResourceIndexing("failed", false), false);
  assert.equal(canRetryResourceIndexing("processing", true), false);
  assert.equal(canRetryResourceIndexing("ready", true), false);
});

test("utilise le message d'échec prévu par le story", () => {
  assert.equal(
    getResourceIndexingFailureMessage("failed", true),
    RESOURCE_INDEXING_FAILURE_MESSAGE,
  );
  assert.equal(getResourceIndexingFailureMessage("failed", false), null);
  assert.equal(getResourceIndexingFailureMessage("processing", true), null);
  assert.equal(getResourceIndexingFailureMessage("ready", true), null);
  assert.equal(
    RESOURCE_INDEXING_FAILURE_MESSAGE,
    "La préparation de cette ressource a échoué. Vous pouvez la relancer.",
  );
});
