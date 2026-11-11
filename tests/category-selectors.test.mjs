import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

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

const resourceFormat = loadTypeScript("src/features/resources/resource-format.ts");
const categoryFilter = loadTypeScript(
  "src/features/resources/category-filter.ts",
  (specifier) =>
    specifier === "./resource-format" ? resourceFormat : require(specifier),
);
const resourceCategoryFilter = loadTypeScript(
  "src/features/resources/resource-category-filter.tsx",
);
const categorySelection = loadTypeScript(
  "src/features/resources/category-selection.ts",
);

function findElements(node, predicate, result = []) {
  if (Array.isArray(node)) {
    for (const child of node) {
      findElements(child, predicate, result);
    }
  } else if (isValidElement(node)) {
    if (predicate(node)) {
      result.push(node);
    }
    findElements(node.props.children, predicate, result);
  }
  return result;
}

function createCategoryListHarness() {
  let state = categorySelection.initialCategoryListState;
  const ref = { current: null };
  let focusedCount = 0;
  function RenameCategoryForm() {
    return null;
  }
  const ReactHooks = {
    useEffect(effect) {
      effect();
    },
    useReducer(reducer) {
      return [
        state,
        (action) => {
          state = reducer(state, action);
        },
      ];
    },
    useRef() {
      return ref;
    },
  };
  const { CategoryList } = loadTypeScript(
    "src/features/resources/category-list.tsx",
    (specifier) => {
      if (specifier === "react") {
        return ReactHooks;
      }
      if (specifier === "./category-forms") {
        return { RenameCategoryForm };
      }
      if (specifier === "./category-selection") {
        return categorySelection;
      }
      return require(specifier);
    },
  );
  const categories = [
    { id: "category-a", name: "Sécurité" },
    { id: "category-b", name: "Support client" },
  ];

  function render(canManage = true) {
    return CategoryList({ canManage, categories });
  }

  function focusRenameButton() {
    ref.current = {
      focus() {
        focusedCount += 1;
      },
    };
  }

  return {
    categories,
    focusRenameButton,
    get focusedCount() {
      return focusedCount;
    },
    render,
    RenameCategoryForm,
  };
}

test("le formulaire GET applique une catégorie et restitue le filtre sélectionné", async () => {
  const categoryId = "15a1f2c3-d456-4789-8abc-0123456789ab";
  const calls = [];
  const resources = [{
    id: "resource-1",
    title: "Guide de sécurité",
    updatedAt: "2026-11-10T12:00:00.000Z",
    categoryName: "Sécurité",
    indexingStatus: "ready",
  }];
  const { default: ResourcesPage } = loadTypeScript(
    "src/app/resources/page.tsx",
    (specifier) => {
      if (specifier === "next/link") {
        return function Link({ href, children, ...props }) {
          return createElement("a", { href, ...props }, children);
        };
      }
      if (specifier === "next/navigation") {
        return { redirect: (href) => { throw new Error(`redirect:${href}`); } };
      }
      if (specifier === "@/features/resources/resource-format") {
        return resourceFormat;
      }
      if (specifier === "@/features/resources/category-filter") {
        return categoryFilter;
      }
      if (specifier === "@/features/resources/resource-category-filter") {
        return resourceCategoryFilter;
      }
      if (specifier === "@/features/resources/resource-status") {
        return { getResourceIndexingLabel: () => "Prête" };
      }
      if (specifier === "@/features/resources/resources") {
        return {
          getResourceListData: async (selectedCategoryId) => {
            calls.push(selectedCategoryId);
            return {
              categories: [{ id: categoryId, name: "Sécurité" }],
              resources,
            };
          },
        };
      }
      return require(specifier);
    },
  );

  const markup = renderToStaticMarkup(
    await ResourcesPage({
      searchParams: Promise.resolve({ category: categoryId }),
    }),
  );

  assert.deepEqual(calls, [categoryId]);
  assert.match(markup, /<form[^>]*action="\/resources"[^>]*method="get"/);
  assert.match(markup, /<label[^>]*for="resource-category-filter">Catégorie<\/label>/);
  assert.match(markup, new RegExp(`<option value="${categoryId}" selected="">Sécurité<\\/option>`));
  assert.match(markup, /<button[^>]*type="submit">Filtrer<\/button>/);
  assert.match(markup, /href="\/resources\/resource-1"[^>]*>Guide de sécurité<\/a>/);
});

