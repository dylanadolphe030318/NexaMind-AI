"use client";

import { useActionState } from "react";

import { createResource, updateResource } from "./resource-actions";
import {
  initialResourceFormState,
  type ResourceFormState,
  type ResourceValues,
} from "./resource-validation";

type ResourceAction = (
  previousState: ResourceFormState,
  formData: FormData,
) => Promise<ResourceFormState>;

export function CreateResourceForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  return (
    <ResourceForm
      action={createResource}
      categories={categories}
      initialValues={initialResourceFormState.values}
      submitLabel="Enregistrer la ressource"
    />
  );
}

export function EditResourceForm({
  resourceId,
  categories,
  initialValues,
}: {
  resourceId: string;
  categories: { id: string; name: string }[];
  initialValues: ResourceValues;
}) {
  return (
    <ResourceForm
      action={(previousState, formData) =>
        updateResource(resourceId, previousState, formData)
      }
      categories={categories}
      initialValues={initialValues}
      submitLabel="Enregistrer les modifications"
    />
  );
}

function ResourceForm({
  action,
  categories,
  initialValues,
  submitLabel,
}: {
  action: ResourceAction;
  categories: { id: string; name: string }[];
  initialValues: ResourceValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    (previousState: ResourceFormState, formData: FormData) =>
      action(previousState, formData),
    { ...initialResourceFormState, values: initialValues },
  );
  const { errors, values } = state;

  return (
    // La cl\u00e9 r\u00e9initialise les champs non contr\u00f4l\u00e9s avec les valeurs renvoy\u00e9es par le serveur.
    <form action={formAction} className="auth-form" key={JSON.stringify(values) + state.message} noValidate>
      {state.status === "error" ? (
        <p className="auth-message auth-message-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="auth-field">
        <label htmlFor="resource-title">Titre</label>
        <input
          aria-describedby={errors.title ? "resource-title-error" : undefined}
          aria-invalid={errors.title ? true : undefined}
          autoComplete="off"
          defaultValue={values.title}
          id="resource-title"
          name="title"
          required
        />
        {errors.title ? (
          <p className="field-error" id="resource-title-error">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="auth-field">
        <label htmlFor="resource-body">Texte</label>
        <textarea
          aria-describedby={errors.body ? "resource-body-error" : undefined}
          aria-invalid={errors.body ? true : undefined}
          defaultValue={values.body}
          id="resource-body"
          name="body"
          required
          rows={10}
        />
        {errors.body ? (
          <p className="field-error" id="resource-body-error">
            {errors.body}
          </p>
        ) : null}
      </div>

      <div className="auth-field">
        <label htmlFor="resource-category">Cat&eacute;gorie</label>
        <select
          aria-describedby={errors.categoryId ? "resource-category-error" : undefined}
          aria-invalid={errors.categoryId ? true : undefined}
          defaultValue={values.categoryId}
          id="resource-category"
          name="categoryId"
          required
        >
          <option value="">Choisir une cat&eacute;gorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <p className="field-error" id="resource-category-error">
            {errors.categoryId}
          </p>
        ) : null}
      </div>

      <button className="button auth-submit" disabled={pending} type="submit">
        {pending ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}
