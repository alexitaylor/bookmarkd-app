"use client";

import { BookmarkPlus, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import {
	type GridDensity,
	gridDensityOptions,
	type RatingFilterOption,
	ratingFilterOptions,
	SearchBar,
	type ViewMode,
	viewModeOptions,
} from "@/components/books";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BookRecommendations } from "./book-recommendations";
import { ShelfBooksDisplay } from "./shelf-books-display";
import { ShelfBulkActions } from "./shelf-bulk-actions";
import { ShelfFilters } from "./shelf-filters";
import type { ShelfBook, ShelfType, SortOption } from "./shelf-types";
import { exportToCSV, exportToJSON, getYearOptions } from "./shelf-utils";

const shelfConfig = {
	want: {
		icon: BookmarkPlus,
		emptyTitle: "Your Want to Read list is empty",
		emptyDescription:
			"Add books you discover to keep track of what you'd like to read later.",
	},
	current: {
		icon: BookOpen,
		emptyTitle: "You're not reading anything right now",
		emptyDescription:
			"Start a new book from your Want to Read list or browse for something new.",
	},
	read: {
		icon: CheckCircle2,
		emptyTitle: "You haven't finished any books yet",
		emptyDescription:
			"Mark books as read when you finish them to build your reading history.",
	},
	dnf: {
		icon: XCircle,
		emptyTitle: "No books marked as Did Not Finish",
		emptyDescription: "Books you've decided not to finish will appear here.",
	},
};

// Sort options for nuqs
const sortOptions = [
	"dateAdded",
	"title",
	"author",
	"ratingDesc",
	"ratingAsc",
	"pagesDesc",
	"pagesAsc",
	"progress",
] as const;

interface ShelfGridProps {
	books: ShelfBook[];
	isLoading: boolean;
	shelfType: ShelfType;
}

