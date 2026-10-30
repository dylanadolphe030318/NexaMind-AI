export type ResourceFieldErrors = {
  title?: string;
  body?: string;
  categoryId?: string;
};

export type ResourceValues = {
  title: string;
  body: string;
  categoryId: string;
};

export type ResourceFormState = {
  status: "idle" | "error";
  message: string;
  errors: ResourceFieldErrors;
  values: ResourceValues;
};

export const initialResourceFormState: ResourceFormState = {
  status: "idle",
  message: "",
  errors: {},
  values: { title: "", body: "", categoryId: "" },
};

export type ResourceParseResult =
  | { ok: true; values: ResourceValues }
  | { ok: false; errors: ResourceFieldErrors; values: ResourceValues };

export const TITLE_MAX_LENGTH = 200;
export const BODY_MAX_LENGTH = 20000;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function parseResourceForm(formData: {
  get(name: string): FormDataEntryValue | null;
}): ResourceParseResult {
  const rawValues: ResourceValues = {
    title: text(formData.get("title")),
    body: text(formData.get("body")),
    categoryId: text(formData.get("categoryId")),
  };
  const values: ResourceValues = {
    title: rawValues.title.trim(),
    body: rawValues.body.trim(),
    categoryId: rawValues.categoryId.trim(),
  };
  const errors: ResourceFieldErrors = {};

  if (!values.title) {
    errors.title = "Saisissez un titre.";
  } else if (values.title.length > TITLE_MAX_LENGTH) {
    errors.title = `Le titre ne doit pas d\u00e9passer ${TITLE_MAX_LENGTH} caract\u00e8res.`;
  }

  if (!values.body) {
    errors.body = "Saisissez le texte de la ressource.";
  } else if (values.body.length > BODY_MAX_LENGTH) {
    errors.body = `Le texte ne doit pas d\u00e9passer ${BODY_MAX_LENGTH} caract\u00e8res.`;
  }

  if (!values.categoryId) {
    errors.categoryId = "Choisissez une cat\u00e9gorie.";
  } else if (!uuidPattern.test(values.categoryId)) {
    errors.categoryId = "Cette cat\u00e9gorie n\u2019est pas disponible.";
  }

  if (errors.title || errors.body || errors.categoryId) {
    // On conserve la saisie brute pour ne rien effacer.
    return { ok: false, errors, values: rawValues };
  }

  return { ok: true, values };
}