test("les catégories inconnues restent visibles et les paramètres invalides réinitialisent le filtre", async () => {
  const unknownCategoryId = "25a1f2c3-d456-4789-8abc-0123456789ab";
  const errorCategoryId = "35a1f2c3-d456-4789-8abc-0123456789ab";
  const categoriesErrorId = "45a1f2c3-d456-4789-8abc-0123456789ab";
  const calls = [];
  const { default: ResourcesPage } = loadTypeScript(
    "src/app/resources/page.tsx",
    (specifier) => {
      if (specifier === "next/link") {
        return function Link({ href, children, ...props }) {
          return createElement("a", { href, ...props }, children);
        };
      }
      if (specifier === "next/navigation") {
        return { redirect: (href) => { throw new Error(`redirect:${href}`); } };
      }
      if (specifier === "@/features/resources/resource-format") {
        return resourceFormat;
      }
      if (specifier === "@/features/resources/category-filter") {
        return categoryFilter;
      }
      if (specifier === "@/features/resources/resource-category-filter") {
        return resourceCategoryFilter;
      }
      if (specifier === "@/features/resources/resource-status") {
        return { getResourceIndexingLabel: () => "Prête" };
      }
      if (specifier === "@/features/resources/resources") {
        return {
          getResourceListData: async (selectedCategoryId) => {
            calls.push(selectedCategoryId);
            if (selectedCategoryId === categoriesErrorId) {
              return { categories: [], resources: [], categoriesError: true };
            }
            if (selectedCategoryId === errorCategoryId) {
              return { categories: [], resources: null };
            }
            return {
              categories: [],
              resources: selectedCategoryId ? [] : [{
                id: "resource-1",
                title: "Guide",
                updatedAt: "2026-11-10T12:00:00.000Z",
                categoryName: null,
                indexingStatus: "ready",
              }],
            };
          },
        };
      }
      return require(specifier);
    },
  );

  const unknownMarkup = renderToStaticMarkup(
    await ResourcesPage({
      searchParams: Promise.resolve({ category: unknownCategoryId }),
    }),
  );
  assert.match(unknownMarkup, new RegExp(`<option value="${unknownCategoryId}" selected="">Catégorie indisponible<\\/option>`));
  assert.match(unknownMarkup, /Aucune ressource dans la catégorie/);
  assert.match(unknownMarkup, /href="\/resources"[^>]*>Voir toutes les catégories<\/a>/);

  const malformedMarkup = renderToStaticMarkup(
    await ResourcesPage({
      searchParams: Promise.resolve({ category: "not-a-category" }),
    }),
  );
  assert.deepEqual(calls, [unknownCategoryId, undefined]);
  assert.match(malformedMarkup, /<option value="" selected="">Toutes les catégories<\/option>/);

  const allCategoriesMarkup = renderToStaticMarkup(
    await ResourcesPage({
      searchParams: Promise.resolve({ category: "" }),
    }),
  );
  assert.deepEqual(calls, [unknownCategoryId, undefined, undefined]);
  assert.match(allCategoriesMarkup, /<option value="" selected="">Toutes les catégories<\/option>/);

  const errorMarkup = renderToStaticMarkup(
    await ResourcesPage({
      searchParams: Promise.resolve({ category: errorCategoryId }),
    }),
  );
  assert.deepEqual(calls, [unknownCategoryId, undefined, undefined, errorCategoryId]);
  assert.match(errorMarkup, /role="alert">Les ressources ne sont pas disponibles\./);
  assert.match(errorMarkup, /href="\/resources"[^>]*>Réessayer<\/a>/);

  const categoriesErrorMarkup = renderToStaticMarkup(
    await ResourcesPage({
      searchParams: Promise.resolve({ category: categoriesErrorId }),
    }),
  );
  assert.match(categoriesErrorMarkup, /role="alert">Les catégories ne sont pas disponibles/);
  assert.doesNotMatch(categoriesErrorMarkup, /<select\b/);
});

