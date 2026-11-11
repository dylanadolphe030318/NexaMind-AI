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
  delete props.prefetch;
  return createElement("a", { href, ...props }, children);
}

function mockNavigation() {
  return {
    notFound: () => { throw new Error("not-found"); },
    redirect: (href) => { throw new Error(`redirect:${href}`); },
  };
}

function renderPage(path, resolver, props) {
  const { default: Page } = loadTypeScript(path, resolver);
  return Page(props).then((element) => renderToStaticMarkup(element));
}

const resource = {
  id: "resource-1",
  title: "Guide de sécurité",
  body: "Contenu de la ressource",
  updatedAt: "2026-11-10T12:00:00.000Z",
  categoryId: "category-1",
  categoryName: "Sécurité",
  indexingStatus: "ready",
};

test("les pages ressources et recherches gardent les informations et liens utiles", async () => {
  const resourceListMarkup = await renderPage(
    "src/app/resources/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "10/11/2026" };
      }
      if (specifier === "@/features/resources/category-filter") {
        return { parseResourceCategoryParam: () => "category-1" };
      }
      if (specifier === "@/features/resources/resource-category-filter") {
        return {
          ResourceCategoryFilter: () =>
            createElement("form", { action: "/resources", method: "get" }, "Filtrer"),
        };
      }
      if (specifier === "@/features/resources/resource-status") {
        return { getResourceIndexingLabel: () => "Prête" };
      }
      if (specifier === "@/features/resources/resources") {
        return {
          getResourceListData: async () => ({
            categories: [{ id: "category-1", name: "Sécurité" }],
            resources: [resource],
          }),
        };
      }
      return require(specifier);
    },
    { searchParams: Promise.resolve({ category: "category-1" }) },
  );
  assert.match(resourceListMarkup, /class="category-entry resource-card"/);
  assert.match(resourceListMarkup, /Guide de sécurité/);
  assert.match(resourceListMarkup, /Catégorie<\/span> Sécurité/);
  assert.match(resourceListMarkup, /État de préparation : Prête/);
  assert.match(resourceListMarkup, /href="\/resources\/resource-1"/);

  const searchMarkup = await renderPage(
    "src/app/resources/search/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "10/11/2026" };
      }
      if (specifier === "@/features/resources/relevant-search-phrase-core") return {};
      if (specifier === "@/features/resources/resources") {
        return {
          SEARCH_MAX_LENGTH: 300,
          searchResources: async () => ({
            results: [{
              id: resource.id,
              title: resource.title,
              excerpt: "Extrait de la ressource",
              updatedAt: resource.updatedAt,
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
        return { searchResourcePassages: async () => ({ status: "error" }) };
      }
      if (specifier === "@/features/resources/semantic-search-core") {
        return { SEMANTIC_QUERY_MAX_LENGTH: 1000, buildPassageExcerpt: (text) => text };
      }
      return require(specifier);
    },
    { searchParams: Promise.resolve({ q: "sécurité" }) },
  );
  assert.match(searchMarkup, /method="get"/);
  assert.match(searchMarkup, /value="sécurité"/);
  assert.match(searchMarkup, /class="category-entry resource-card"/);
  assert.match(searchMarkup, /Extrait de la ressource/);
  assert.match(searchMarkup, /href="\/resources\/resource-1"[^>]*>Ouvrir la ressource/);

  const detailMarkup = await renderPage(
    "src/app/resources/[id]/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "10/11/2026" };
      }
      if (specifier === "@/features/resources/resource-status") {
        return {
          canRetryResourceIndexing: () => false,
          getResourceIndexingFailureMessage: () => null,
          getResourceIndexingLabel: () => "Prête",
        };
      }
      if (specifier === "@/features/resources/resource-actions") {
        return { retryResourceIndexing: async () => {} };
      }
      if (specifier === "@/features/resources/resources") {
        return {
          getResourceDetail: async () => ({
            status: "ok",
            resource,
            canEdit: true,
          }),
        };
      }
      return require(specifier);
    },
    {
      params: Promise.resolve({ id: resource.id }),
      searchParams: Promise.resolve({}),
    },
  );
  assert.match(detailMarkup, /Guide de sécurité/);
  assert.match(detailMarkup, /Catégorie : Sécurité/);
  assert.match(detailMarkup, /Contenu de la ressource/);
  assert.match(detailMarkup, /href="\/resources\/resource-1\/edit"/);
  assert.match(detailMarkup, /href="\/resources\/resource-1\/delete"/);
  assert.match(detailMarkup, /État de préparation : Prête/);

  const failedDetailMarkup = await renderPage(
    "src/app/resources/[id]/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "10/11/2026" };
      }
      if (specifier === "@/features/resources/resource-status") {
        return {
          canRetryResourceIndexing: () => true,
          getResourceIndexingFailureMessage: () => "La préparation a échoué.",
          getResourceIndexingLabel: () => "Échec de préparation",
        };
      }
      if (specifier === "@/features/resources/resource-actions") {
        return { retryResourceIndexing: async () => {} };
      }
      if (specifier === "@/features/resources/resources") {
        return {
          getResourceDetail: async () => ({
            status: "ok",
            resource: { ...resource, indexingStatus: "failed" },
            canEdit: true,
          }),
        };
      }
      return require(specifier);
    },
    {
      params: Promise.resolve({ id: resource.id }),
      searchParams: Promise.resolve({}),
    },
  );
  assert.match(failedDetailMarkup, /resource-indexing-status-failed/);
  assert.match(failedDetailMarkup, /role="alert">La préparation a échoué/);
  assert.match(failedDetailMarkup, /Relancer la préparation/);
});

