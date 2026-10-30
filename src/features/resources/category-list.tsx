"use client";

import { useState } from "react";

import { RenameCategoryForm } from "./category-forms";
import type { Category } from "./categories";

export function CategoryList({
  categories,
  canManage,
}: {
  categories: Category[];
  canManage: boolean;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );

  return (
    <>
      <fieldset className="category-choice">
        <legend>Choisissez une cat&eacute;gorie</legend>
        <ul className="category-list">
          {categories.map((category) => {
            const inputId = "choose-category-" + category.id;

            return (
              <li className="category-entry" key={category.id}>
                <div className="category-option">
                  <input
                    checked={selectedCategoryId === category.id}
                    id={inputId}
                    name="selected-category"
                    onChange={() => setSelectedCategoryId(category.id)}
                    type="radio"
                    value={category.id}
                  />
                  <label className="category-name" htmlFor={inputId}>
                    {category.name}
                  </label>
                </div>
                {canManage ? (
                  <RenameCategoryForm
                    categoryId={category.id}
                    categoryName={category.name}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </fieldset>
      <p aria-live="polite" className="category-selection">
        {selectedCategory
          ? "Cat\u00e9gorie s\u00e9lectionn\u00e9e : " + selectedCategory.name
          : "Aucune cat\u00e9gorie s\u00e9lectionn\u00e9e."}
      </p>
    </>
  );
}
