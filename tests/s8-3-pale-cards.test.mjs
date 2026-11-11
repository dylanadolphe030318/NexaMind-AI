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

test("les cartes de ressources et de recherche gardent leur contenu et leurs liens", async () => {
  const { ResourceCategoryFilter } = loadTypeScript(
    "src/features/resources/resource-category-filter.tsx",
  );
  const { default: ResourcesPage } = loadTypeScript(
    "src/app/resources/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return { redirect: () => {} };
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "11/11/2026" };
      }
      if (specifier === "@/features/resources/category-filter") {
        return { parseResourceCategoryParam: () => null };
      }
      if (specifier === "@/features/resources/resource-category-filter") {
        return { ResourceCategoryFilter };
      }
      if (specifier === "@/features/resources/resource-status") {
        return { getResourceIndexingLabel: () => "Prête" };
      }
      if (specifier === "@/features/resources/resources") {
        return {
          getResourceListData: async () => ({
            categories: [],
            resources: [{
              id: "resource-1",
              title: "Guide de sécurité",
              categoryName: "Sécurité",
              updatedAt: "2026-11-11T00:00:00.000Z",
              indexingStatus: "ready",
            }],
          }),
        };
      }
      return require(specifier);
    },
  );
  const markup = renderToStaticMarkup(
    await ResourcesPage({ searchParams: Promise.resolve({}) }),
  );

  assert.match(markup, /class="category-entry resource-card"/);
  assert.match(markup, /href="\/resources\/resource-1"[^>]*>Guide de sécurité<\/a>/);

  const searchPage = readFileSync("src/app/resources/search/page.tsx", "utf8");
  assert.equal((searchPage.match(/className="category-entry resource-card"/g) ?? []).length, 3);

  const { default: SearchResourcesPage } = loadTypeScript(
    "src/app/resources/search/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return { redirect: () => {} };
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "11/11/2026" };
      }
      if (specifier === "@/features/resources/relevant-search-phrase-core") return {};
      if (specifier === "@/features/resources/resources") {
        return {
          SEARCH_MAX_LENGTH: 300,
          searchResources: async () => ({
            results: [{
              id: "resource-2",
              title: "Guide des équipes",
              excerpt: "Extrait consultable",
              updatedAt: "2026-11-11T00:00:00.000Z",
            }],
          }),
        };
      }
      if (specifier === "@/features/resources/searches") {
        return { recordSearch: async () => {} };
      }
      if (specifier === "@/features/resources/relevant-search-phrase") {
        return { selectRelevantSearchPhrase: async () => ({ status: "none" }) };
      }
      if (specifier === "@/features/resources/semantic-search") {
        return { searchResourcePassages: async () => null };
      }
      if (specifier === "@/features/resources/semantic-search-core") {
        return {
          SEMANTIC_QUERY_MAX_LENGTH: 1000,
          buildPassageExcerpt: (content) => content,
        };
      }
      return require(specifier);
    },
  );
  const searchMarkup = renderToStaticMarkup(
    await SearchResourcesPage({ searchParams: Promise.resolve({ q: "équipe" }) }),
  );

  assert.match(searchMarkup, /class="category-entry resource-card"/);
  assert.match(searchMarkup, /href="\/resources\/resource-2"[^>]*>Ouvrir la ressource<\/a>/);
  assert.match(searchMarkup, /Extrait consultable/);
});

test("la réponse et ses sources sont des cartes, y compris les sources indisponibles", () => {
  const answerCore = {
    groupAssistantAnswerSources: () => [{
      resourceId: "resource-1",
      title: "Document source",
      evidence: [{ sourceId: "passage-1", excerpt: "Extrait de preuve" }],
    }],
    splitAssistantAnswer: () => [
      { type: "text", value: "Réponse fondée. " },
      { type: "source", sourceId: "passage-1" },
    ],
  };
  const { AssistantAnswer } = loadTypeScript(
    "src/features/assistant/assistant-answer.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "./assistant-answer-core") return answerCore;
      return require(specifier);
    },
  );
  const markup = renderToStaticMarkup(createElement(AssistantAnswer, {
    answer: "Réponse fondée. [[source:passage-1]]",
    sources: [
      {
        status: "available",
        sourceId: "passage-1",
        resourceId: "resource-1",
        title: "Document source",
        excerpt: "Extrait de preuve",
      },
      { status: "unavailable", sourceId: "old-source" },
    ],
  }));

  assert.match(markup, /class="assistant-answer assistant-answer-card"/);
  assert.match(markup, /class="category-list assistant-sources-list"/);
  assert.equal((markup.match(/class="assistant-source-card"/g) ?? []).length, 2);
  assert.match(markup, /href="\/resources\/resource-1"[^>]*>Source 1<\/a>/);
  assert.match(markup, /Source non disponible/);
  assert.match(markup, /Extrait de preuve/);
});

