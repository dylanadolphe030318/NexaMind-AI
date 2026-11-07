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

test("la recherche corrigée reste sous RLS et ne garde plus un seul passage par ressource", () => {
  const sql = readFileSync("supabase/migrations/20261105130000_search_all_matching_chunks.sql", "utf8");
  assert.match(sql, /security invoker/i);
  assert.doesNotMatch(sql, /security definer/i);
  assert.doesNotMatch(sql, /distinct on/i);
  assert.match(sql, /limit least\(greatest\(coalesce\(p_limit, 5\), 1\), 5\)/i);
  assert.match(sql, /revoke all on function public\.search_resource_chunks[\s\S]*from public, anon/i);
  assert.match(sql, /grant execute on function public\.search_resource_chunks[\s\S]*to authenticated/i);
});

test("le classement hybride reste sous RLS, borne le texte et garde le seuil brut", () => {
  const sql = readFileSync("supabase/migrations/20261105140000_search_resource_chunks_hybrid.sql", "utf8");
  assert.match(sql, /security invoker/i);
  assert.doesNotMatch(sql, /security definer/i);
  assert.match(sql, /similarity >= p_min_similarity/i);
  assert.match(sql, /similarity >= best\.similarity - 0\.10/i);
  assert.match(sql, /normalized_text_rank \* 0\.10/i);
  assert.match(sql, /query_identifiers[\s\S]*matches_identifier desc/i);
  assert.match(sql, /limit least\(greatest\(coalesce\(p_limit, 5\), 1\), 5\)/i);
  assert.match(sql, /revoke all on function public\.search_resource_chunks_hybrid[\s\S]*from public, anon/i);
  assert.match(sql, /grant execute on function public\.search_resource_chunks_hybrid[\s\S]*to authenticated/i);
});

test("seule la recherche de ressources active le classement hybride", () => {
  const search = readFileSync("src/features/resources/semantic-search.ts", "utf8");
  const resourcePage = readFileSync("src/app/resources/search/page.tsx", "utf8");
  const assistant = readFileSync("src/features/assistant/assistant.ts", "utf8");
  assert.match(search, /queryText[\s\S]*search_resource_chunks_hybrid/);
  assert.match(search, /: await supabase\.rpc\("search_resource_chunks"/);
  assert.match(resourcePage, /searchResourcePassages\(raw\)/);
  assert.match(assistant, /retrieve:\s*searchPassages/);
});

test("seule la recherche de ressources transmet le seuil dédié", () => {
  const search = readFileSync("src/features/resources/semantic-search.ts", "utf8");
  assert.match(
    search,
    /minSimilarity:\s*rankByText\s*\?\s*SEMANTIC_RESOURCE_MIN_SIMILARITY\s*:\s*undefined/,
  );
  assert.match(search, /searchResourcePassages\(question: string\)[\s\S]*search\(question, true\)/);
  assert.match(search, /searchPassages\(question: string\)[\s\S]*search\(question, false\)/);
});

test("la migration hybride ne qualifie pas les expressions conditionnelles SQL", () => {
  const sql = readFileSync("supabase/migrations/20261105140000_search_resource_chunks_hybrid.sql", "utf8");
  assert.doesNotMatch(sql, /\bpg_catalog\s*\.\s*(coalesce|nullif|greatest|least)\s*\(/i);
  assert.match(sql, /coalesce\(p_query_text, ''\)/i);
  assert.match(sql, /coalesce\(eligible\.content, ''\)/i);
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