export function ShelfGrid({ books, isLoading, shelfType }: ShelfGridProps) {
	// Query state for all filters
	const [sortBy, setSortBy] = useQueryState(
		"sort",
		parseAsStringLiteral(sortOptions).withDefault("dateAdded"),
	);
	const [searchQuery, setSearchQuery] = useQueryState(
		"q",
		parseAsString.withDefault(""),
	);
	const [ratingFilter, setRatingFilter] = useQueryState(
		"rating",
		parseAsStringLiteral(ratingFilterOptions).withDefault("all"),
	);
	const [yearFilter, setYearFilter] = useQueryState(
		"year",
		parseAsString.withDefault("all"),
	);
	const [viewMode, setViewMode] = useQueryState(
		"view",
		parseAsStringLiteral(viewModeOptions).withDefault("grid"),
	);
	const [gridDensity, setGridDensity] = useQueryState(
		"density",
		parseAsStringLiteral(gridDensityOptions).withDefault("comfortable"),
	);

	// Selection state
	const [isSelectMode, setIsSelectMode] = useState(false);
	const [selectedBookIds, setSelectedBookIds] = useState<Set<number>>(
		new Set(),
	);

	const config = shelfConfig[shelfType];

	// Get available years for the year filter (only for "read" shelf)
	const availableYears = useMemo(() => getYearOptions(books), [books]);

	const filteredAndSortedBooks = useMemo(() => {
		let filtered = [...books];

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(book) =>
					book.bookTitle.toLowerCase().includes(query) ||
					book.bookAuthors?.toLowerCase().includes(query),
			);
		}

		// Apply rating filter
		if (ratingFilter !== "all") {
			if (ratingFilter === "unrated") {
				filtered = filtered.filter((book) => !book.rating);
			} else {
				const rating = Number.parseInt(ratingFilter, 10);
				filtered = filtered.filter((book) => book.rating === rating);
			}
		}

		// Apply year filter (only for "read" shelf)
		if (yearFilter !== "all" && shelfType === "read") {
			const year = Number.parseInt(yearFilter, 10);
			filtered = filtered.filter((book) => {
				if (!book.finishedAt) return false;
				return new Date(book.finishedAt).getFullYear() === year;
			});
		}

		// Apply sorting
		switch (sortBy) {
			case "title":
				filtered.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle));
				break;
			case "author":
				filtered.sort((a, b) => {
					const authorA = a.bookAuthors || "";
					const authorB = b.bookAuthors || "";
					return authorA.localeCompare(authorB);
				});
				break;
			case "ratingDesc":
				filtered.sort((a, b) => {
					const ratingA = a.rating ?? 0;
					const ratingB = b.rating ?? 0;
					return ratingB - ratingA; // Highest first
				});
				break;
			case "ratingAsc":
				filtered.sort((a, b) => {
					const ratingA = a.rating ?? 0;
					const ratingB = b.rating ?? 0;
					return ratingA - ratingB; // Lowest first
				});
				break;
			case "pagesDesc":
				filtered.sort((a, b) => {
					const pagesA = a.bookPageCount ?? 0;
					const pagesB = b.bookPageCount ?? 0;
					return pagesB - pagesA; // Longest first
				});
				break;
			case "pagesAsc":
				filtered.sort((a, b) => {
					const pagesA = a.bookPageCount ?? 0;
					const pagesB = b.bookPageCount ?? 0;
					return pagesA - pagesB; // Shortest first
				});
				break;
			case "progress":
				filtered.sort((a, b) => {
					const progressA =
						a.bookPageCount && a.bookPageCount > 0
							? (a.currentPage / a.bookPageCount) * 100
							: 0;
					const progressB =
						b.bookPageCount && b.bookPageCount > 0
							? (b.currentPage / b.bookPageCount) * 100
							: 0;
					return progressB - progressA; // Highest progress first
				});
				break;
			case "dateAdded":
			default:
				// Already sorted by updatedAt from API, reverse for newest first
				filtered.reverse();
				break;
		}

		return filtered;
	}, [books, sortBy, searchQuery, ratingFilter, yearFilter, shelfType]);

	// Selection helpers
	const toggleBookSelection = (bookId: number) => {
		setSelectedBookIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(bookId)) {
				newSet.delete(bookId);
			} else {
				newSet.add(bookId);
			}
			return newSet;
		});
	};

	const selectAllVisible = () => {
		setSelectedBookIds(new Set(filteredAndSortedBooks.map((b) => b.id)));
	};

	const clearSelection = () => {
		setSelectedBookIds(new Set());
	};

	const exitSelectMode = () => {
		setIsSelectMode(false);
		setSelectedBookIds(new Set());
	};

	// Get books to export based on selection
	const getBooksToExport = () =>
		selectedBookIds.size > 0
			? filteredAndSortedBooks.filter((b) => selectedBookIds.has(b.id))
			: filteredAndSortedBooks;

	const handleExportCSV = () => {
		exportToCSV(getBooksToExport(), shelfType);
	};

	const handleExportJSON = () => {
		exportToJSON(getBooksToExport(), shelfType);
	};

	const resetFilters = () => {
		setSearchQuery("");
		setSortBy("dateAdded");
		setRatingFilter("all");
		setYearFilter("all");
	};

	const hasActiveFilters =
		searchQuery.trim() !== "" ||
		sortBy !== "dateAdded" ||
		ratingFilter !== "all" ||
		yearFilter !== "all";

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Skeleton className="h-10 w-full sm:w-[250px]" />
					<div className="flex gap-2">
						<Skeleton className="h-10 w-[120px]" />
						<Skeleton className="h-10 w-[150px]" />
					</div>
				</div>
				<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{Array.from({ length: 10 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-[2/3] w-full rounded-lg" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-8 w-24" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (books.length === 0) {
		return (
			<EmptyState
				icon={config.icon}
				title={config.emptyTitle}
				description={config.emptyDescription}
				action={{
					label: "Browse Books",
					href: "/books",
				}}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{/* Reading Calendar & Challenge (only for "read" shelf) */}
			{/* TODO these are cool components but should not be included in the MVP. Keep these here for not commented out. */}
			{/*{shelfType === "read" && (*/}
			{/*	<div className="mb-6 grid gap-6 lg:grid-cols-2">*/}
			{/*		<ReadingChallenge />*/}
			{/*		<ReadingCalendar />*/}
			{/*	</div>*/}
			{/*)}*/}

			{/* Book Recommendations (for "want" shelf) */}
			{shelfType === "want" && (
				<div className="mb-6">
					<BookRecommendations />
				</div>
			)}

			{/* Search Row */}
			<SearchBar value={searchQuery} onChange={setSearchQuery} />

			{/* Filters and Sort Row */}
			<ShelfFilters
				sortBy={sortBy}
				onSortChange={(value) => setSortBy(value as SortOption)}
				ratingFilter={ratingFilter}
				onRatingFilterChange={(value) =>
					setRatingFilter(value as RatingFilterOption)
				}
				yearFilter={yearFilter}
				onYearFilterChange={setYearFilter}
				availableYears={availableYears}
				viewMode={viewMode}
				onViewModeChange={(value) => setViewMode(value as ViewMode)}
				gridDensity={gridDensity}
				onGridDensityChange={(value) => setGridDensity(value as GridDensity)}
				isSelectMode={isSelectMode}
				onToggleSelectMode={() => {
					if (isSelectMode) {
						exitSelectMode();
					} else {
						setIsSelectMode(true);
					}
				}}
				onExportCSV={handleExportCSV}
				onExportJSON={handleExportJSON}
				shelfType={shelfType}
				filteredBooks={filteredAndSortedBooks}
				hasActiveFilters={hasActiveFilters}
				onResetFilters={resetFilters}
			/>

			{/* Bulk Action Toolbar - shown when in select mode */}
			{isSelectMode && (
				<ShelfBulkActions
					selectedCount={selectedBookIds.size}
					totalCount={filteredAndSortedBooks.length}
					onSelectAll={selectAllVisible}
					onDeselectAll={clearSelection}
					onExportCSV={handleExportCSV}
					onExportJSON={handleExportJSON}
				/>
			)}

			{/* Results count when filtering */}
			{hasActiveFilters && (
				<p className="text-muted-foreground text-sm">
					Showing {filteredAndSortedBooks.length} of {books.length} books
				</p>
			)}

			{/* Books Grid/List */}
			<ShelfBooksDisplay
				books={filteredAndSortedBooks}
				viewMode={viewMode}
				gridDensity={gridDensity}
				shelfType={shelfType}
				isSelectMode={isSelectMode}
				selectedBookIds={selectedBookIds}
				onToggleBookSelection={toggleBookSelection}
				onResetFilters={resetFilters}
			/>
		</div>
	);
}
