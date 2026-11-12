import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadServer({ connection, cookies, createServerClient }) {
  const { outputText } = ts.transpileModule(
    readFileSync("src/lib/supabase/server.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  );
  const loaded = { exports: {} };
  const resolveImport = (specifier) => {
    if (specifier === "server-only") return {};
    if (specifier === "next/server") return { connection };
    if (specifier === "next/headers") return { cookies };
    if (specifier === "@supabase/ssr") return { createServerClient };
    throw new Error(`Import inattendu : ${specifier}`);
  };
  new Function("require", "exports", "module", "process", outputText)(
    resolveImport,
    loaded.exports,
    loaded,
    { env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.test",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    } },
  );
  return loaded.exports;
}

test("le client de session attend la requete avant les cookies et le SDK Supabase", async () => {
  const events = [];
  let releaseRequest;
  const request = new Promise((resolve) => { releaseRequest = resolve; });
  const writes = [];
  const sessionCookies = [{ name: "session-test", value: "session-fictive" }];
  const client = { auth: {} };
  let cookieAdapter;
  const { createClient } = loadServer({
    connection: async () => {
      events.push("connection");
      await request;
    },
    cookies: async () => {
      events.push("cookies");
      return {
        getAll: () => sessionCookies,
        set: (...args) => writes.push(args),
      };
    },
    createServerClient: (url, key, options) => {
      events.push("sdk");
      assert.equal(url, "https://example.test");
      assert.equal(key, "test-publishable-key");
      cookieAdapter = options.cookies;
      return client;
    },
  });

  const pending = createClient();
  await Promise.resolve();
  await Promise.resolve();
  try {
    assert.deepEqual(events, ["connection"]);
  } finally {
    releaseRequest();
    await pending;
  }
  assert.equal(await pending, client);
  assert.deepEqual(events, ["connection", "cookies", "sdk"]);
  assert.equal(cookieAdapter.getAll(), sessionCookies);
  const options = { httpOnly: true, path: "/" };
  cookieAdapter.setAll([{ name: "session-test", value: "renouvelee", options }]);
  assert.deepEqual(writes, [["session-test", "renouvelee", options]]);
});

test("un echec de la frontiere de requete se propage sans initialiser le SDK", async () => {
  const failure = new Error("Requete interrompue");
  const { createClient } = loadServer({
    connection: async () => { throw failure; },
    cookies: async () => { assert.fail("Cookies lus avant une requete disponible"); },
    createServerClient: () => { assert.fail("SDK initialise sans requete"); },
  });
  await assert.rejects(createClient, (error) => error === failure);
});
