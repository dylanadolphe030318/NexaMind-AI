import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const assistant = readFileSync("src/app/assistant/page.tsx", "utf8");
const styles = readFileSync("src/app/globals.css", "utf8");

test("le tableau de bord propose un lien Assistant vers la route existante", () => {
  assert.match(dashboard, /import Link from "next\/link"/);
  assert.match(
    dashboard,
    /<Link className="button button-small dashboard-categories-link" href="\/assistant">\s*Assistant\s*<\/Link>/,
  );
  assert.equal((dashboard.match(/href="\/assistant"/g) ?? []).length, 1);
  assert.match(dashboard, /href="\/categories"/);
  assert.match(dashboard, /href="\/resources"/);
  assert.match(dashboard, /href="\/resources\/searches"/);
  assert.match(dashboard, /action=\{signOut\}/);
});

test("la route assistant protège son contenu par la session sans contrôle de rôle", () => {
  const sessionCheck = assistant.indexOf("await supabase.auth.getUser()");
  const unauthenticatedGuard = assistant.indexOf("if (!user)");
  const loginRedirect = assistant.indexOf('redirect("/login")');
  const assistantContent = assistant.indexOf("<AssistantForm");

  assert.ok(sessionCheck >= 0);
  assert.ok(unauthenticatedGuard > sessionCheck);
  assert.ok(loginRedirect > unauthenticatedGuard);
  assert.ok(assistantContent > loginRedirect);
  assert.equal((assistant.match(/<AssistantForm\b/g) ?? []).length, 1);
  assert.doesNotMatch(assistant, /profile\?\.role|roleLabel/);
});

test("le lien réutilise le style responsive et le focus clavier global", () => {
  assert.match(styles, /\.dashboard-categories-link\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /a:focus-visible\s*\{[^}]*outline:\s*3px/s);
});