test("les formulaires et confirmations gardent les états explicites et l'action nommée", async () => {
  const pageData = { categories: [{ id: "category-1", name: "Sécurité" }] };
  const newMarkup = await renderPage(
    "src/app/resources/new/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/categories") {
        return { getCategoryPageData: async () => pageData };
      }
      if (specifier === "@/features/resources/resource-forms") {
        return {
          CreateResourceForm: ({ categories }) =>
            createElement("form", { className: "auth-form" }, categories[0].name),
        };
      }
      return require(specifier);
    },
  );
  assert.match(newMarkup, /class="auth-form"/);
  assert.match(newMarkup, /Sécurité/);

  const editMarkup = await renderPage(
    "src/app/resources/[id]/edit/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/categories") {
        return { getCategoryPageData: async () => pageData };
      }
      if (specifier === "@/features/resources/resource-forms") {
        return {
          EditResourceForm: ({ initialValues, resourceId }) =>
            createElement(
              "form",
              { className: "auth-form", "data-resource": resourceId },
              initialValues.title,
            ),
        };
      }
      if (specifier === "@/features/resources/resources") {
        return { getResourceForEdit: async () => ({ status: "ok", resource }) };
      }
      return require(specifier);
    },
    { params: Promise.resolve({ id: resource.id }) },
  );
  assert.match(editMarkup, /data-resource="resource-1"/);
  assert.match(editMarkup, /Guide de sécurité/);

  let resourceDeleteCalls = 0;
  const deleteMarkup = await renderPage(
    "src/app/resources/[id]/delete/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/resource-actions") {
        return { deleteResource: async () => { resourceDeleteCalls += 1; } };
      }
      if (specifier === "@/features/resources/resources") {
        return { getResourceForEdit: async () => ({ status: "ok", resource }) };
      }
      return require(specifier);
    },
    {
      params: Promise.resolve({ id: resource.id }),
      searchParams: Promise.resolve({}),
    },
  );
  assert.match(deleteMarkup, /class="auth-card category-card confirmation-card"/);
  assert.match(deleteMarkup, /<strong>«.{0,2}Guide de sécurité.{0,2}»<\/strong>/);
  assert.match(deleteMarkup, /class="button button-destructive"/);
  assert.match(deleteMarkup, /href="\/resources\/resource-1"[^>]*>Annuler/);
  assert.doesNotMatch(deleteMarkup, /La ressource a été supprimée/);
  assert.equal(resourceDeleteCalls, 0);

  let searchDeleteCalls = 0;
  const searchDeleteMarkup = await renderPage(
    "src/app/resources/searches/[id]/delete/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/search-actions") {
        return { deleteSearch: async () => { searchDeleteCalls += 1; } };
      }
      if (specifier === "@/features/resources/searches") {
        return {
          getSearchForDelete: async () => ({
            status: "ok",
            search: { id: "search-1", query: "guide sécurité" },
          }),
        };
      }
      return require(specifier);
    },
    {
      params: Promise.resolve({ id: "search-1" }),
      searchParams: Promise.resolve({}),
    },
  );
  assert.match(searchDeleteMarkup, /guide sécurité/);
  assert.match(searchDeleteMarkup, /class="button button-destructive"/);
  assert.match(searchDeleteMarkup, /href="\/resources\/searches"[^>]*>Annuler/);
  assert.doesNotMatch(searchDeleteMarkup, /La recherche a été supprimée/);
  assert.equal(searchDeleteCalls, 0);
});

