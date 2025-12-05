// Main variant components

export type { BookSearchDialogProps } from "./book-search-dialog";
export { BookSearchDialog } from "./book-search-dialog";
export type { BookSearchDropdownProps } from "./book-search-dropdown";
export { BookSearchDropdown } from "./book-search-dropdown";
export type { BookSearchInputProps } from "./book-search-input";
// Shared components (for custom implementations)
export { BookSearchInput } from "./book-search-input";
export type { BookSearchResultsProps } from "./book-search-results";
export { BookSearchResults } from "./book-search-results";
export type {
	ExternalBooksListProps,
	ExternalSearchSectionProps,
} from "./external-books-list";
export {
	ExternalBooksList,
	ExternalSearchSection,
} from "./external-books-list";
export type {
	AddedBookInfo,
	BookStatus,
	ExternalBook,
	LocalBook,
	UseBookSearchOptions,
	UseBookSearchReturn,
} from "./hooks/use-book-search";
// Shared hook
export { useBookSearch } from "./hooks/use-book-search";
