import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

test("la fonction de recherche sémantique s'exécute avec les droits du membre (RLS)", () => {
  const sql = readFileSync("supabase/migrations/20261105100000_search_resource_chunks.sql", "utf8");
  assert.match(sql, /security invoker/i);
  assert.doesNotMatch(sql, /security definer/i);
  assert.match(sql, /revoke all on function public\.search_resource_chunks[\s\S]*from public, anon/i);
  assert.match(sql, /grant execute on function public\.search_resource_chunks[\s\S]*to authenticated/i);
});

test("aucune clé privilégiée Supabase n'est utilisée dans le code de l'application", () => {
  for (const file of sourceFiles("src")) {
    const content = readFileSync(file, "utf8");
    assert.doesNotMatch(content, /service_role|SUPABASE_SECRET|sb_secret_/i, file);
  }
});

test("la clé OpenAI n'est lue que dans du code serveur", () => {
  const readers = sourceFiles("src").filter((file) =>
    readFileSync(file, "utf8").includes("process.env.OPENAI_API_KEY"),
  );
  assert.ok(readers.length > 0);
  for (const file of readers) {
    assert.match(readFileSync(file, "utf8"), /import "server-only";/, file);
  }
  for (const file of sourceFiles("src")) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /NEXT_PUBLIC_OPENAI/i, file);
  }
});
