import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const css = readFileSync("src/app/globals.css", "utf8");

function loadTypeScript(path, resolveImport = require) {
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
    },
  });
  const loadedModule = { exports: {} };
  new Function("require", "exports", "module", outputText)(
    resolveImport,
    loadedModule.exports,
    loadedModule,
  );
  return loadedModule.exports;
}

function mockLink({ href, children, ...props }) {
  return createElement("a", { href, ...props }, children);
}

function renderPage(path, resolveImport, props) {
  const { default: Page } = loadTypeScript(path, resolveImport);
  return Promise.resolve().then(() => Page(props)).then(renderToStaticMarkup);
}

function navigation() {
  return {
    redirect: (href) => {
      throw new Error(`redirect:${href}`);
    },
  };
}

function assistantListResolver(getResult) {
  return (specifier) => {
    if (specifier === "next/link") return mockLink;
    if (specifier === "@/features/assistant/assistant-conversation-core") {
      return { conversationQuestionStatusLabel: () => "Réponse enregistrée" };
    }
    if (specifier === "@/features/assistant/conversations") {
      return { listMyConversations: getResult };
    }
    return require(specifier);
  };
}

function assistantDetailResolver(getResult) {
  return (specifier) => {
    if (specifier === "node:crypto") return { randomUUID: () => "new-question-id" };
    if (specifier === "next/link") return mockLink;
    if (specifier === "next/navigation") return navigation();
    if (specifier === "@/features/assistant/assistant-form") {
      return {
        AssistantForm: ({ conversationMode }) =>
          createElement("form", { "data-conversation-mode": conversationMode }),
      };
    }
    if (specifier === "@/features/assistant/assistant-answer") {
      return {
        AssistantAnswer: ({ answer, sources }) => (
          createElement(
            "article",
            {
              className: "assistant-answer assistant-answer-card",
              "data-source-ids": sources.map((source) => source.sourceId).join(","),
            },
            answer,
            createElement(
              "ul",
              null,
              sources.map((source, index) => createElement(
                "li",
                { key: source.sourceId ?? index, role: source.status === "unavailable" ? "status" : undefined },
                source.status === "unavailable"
                  ? "Source non disponible"
                  : createElement(
                    "span",
                    null,
                    source.title,
                    createElement("p", null, source.excerpt),
                  ),
              )),
            ),
          )
        ),
      };
    }
    if (specifier === "@/features/assistant/assistant-conversation-core") {
      return { conversationQuestionStatusLabel: () => "Réponse enregistrée" };
    }
    if (specifier === "@/features/assistant/conversations") {
      return { getMyConversation: getResult };
    }
    if (specifier === "@/features/assistant/assistant-actions") {
      return { deleteConversationAction: async () => {} };
    }
    return require(specifier);
  };
}

test("les trois pages assistant gardent une surface blanche et des liens violets soulignés", async () => {
  const { default: AssistantPage } = loadTypeScript("src/app/assistant/page.tsx", (specifier) => {
    if (specifier === "node:crypto") return { randomUUID: () => "question-id" };
    if (specifier === "next/link") return mockLink;
    if (specifier === "next/navigation") return navigation();
    if (specifier === "@/features/assistant/assistant-form") {
      return { AssistantForm: () => createElement("form", { "data-assistant-form": true }) };
    }
    if (specifier === "@/lib/supabase/server") {
      return {
        createClient: async () => ({
          auth: { getUser: async () => ({ data: { user: { id: "member-1" } } }) },
        }),
      };
    }
    return require(specifier);
  });
  const assistantMarkup = renderToStaticMarkup(await AssistantPage());
  assert.match(assistantMarkup, /class="auth-card category-card assistant-card"/);
  assert.match(assistantMarkup, /href="\/assistant\/conversations" class="resource-link"/);
  assert.match(assistantMarkup, /data-assistant-form="true"/);

  await assert.rejects(
    renderPage("src/app/assistant/page.tsx", (specifier) => {
      if (specifier === "node:crypto") return { randomUUID: () => "question-id" };
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return navigation();
      if (specifier === "@/features/assistant/assistant-form") {
        return { AssistantForm: () => createElement("form") };
      }
      if (specifier === "@/lib/supabase/server") {
        return {
          createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
        };
      }
      return require(specifier);
    }),
    /redirect:\/login/,
  );

  const listMarkup = await renderPage(
    "src/app/assistant/conversations/page.tsx",
    assistantListResolver(async () => ({ status: "ok", conversations: [] })),
    { searchParams: Promise.resolve({}) },
  );
  assert.match(listMarkup, /class="auth-card category-card assistant-card"/);
  assert.match(listMarkup, /href="\/assistant" class="resource-link"/);

  const detailMarkup = await renderPage(
    "src/app/assistant/conversations/[id]/page.tsx",
    assistantDetailResolver(async () => ({ status: "ok", messages: [] })),
    { params: Promise.resolve({ id: "conversation-1" }), searchParams: Promise.resolve({}) },
  );
  assert.match(detailMarkup, /class="auth-card category-card assistant-card"/);
  assert.match(detailMarkup, /href="\/assistant\/conversations" class="resource-link"/);
});

