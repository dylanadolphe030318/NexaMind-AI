"use client";

import { useEffect, useReducer, useRef } from "react";

import { RenameCategoryForm } from "./category-forms";
import {
  categoryListReducer,
  initialCategoryListState,
} from "./category-selection";
import type { Category } from "./categories";

export function CategoryList({
  categories,
  canManage,
}: {
  categories: Category[];
  canManage: boolean;
}) {
  const [state, dispatch] = useReducer(
    categoryListReducer,
    initialCategoryListState,
  );
  const renameButtonRef = useRef<HTMLButtonElement>(null);
  const selectedCategory = categories.find(
    (category) => category.id === state.selectedCategoryId,
  );

  useEffect(() => {
    if (state.restoreRenameFocus) {
      renameButtonRef.current?.focus();
      dispatch({ type: "rename-focus-restored" });
    }
  }, [state.restoreRenameFocus]);

  return (
    <>
      {state.savedMessage ? (
        <p className="auth-message auth-message-success" role="status">
          {state.savedMessage}
        </p>
      ) : null}
      <div className="auth-field category-select-field">
        <label htmlFor="selected-category">Cat&eacute;gorie</label>
        <select
          id="selected-category"
          onChange={(event) =>
            dispatch({ type: "select", categoryId: event.target.value })
          }
          value={state.selectedCategoryId}
        >
          <option value="">Choisissez une cat&eacute;gorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      {selectedCategory ? (
        <div className="category-entry resource-card">
          <div className="category-row">
            <p className="category-name">{selectedCategory.name}</p>
            {canManage && state.editingCategoryId !== selectedCategory.id ? (
              <button
                className="button button-small button-secondary"
                onClick={() =>
                  dispatch({
                    type: "start-renaming",
                    categoryId: selectedCategory.id,
                  })
                }
                ref={renameButtonRef}
                type="button"
              >
                Renommer
              </button>
            ) : null}
          </div>
          {canManage && state.editingCategoryId === selectedCategory.id ? (
            <RenameCategoryForm
              categoryId={selectedCategory.id}
              categoryName={selectedCategory.name}
              onCancel={() => dispatch({ type: "cancel-renaming" })}
              onSaved={(message) =>
                dispatch({ type: "rename-saved", message })
              }
            />
          ) : null}
        </div>
      ) : null}
      <p aria-live="polite" className="category-selection">
        {selectedCategory
          ? "Cat\u00e9gorie s\u00e9lectionn\u00e9e : " + selectedCategory.name
          : "Aucune cat\u00e9gorie s\u00e9lectionn\u00e9e."}
      </p>
    </>
  );
}
