// Re-export shared types
export type {
	GridDensity,
	RatingFilterOption as RatingOption,
	ViewMode,
} from "@/components/books";

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
	bookSynopsis: string | null;
}
