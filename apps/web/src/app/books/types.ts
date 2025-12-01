export type SortOption = "title" | "popular" | "recent" | "rating";
export type ViewMode = "gallery" | "list";
export type BookStatus =
	| "WantToRead"
	| "CurrentlyReading"
	| "Read"
	| "DNF"
	| "None";

export interface BookItemProps {
	id: number;
	title: string;
	subtitle?: string | null;
	coverUrl?: string | null;
	authors: { id: number; name: string }[];
	avgRating: number;
	reviewCount: number;
	addCount: number;
	pageCount?: number | null;
	publisher?: string | null;
	datePublished?: string | null;
	synopsis?: string | null;
	userStatus?: BookStatus;
	isLoggedIn: boolean;
}

export const ITEMS_PER_PAGE = 20;

export const sortOptions = ["title", "popular", "recent", "rating"] as const;
export const viewOptions = ["gallery", "list"] as const;

export const sortLabels: Record<SortOption, string> = {
	title: "A-Z (Title)",
	popular: "Popular",
	recent: "Recently Added",
	rating: "Highest Rated",
};