test("les réponses rouvertes sont encadrées sans recolorer les questions", async () => {
  const { default: ConversationPage } = loadTypeScript(
    "src/app/assistant/conversations/[id]/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return { redirect: () => {} };
      if (specifier === "@/features/assistant/assistant-form") {
        return { AssistantForm: () => createElement("form") };
      }
      if (specifier === "@/features/assistant/assistant-answer") {
        return {
          AssistantAnswer: () => createElement(
            "div",
            { className: "assistant-answer assistant-answer-card" },
            "Réponse historique",
          ),
        };
      }
      if (specifier === "@/features/assistant/assistant-conversation-core") {
        return { conversationQuestionStatusLabel: () => "Réponse enregistrée" };
      }
      if (specifier === "@/features/assistant/conversations") {
        return {
          getMyConversation: async () => ({
            status: "ok",
            messages: [
              {
                id: "question-1",
                role: "user",
                content: "Question historique",
                status: "complete",
              },
              {
                id: "answer-1",
                role: "assistant",
                content: "Réponse historique",
                status: "complete",
                sources: [],
                hasUnavailableSources: false,
              },
            ],
          }),
        };
      }
      if (specifier === "@/features/assistant/assistant-actions") {
        return { deleteConversationAction: async () => {} };
      }
      return require(specifier);
    },
  );
  const markup = renderToStaticMarkup(
    await ConversationPage({
      params: Promise.resolve({ id: "conversation-1" }),
      searchParams: Promise.resolve({}),
    }),
  );

  assert.match(markup, /<li class="category-entry"><h2>Vous<\/h2><p>Question historique<\/p>/);
  assert.match(markup, /<li class="category-entry"><h2>Assistant<\/h2><div class="conversation-assistant-content">/);
  assert.match(markup, /class="assistant-answer assistant-answer-card"/);
});

test("les cartes mauves conservent les contrastes et les états avec leurs libellés", () => {
  assert.match(css, /--surface-mauve:\s*#f3edf8/i);
  assert.match(css, /\.resource-card\s*\{[^}]*min-width:\s*0;[^}]*background:\s*var\(--surface-mauve\)/s);
  assert.match(css, /\.resource-link\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.auth-card h1\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.assistant-answer-card,\s*\.assistant-source-card\s*\{/);
  assert.match(css, /\.auth-message-error\s*\{[^}]*background:\s*#fff6f8/s);
  assert.match(css, /\.auth-message-success\s*\{[^}]*background:\s*#f3fbf6/s);
  assert.match(css, /\.auth-message-info\s*\{[^}]*background:\s*#f8f5fb/s);

  const ratio = contrastRatio("#252032", "#f3edf8");
  assert.ok(ratio >= 4.5, `contraste du texte courant : ${ratio.toFixed(2)}:1`);
  const metadataColor = css.match(/\.resource-card \.resource-meta\s*\{[^}]*color:\s*(#[a-f\d]{6})/i)?.[1];
  assert.ok(metadataColor, "la couleur des métadonnées des cartes doit être explicite");
  const metadataRatio = contrastRatio(metadataColor, "#f3edf8");
  assert.ok(metadataRatio >= 4.5, `contraste des métadonnées : ${metadataRatio.toFixed(2)}:1`);
  assert.notEqual("#f3edf8", "#ffffff");
});

function contrastRatio(foreground, background) {
  const luminance = (hex) => {
    const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)]
    .sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}