test("la sélection de catégorie ferme le renommage précédent et restitue le focus après annulation", () => {
  const harness = createCategoryListHarness();
  let tree = harness.render();

  const select = findElements(
    tree,
    (element) => element.type === "select",
  )[0];
  assert.equal(select.props.value, "");
  assert.equal(select.props.id, "selected-category");
  assert.equal(
    findElements(tree, (element) => element.type === "label")[0].props.htmlFor,
    "selected-category",
  );
  assert.equal(
    findElements(select.props.children, (element) => element.type === "option").length,
    3,
  );

  select.props.onChange({ target: { value: "category-a" } });
  tree = harness.render();
  assert.match(
    findElements(tree, (element) => element.type === "p")
      .map((element) => element.props.children)
      .join(" "),
    /Catégorie sélectionnée : Sécurité/,
  );
  let renameButtons = findElements(
    tree,
    (element) => element.type === "button" && element.props.children === "Renommer",
  );
  assert.equal(renameButtons.length, 1);
  assert.equal(
    findElements(
      tree,
      (element) =>
        element.type === "div" &&
        element.props.className === "category-entry resource-card",
    ).length,
    1,
  );
  renameButtons[0].props.ref.current = { focus() {} };
  renameButtons[0].props.onClick();

  tree = harness.render();
  let renameForms = findElements(
    tree,
    (element) => element.type === harness.RenameCategoryForm,
  );
  assert.equal(renameForms.length, 1);
  assert.equal(renameForms[0].props.categoryId, "category-a");

  const changedSelect = findElements(
    tree,
    (element) => element.type === "select",
  )[0];
  changedSelect.props.onChange({ target: { value: "category-b" } });
  tree = harness.render();
  renameForms = findElements(
    tree,
    (element) => element.type === harness.RenameCategoryForm,
  );
  assert.equal(renameForms.length, 0);
  assert.equal(
    findElements(tree, (element) => element.type === "p")
      .map((element) => element.props.children)
      .join(" ")
      .includes("Support client"),
    true,
  );

  renameButtons = findElements(
    tree,
    (element) => element.type === "button" && element.props.children === "Renommer",
  );
  harness.focusRenameButton();
  renameButtons[0].props.onClick();
  tree = harness.render();
  renameForms = findElements(
    tree,
    (element) => element.type === harness.RenameCategoryForm,
  );
  renameForms[0].props.onCancel();
  tree = harness.render();
  assert.equal(harness.focusedCount, 1);
});

test("un membre peut choisir une catégorie sans recevoir d'action de gestion", () => {
  const harness = createCategoryListHarness();
  const tree = harness.render(false);
  const select = findElements(tree, (element) => element.type === "select")[0];

  assert.equal(select.props.id, "selected-category");
  assert.equal(
    findElements(select.props.children, (element) => element.type === "option").length,
    3,
  );
  assert.equal(
    findElements(
      tree,
      (element) => element.type === "button" || element.type === harness.RenameCategoryForm,
    ).length,
    0,
  );
});

test("le filtre de ressource valide les paramètres et applique uniquement une catégorie explicite", () => {
  const categoryId = "15a1f2c3-d456-4789-8abc-0123456789ab";
  const calls = [];
  const query = {
    eq(column, value) {
      calls.push([column, value]);
      return this;
    },
  };

  assert.equal(categoryFilter.parseResourceCategoryParam(categoryId), categoryId);
  assert.equal(categoryFilter.parseResourceCategoryParam(undefined), undefined);
  assert.equal(categoryFilter.parseResourceCategoryParam("not-a-category"), undefined);
  assert.equal(
    categoryFilter.parseResourceCategoryParam([categoryId, categoryId]),
    undefined,
  );
  assert.equal(
    categoryFilter.applyResourceCategoryFilter(query, categoryId),
    query,
  );
  assert.equal(categoryFilter.applyResourceCategoryFilter(query), query);
  assert.deepEqual(calls, [["category_id", categoryId]]);
});
