type ResourceCategoryFilterProps = {
  categories: { id: string; name: string }[];
  selectedCategoryId?: string;
};

export function ResourceCategoryFilter({
  categories,
  selectedCategoryId,
}: ResourceCategoryFilterProps) {
  const selectedCategoryExists = categories.some(
    (category) => category.id === selectedCategoryId,
  );

  return (
    <form action="/resources" className="resource-filter-form" method="get">
      <div className="auth-field">
        <label htmlFor="resource-category-filter">Cat&eacute;gorie</label>
        <select
          defaultValue={selectedCategoryId ?? ""}
          id="resource-category-filter"
          name="category"
        >
          <option value="">Toutes les cat&eacute;gories</option>
          {selectedCategoryId && !selectedCategoryExists ? (
            <option value={selectedCategoryId}>
              Cat&eacute;gorie indisponible
            </option>
          ) : null}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <button className="button button-small" type="submit">
        Filtrer
      </button>
    </form>
  );
}
