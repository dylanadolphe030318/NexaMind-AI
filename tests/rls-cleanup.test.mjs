import assert from "node:assert/strict";
import test from "node:test";

import { runWithRlsCleanup } from "./helpers/rls-cleanup.mjs";

test("le nettoyage s'exécute avant la déconnexion après un succès", async () => {
  const calls = [];

  const result = await runWithRlsCleanup({
    action: async () => {
      calls.push("action");
      return "résultat";
    },
    cleanup: [
      async () => calls.push("nettoyage-1"),
      async () => calls.push("nettoyage-2"),
    ],
    disconnect: [async () => calls.push("déconnexion")],
  });

  assert.equal(result, "résultat");
  assert.deepEqual(calls, [
    "action",
    "nettoyage-1",
    "nettoyage-2",
    "déconnexion",
  ]);
});

test("un échec après création déclenche le nettoyage avant la déconnexion", async () => {
  const calls = [];
  const failure = new Error("échec simulé après création");

  await assert.rejects(
    runWithRlsCleanup({
      action: async () => {
        calls.push("création");
        throw failure;
      },
      cleanup: [async () => calls.push("nettoyage")],
      disconnect: [async () => calls.push("déconnexion")],
    }),
    (error) => error === failure,
  );
  assert.deepEqual(calls, ["création", "nettoyage", "déconnexion"]);
});

test("les erreurs initiales et celles du nettoyage et de la déconnexion sont conservées", async () => {
  const actionError = new Error("échec initial");
  const cleanupError = new Error("échec de nettoyage");
  const disconnectError = new Error("échec de déconnexion");
  const calls = [];

  await assert.rejects(
    runWithRlsCleanup({
      action: async () => {
        throw actionError;
      },
      cleanup: [
        async () => {
          calls.push("nettoyage-1");
          throw cleanupError;
        },
        async () => calls.push("nettoyage-2"),
      ],
      disconnect: [
        async () => {
          calls.push("déconnexion");
          throw disconnectError;
        },
      ],
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.deepEqual(error.errors, [
        actionError,
        cleanupError,
        disconnectError,
      ]);
      return true;
    },
  );
  assert.deepEqual(calls, ["nettoyage-1", "nettoyage-2", "déconnexion"]);
});