test("l'historique distingue erreur, absence, état vide, succès et suppression", async () => {
  const props = (searchParams = {}) => ({ searchParams: Promise.resolve(searchParams) });
  const errorMarkup = await renderPage(
    "src/app/assistant/conversations/page.tsx",
    assistantListResolver(async () => ({ status: "error", conversations: [] })),
    props(),
  );
  assert.match(errorMarkup, /role="alert"/);
  assert.doesNotMatch(errorMarkup, /Aucune conversation enregistrée/);

  const emptyMarkup = await renderPage(
    "src/app/assistant/conversations/page.tsx",
    assistantListResolver(async () => ({ status: "ok", conversations: [] })),
    props(),
  );
  assert.match(emptyMarkup, /role="status"/);
  assert.match(emptyMarkup, /Aucune conversation enregistrée/);

  const conversation = {
    id: "conversation-1",
    firstQuestion: "Question initiale",
    status: "complete",
    lastQuestionAt: "2026-11-11T12:00:00.000Z",
  };
  const listMarkup = await renderPage(
    "src/app/assistant/conversations/page.tsx",
    assistantListResolver(async () => ({ status: "ok", conversations: [conversation] })),
    props(),
  );
  assert.match(listMarkup, /class="category-entry assistant-conversation-entry"/);
  assert.match(listMarkup, /href="\/assistant\/conversations\/conversation-1"[^>]*>Question initiale/);
  assert.match(listMarkup, /Réponse enregistrée/);
  assert.match(listMarkup, /href="\/assistant\/conversations\/conversation-1\?delete=confirm"/);

  const deletedMarkup = await renderPage(
    "src/app/assistant/conversations/page.tsx",
    assistantListResolver(async () => ({ status: "ok", conversations: [] })),
    props({ deleted: "1" }),
  );
  assert.match(deletedMarkup, /role="status">La conversation a été supprimée/);
  const deleteErrorMarkup = await renderPage(
    "src/app/assistant/conversations/page.tsx",
    assistantListResolver(async () => ({ status: "ok", conversations: [] })),
    props({ deleteError: "1" }),
  );
  assert.match(deleteErrorMarkup, /role="alert">La conversation n&#x27;a pas pu être supprimée/);
});

test("la relecture conserve questions, réponses et sources et masque une source indisponible", async () => {
  const conversation = {
    status: "ok",
    messages: [
      ...Array.from({ length: 11 }, (_, index) => ({
        id: `question-${index}`,
        role: "user",
        content: index === 0 ? "Question historique" : `Question ${index}`,
        status: "complete",
      })),
      {
        id: "answer-1",
        role: "assistant",
        content: "Réponse historique.",
        status: "complete",
        sources: [{
          status: "available",
          sourceId: "passage-1",
          resourceId: "resource-1",
          title: "Titre actuel",
          excerpt: "Preuve enregistrée",
        }],
        hasUnavailableSources: true,
      },
    ],
  };
  const markup = await renderPage(
    "src/app/assistant/conversations/[id]/page.tsx",
    assistantDetailResolver(async () => conversation),
    { params: Promise.resolve({ id: "conversation-1" }), searchParams: Promise.resolve({}) },
  );
  assert.match(markup, /<li class="category-entry assistant-message"><h2>Vous<\/h2><p class="assistant-question">Question historique<\/p>/);
  assert.match(markup, /class="assistant-answer assistant-answer-card" data-source-ids="passage-1"/);
  assert.match(markup, /Cette réponse a été enregistrée auparavant/);
  assert.match(markup, /Titre actuel/);
  assert.match(markup, /Preuve enregistrée/);
  assert.match(markup, /Seuls les 10 derniers échanges/);

  const unavailableMarkup = await renderPage(
    "src/app/assistant/conversations/[id]/page.tsx",
    assistantDetailResolver(async () => ({ status: "unavailable" })),
    { params: Promise.resolve({ id: "expired-conversation" }), searchParams: Promise.resolve({}) },
  );
  assert.match(unavailableMarkup, /Cette conversation n&#x27;est pas disponible/);
  assert.doesNotMatch(unavailableMarkup, /Titre ancien|Extrait ancien|assistant-answer-card/);

  const loadErrorMarkup = await renderPage(
    "src/app/assistant/conversations/[id]/page.tsx",
    assistantDetailResolver(async () => ({ status: "error" })),
    { params: Promise.resolve({ id: "conversation-1" }), searchParams: Promise.resolve({}) },
  );
  assert.match(loadErrorMarkup, /role="alert">La conversation n&#x27;a pas pu être chargée/);
  const emptyMarkup = await renderPage(
    "src/app/assistant/conversations/[id]/page.tsx",
    assistantDetailResolver(async () => ({ status: "ok", messages: [] })),
    { params: Promise.resolve({ id: "conversation-1" }), searchParams: Promise.resolve({}) },
  );
  assert.match(emptyMarkup, /role="status">Aucun message enregistré/);

  const loadingMarkup = renderToStaticMarkup(
    createElement(loadTypeScript("src/app/assistant/conversations/loading.tsx").default),
  );
  assert.match(loadingMarkup, /class="auth-card category-card assistant-card"/);
  assert.match(loadingMarkup, /role="status">Chargement des conversations/);
});

test("la confirmation garde son annulation explicite et une action destructive distincte", async () => {
  const markup = await renderPage(
    "src/app/assistant/conversations/[id]/page.tsx",
    assistantDetailResolver(async () => ({
      status: "ok",
      messages: [{
        id: "question-1",
        role: "user",
        content: "Question à supprimer",
        status: "complete",
      }],
    })),
    {
      params: Promise.resolve({ id: "conversation-1" }),
      searchParams: Promise.resolve({ delete: "confirm", error: "1" }),
    },
  );
  assert.match(markup, /class="assistant-delete-confirmation"/);
  assert.match(markup, /Question à supprimer/);
  assert.match(markup, /Cette action est définitive/);
  assert.match(markup, /class="button button-destructive"[^>]*>Supprimer/);
  assert.match(markup, /href="\/assistant\/conversations\/conversation-1" class="button button-secondary">Annuler/);
  assert.match(markup, /role="alert">La conversation n&#x27;a pas pu être supprimée/);
  assert.doesNotMatch(markup, /data-conversation-mode/);
});

test("les styles assistant déclarent le repli responsive et le focus visible", () => {
  assert.match(css, /\.assistant-card\s*\{[^}]*background:\s*#fff/s);
  assert.match(css, /\.assistant-answer-card,\s*\.assistant-source-card\s*\{[^}]*background:\s*var\(--surface-mauve\)/s);
  assert.match(css, /\.resource-link\s*\{[^}]*color:\s*var\(--purple\);[^}]*overflow-wrap:\s*anywhere;[^}]*text-decoration:\s*underline/s);
  assert.match(css, /\.assistant-message\s*\{[^}]*background:\s*#fff/s);
  assert.match(css, /\.assistant-delete-confirmation\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /\.button-destructive\s*\{[^}]*background:\s*var\(--error\)/s);
  assert.match(css, /\.auth-card\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.category-entry\s*\{[^}]*min-width:\s*0;[\s\S]*?overflow-wrap:\s*anywhere/s);
  assert.match(css, /a:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\)/s);
  assert.match(css, /\.button:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\)/s);
  assert.match(css, /@media \(max-width: 480px\)\s*\{\s*\.auth-card\s*\{[^}]*padding:\s*30px 24px/s);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
