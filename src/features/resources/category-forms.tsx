"use client";

import { useActionState, useState } from "react";

import { createCategory, renameCategory } from "./actions";
import {
  initialCategoryActionState,
  type CategoryActionState,
} from "./category-validation";

export function CreateCategoryForm() {
  const [name, setName] = useState("");
  const [state, formAction, pending] = useActionState(
    async (previousState: CategoryActionState, formData: FormData) => {
      const nextState = await createCategory(previousState, formData);
      if (nextState.status === "success") {
        setName("");
      }
      return nextState;
    },
    initialCategoryActionState,
  );

  return (
    <form action={formAction} className="auth-form category-create-form">
      <div className="auth-field">
        <label htmlFor="new-category-name">Nom de la cat&eacute;gorie</label>
        <input
          autoComplete="off"
          id="new-category-name"
          name="name"
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </div>
      <button className="button auth-submit" disabled={pending} type="submit">
        {pending ? "Cr\u00e9ation..." : "Cr\u00e9er la cat\u00e9gorie"}
      </button>
      {state.status !== "idle" ? (
        <p
          className={
            state.status === "error"
              ? "auth-message auth-message-error"
              : "auth-message auth-message-success"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function RenameCategoryForm({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const [name, setName] = useState(categoryName);
  const renameAction = renameCategory.bind(null, categoryId);
  const [state, formAction, pending] = useActionState(
    async (previousState: CategoryActionState, formData: FormData) => {
      const nextState = await renameAction(previousState, formData);
      if (nextState.status === "success") {
        setName((formData.get("name") as string).trim());
      }
      return nextState;
    },
    initialCategoryActionState,
  );
  const inputId = "rename-category-" + categoryId;

  return (
    <form action={formAction} className="category-rename-form">
      <div className="auth-field">
        <label htmlFor={inputId}>Renommer {categoryName}</label>
        <input
          autoComplete="off"
          id={inputId}
          name="name"
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </div>
      <button className="button button-small" disabled={pending} type="submit">
        {pending ? "Enregistrement..." : "Renommer"}
      </button>
      {state.status !== "idle" ? (
        <p
          className={
            state.status === "error"
              ? "auth-message auth-message-error"
              : "auth-message auth-message-success"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