test("les catégories et l'historique distinguent les rôles, erreurs et absences", async () => {
  let pageData = {
    canManage: true,
    categories: [{ id: "category-1", name: "Sécurité" }],
  };
  const categoriesMarkup = await renderPage(
    "src/app/categories/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/category-forms") {
        return { CreateCategoryForm: () => createElement("form", null, "Créer") };
      }
      if (specifier === "@/features/resources/category-list") {
        return {
          CategoryList: ({ categories, canManage }) =>
            createElement(
              "div",
              { className: "category-entry resource-card" },
              categories[0].name,
              canManage ? " Renommer" : "",
            ),
        };
      }
      if (specifier === "@/features/resources/categories") {
        return { getCategoryPageData: async () => pageData };
      }
      return require(specifier);
    },
  );
  assert.match(categoriesMarkup, /class="category-entry resource-card"/);
  assert.match(categoriesMarkup, /Renommer/);
  assert.match(categoriesMarkup, /Ajouter une catégorie/);

  pageData = { canManage: false, categories: [{ id: "category-1", name: "Sécurité" }] };
  const memberCategoriesMarkup = await renderPage(
    "src/app/categories/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/category-forms") {
        return { CreateCategoryForm: () => createElement("form", null, "Créer") };
      }
      if (specifier === "@/features/resources/category-list") {
        return {
          CategoryList: ({ categories, canManage }) =>
            createElement(
              "div",
              { className: "category-entry resource-card" },
              categories[0].name,
              canManage ? " Renommer" : "",
            ),
        };
      }
      if (specifier === "@/features/resources/categories") {
        return { getCategoryPageData: async () => pageData };
      }
      return require(specifier);
    },
  );
  assert.doesNotMatch(memberCategoriesMarkup, /Renommer|Ajouter une catégorie/);

  const historyMarkup = await renderPage(
    "src/app/resources/searches/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "10/11/2026" };
      }
      if (specifier === "@/features/resources/searches") {
        return {
          getRecentSearches: async () => ({
            entries: [{ id: "search-1", query: "guide sécurité", createdAt: resource.updatedAt }],
          }),
        };
      }
      return require(specifier);
    },
    { searchParams: Promise.resolve({}) },
  );
  assert.match(historyMarkup, /class="category-entry resource-card"/);
  assert.match(historyMarkup, /href="\/resources\/search\?q=guide%20s%C3%A9curit%C3%A9"/);
  assert.match(historyMarkup, /href="\/resources\/searches\/search-1\/delete"/);

  const errorHistoryMarkup = await renderPage(
    "src/app/resources/searches/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "10/11/2026" };
      }
      if (specifier === "@/features/resources/searches") {
        return { getRecentSearches: async () => ({ entries: null }) };
      }
      return require(specifier);
    },
    { searchParams: Promise.resolve({}) },
  );
  assert.match(errorHistoryMarkup, /role="alert"/);
  assert.doesNotMatch(errorHistoryMarkup, /Vous n'avez pas encore fait de recherche/);

  const emptyHistoryMarkup = await renderPage(
    "src/app/resources/searches/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/resource-format") {
        return { formatResourceDate: () => "10/11/2026" };
      }
      if (specifier === "@/features/resources/searches") {
        return { getRecentSearches: async () => ({ entries: [] }) };
      }
      return require(specifier);
    },
    { searchParams: Promise.resolve({}) },
  );
  assert.match(emptyHistoryMarkup, /role="status"/);
  assert.match(emptyHistoryMarkup, /Vous n&#x27;avez pas encore fait de recherche/);
});

test("les erreurs, états vides et adaptations mobiles restent distincts et accessibles", async () => {
  const emptyCategoriesMarkup = await renderPage(
    "src/app/categories/page.tsx",
    (specifier) => {
      if (specifier === "next/link") return mockLink;
      if (specifier === "next/navigation") return mockNavigation();
      if (specifier === "@/features/resources/category-forms") {
        return { CreateCategoryForm: () => createElement("form", null, "Créer") };
      }
      if (specifier === "@/features/resources/category-list") {
        return { CategoryList: () => null };
      }
      if (specifier === "@/features/resources/categories") {
        return {
          getCategoryPageData: async () => ({ canManage: false, categories: [] }),
        };
      }
      return require(specifier);
    },
  );
  assert.match(emptyCategoriesMarkup, /role="status"/);
  assert.match(emptyCategoriesMarkup, /Aucune catégorie n&#x27;est disponible/);

  assert.match(css, /\.confirmation-card\s*\{[^}]*background:\s*#fff/i);
  assert.match(css, /\.button-destructive\s*\{[^}]*background:\s*var\(--error\)/s);
  assert.match(css, /\.resource-indexing-status-processing/);
  assert.match(css, /\.resource-indexing-status-ready/);
  assert.match(css, /\.resource-indexing-status-failed/);
  assert.match(css, /a:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\)/s);
  assert.match(css, /\.button:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\)/s);
  assert.match(css, /\.auth-field input:focus-visible,[\s\S]*?outline:\s*3px solid var\(--focus\)/);
  assert.match(css, /\.category-entry\s*\{[^}]*min-width:\s*0;[\s\S]*?overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.category-row\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\.category-rename-actions\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /@media \(max-width: 480px\)/);
});
