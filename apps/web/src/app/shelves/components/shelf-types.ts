export type GridDensity = "compact" | "comfortable" | "spacious";

export type ShelfType = "want" | "current" | "read" | "dnf";

export type SortOption =
	| "dateAdded"
	| "title"
	| "author"
	| "ratingDesc"
	| "ratingAsc"
	| "pagesDesc"
	| "pagesAsc"
	| "progress";

export type RatingOption = "all" | "5" | "4" | "3" | "2" | "1" | "unrated";

export type ViewMode = "grid" | "list";

export interface ShelfBook {
	id: number;
	bookId: number;
	status: string;
	currentPage: number;
	rating: number | null;
	startedAt: Date | null;
	finishedAt: Date | null;
	bookTitle: string;
	bookCoverUrl: string | null;
	bookPageCount: number | null;
	bookAuthors: string | null;
	bookDatePublished: string | null;
}
