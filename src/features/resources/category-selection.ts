export type CategoryListState = {
  selectedCategoryId: string;
  editingCategoryId: string | null;
  savedMessage: string | null;
  restoreRenameFocus: boolean;
};

export type CategoryListAction =
  | { type: "select"; categoryId: string }
  | { type: "start-renaming"; categoryId: string }
  | { type: "cancel-renaming" }
  | { type: "rename-saved"; message: string }
  | { type: "rename-focus-restored" };

export const initialCategoryListState: CategoryListState = {
  selectedCategoryId: "",
  editingCategoryId: null,
  savedMessage: null,
  restoreRenameFocus: false,
};

export function categoryListReducer(
  state: CategoryListState,
  action: CategoryListAction,
): CategoryListState {
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedCategoryId: action.categoryId,
        editingCategoryId: null,
        savedMessage: null,
        restoreRenameFocus: false,
      };
    case "start-renaming":
      return {
        ...state,
        editingCategoryId: action.categoryId,
        savedMessage: null,
        restoreRenameFocus: false,
      };
    case "cancel-renaming":
      return {
        ...state,
        editingCategoryId: null,
        restoreRenameFocus: true,
      };
    case "rename-saved":
      return {
        ...state,
        editingCategoryId: null,
        savedMessage: action.message,
        restoreRenameFocus: false,
      };
    case "rename-focus-restored":
      return { ...state, restoreRenameFocus: false };
  }
}
