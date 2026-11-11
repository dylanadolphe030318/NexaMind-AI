import { isUuid } from "./resource-format";

export function parseResourceCategoryParam(
  category: string | string[] | undefined,
): string | undefined {
  return typeof category === "string" && isUuid(category)
    ? category
    : undefined;
}

export function applyResourceCategoryFilter<
  TQuery extends { eq(column: "category_id", value: string): TQuery },
>(
  query: TQuery,
  categoryId?: string,
): TQuery {
  if (!categoryId) {
    return query;
  }

  return query.eq("category_id", categoryId);
}
