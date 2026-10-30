export type CategoryNameResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function parseCategoryName(
  value: FormDataEntryValue | null,
): CategoryNameResult {
  if (typeof value !== "string") {
    return { ok: false, message: "Saisissez un nom de cat\u00e9gorie." };
  }

  const name = value.trim();
  if (!name) {
    return { ok: false, message: "Saisissez un nom de cat\u00e9gorie." };
  }

  return { ok: true, value: name };
}

export type CategoryActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialCategoryActionState: CategoryActionState = {
  status: "idle",
  message: "",
};
