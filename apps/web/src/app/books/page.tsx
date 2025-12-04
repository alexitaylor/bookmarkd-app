"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { ExternalLink, Globe, Loader2, Plus, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type GridDensity,
	GridDensitySelector,
	gridDensityClasses,
	gridDensityOptions,
	RatingFilter,
	type RatingFilterOption,
	ratingFilterOptions,
	SearchBar,
	type ViewMode,
	ViewModeToggle,
	viewModeOptions,
} from "@/components/books";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";
import { BookCard } from "./components/book-card";
import { BookListItem } from "./components/book-list-item";
import { GenreCombobox } from "./components/genre-combobox";
import { BookCardSkeleton, BookListSkeleton } from "./components/skeletons";
import {
	type BookStatus,
	ITEMS_PER_PAGE,
	type SortOption,
	sortLabels,
	sortOptions,
} from "./types";

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}

export default function BooksPage() {
	const queryClient = useQueryClient();

	// URL query state with nuqs
	const [sort, setSort] = useQueryState(
		"sort",
		parseAsStringLiteral(sortOptions).withDefault("title"),
	);
	const [viewMode, setViewMode] = useQueryState(
		"view",
		parseAsStringLiteral(viewModeOptions).withDefault("grid"),
	);
	const [gridDensity, setGridDensity] = useQueryState(
		"density",
		parseAsStringLiteral(gridDensityOptions).withDefault("comfortable"),
	);
	const [genreId, setGenreId] = useQueryState(
		"genre",
		parseAsString.withDefault(""),
	);
	const [searchQuery, setSearchQuery] = useQueryState(
		"q",
		parseAsString.withDefault(""),
	);
	const [ratingFilter, setRatingFilter] = useQueryState(
		"rating",
		parseAsStringLiteral(ratingFilterOptions).withDefault("all"),
	);

	// Local state for the input (to debounce)
	const [inputValue, setInputValue] = useState(searchQuery ?? "");
	const debouncedSearch = useDebounce(inputValue, 300);

	// Sync debounced value to URL
	useEffect(() => {
		if (debouncedSearch !== (searchQuery ?? "")) {
			setSearchQuery(debouncedSearch || null);
		}
	}, [debouncedSearch, searchQuery, setSearchQuery]);

	// External search state
	const [showExternalResults, setShowExternalResults] = useState(false);
	const [addedBooks, setAddedBooks] = useState<Map<string, number>>(new Map());

	// Reset external results when search changes
	useEffect(() => {
		setShowExternalResults(false);
		setAddedBooks(new Map());
	}, [debouncedSearch]);

	// Get current session
	const { data: session } = authClient.useSession();
	const isLoggedIn = !!session?.user;

	const parsedGenreId = genreId ? Number.parseInt(genreId, 10) : undefined;

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
	} = useInfiniteQuery({
		queryKey: ["books", sort, parsedGenreId, debouncedSearch],
		queryFn: async ({ pageParam = 0 }) => {
			const params = {
				limit: ITEMS_PER_PAGE,
				offset: pageParam,
				genreId: parsedGenreId,
				query: debouncedSearch || undefined,
			};
			let result: Awaited<ReturnType<typeof client.book.getRecent>>;
			switch (sort) {
				case "recent":
					result = await client.book.getRecent(params);
					break;
				case "popular":
					result = await client.book.getPopular(params);
					break;
				case "rating":
					result = await client.book.getByRating(params);
					break;
				case "title":
				default:
					result = await client.book.getAll(params);
					break;
			}
			return result;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			if (!lastPage.hasMore) return undefined;
			return allPages.length * ITEMS_PER_PAGE;
		},
	});

	// External search query (only when user clicks "Search Online Catalog")
	const {
		data: externalResults,
		isLoading: isLoadingExternal,
		refetch: searchExternal,
	} = useQuery({
		queryKey: ["book", "searchExternal", { query: debouncedSearch, limit: 20 }],
		queryFn: () =>
			client.book.searchExternal({ query: debouncedSearch || "", limit: 20 }),
		enabled: false, // Manual trigger only
	});

	// Add book mutation
	const addBookMutation = useMutation({
		mutationFn: (isbn: string) => client.book.addFromISBN({ isbn }),
		onSuccess: (book, isbn) => {
			toast.success(`"${book.title}" added to library`);
			setAddedBooks((prev) => new Map(prev).set(isbn, book.id));
			// Refresh local search results
			queryClient.invalidateQueries({ queryKey: ["books"] });
		},
		onError: (error) => {
			toast.error(`Failed to add book: ${error.message}`);
		},
	});

	const allBooks =
		data?.pages.flatMap((page) => page?.books ?? []).filter(Boolean) ?? [];

	// Apply client-side rating filter
	const filteredBooks = useMemo(() => {
		if (ratingFilter === "all") return allBooks;
		if (ratingFilter === "unrated") {
			return allBooks.filter(
				(book) => !book.avgRating || Number(book.avgRating) === 0,
			);
		}
		const minRating = Number.parseInt(ratingFilter, 10);
		return allBooks.filter((book) => Number(book.avgRating) >= minRating);
	}, [allBooks, ratingFilter]);

	const bookIds = filteredBooks.map((book) => book.id);

	// Fetch user's reading statuses for displayed books (only if logged in)
	const shouldFetchStatuses = isLoggedIn && bookIds.length > 0;
	const { data: userStatuses } = useQuery({
		queryKey: [["userBook", "getStatusForBooks"], { input: { bookIds } }],
		queryFn: () => client.userBook.getStatusForBooks({ bookIds }),
		enabled: shouldFetchStatuses,
		staleTime: 1000 * 60, // 1 minute
	});

	const externalBooks = externalResults?.external ?? [];

	const handleSearchOnline = () => {
		setShowExternalResults(true);
		searchExternal();
	};

	const handleAddBook = (book: {
		isbn: string | null;
		isbn13: string | null;
		title: string;
	}) => {
		const isbn = book.isbn13 || book.isbn;
		if (!isbn) {
			toast.error("Cannot add book: No ISBN available");
			return;
		}
		addBookMutation.mutate(isbn);
	};

	const getAddedBookId = (book: {
		isbn: string | null;
		isbn13: string | null;
	}): number | null => {
		const isbn = book.isbn13 || book.isbn;
		return isbn ? (addedBooks.get(isbn) ?? null) : null;
	};

	const handleResetFilters = () => {
		setInputValue("");
		setSearchQuery(null);
		setGenreId(null);
		setSort("title");
		setViewMode("grid");
		setGridDensity("comfortable");
		setRatingFilter("all");
		setShowExternalResults(false);
		setAddedBooks(new Map());
	};

	// Check if any filters are active (different from defaults)
	const hasActiveFilters =
		inputValue !== "" ||
		genreId !== "" ||
		sort !== "title" ||
		viewMode !== "grid" ||
		gridDensity !== "comfortable" ||
		ratingFilter !== "all";

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Header */}
			<div className="mb-6">
				<h1 className="font-bold text-3xl">Books</h1>
				<p className="mt-1 text-muted-foreground">
					Browse and discover books from the community
				</p>
			</div>

			{/* Search Input */}
			<div className="mb-4">
				<SearchBar
					value={inputValue}
					onChange={setInputValue}
					placeholder="Search books by title..."
				/>
			</div>

			{/* Filters Row */}
			<div className="mb-6 flex flex-wrap items-center gap-2">
				{/* Sort Dropdown */}
				<Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						{sortOptions.map((option) => (
							<SelectItem key={option} value={option}>
								{sortLabels[option]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Genre Filter */}
				<GenreCombobox
					value={parsedGenreId ?? null}
					onChange={(id) => setGenreId(id?.toString() ?? null)}
				/>

				{/* Rating Filter */}
				<RatingFilter
					value={ratingFilter}
					onChange={(v) => setRatingFilter(v as RatingFilterOption)}
				/>

				{/* Divider */}
				<div className="hidden h-10 w-px bg-border sm:block" />

				{/* Grid Density (only in grid view) */}
				{viewMode === "grid" && (
					<GridDensitySelector
						value={gridDensity}
						onChange={(v) => setGridDensity(v as GridDensity)}
					/>
				)}

				{/* View Toggle */}
				<ViewModeToggle
					value={viewMode}
					onChange={(v) => setViewMode(v as ViewMode)}
				/>

				{/* Reset Filters Button */}
				{hasActiveFilters && (
					<>
						<div className="hidden h-10 w-px bg-border sm:block" />
						<Button
							variant="ghost"
							size="sm"
							onClick={handleResetFilters}
							className="h-10 text-muted-foreground"
						>
							<RotateCcw className="mr-1 h-4 w-4" />
							Reset
						</Button>
					</>
				)}
			</div>

			{/* Results count when filtering */}
			{(ratingFilter !== "all" || debouncedSearch || parsedGenreId) && (
				<p className="mb-4 text-muted-foreground text-sm">
					Showing {filteredBooks.length} books
					{ratingFilter !== "all" && ratingFilter !== "unrated" && (
						<span> with {ratingFilter}+ stars</span>
					)}
					{ratingFilter === "unrated" && <span> without ratings</span>}
				</p>
			)}

			{/* Loading State */}
			{isLoading &&
				(viewMode === "grid" ? (
					<div className={cn("grid", gridDensityClasses[gridDensity])}>
						{Array.from({ length: 10 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: only have index for key
							<BookCardSkeleton key={i} />
						))}
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{Array.from({ length: 8 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: only have index for key
							<BookListSkeleton key={i} />
						))}
					</div>
				))}

			{/* Error State */}
			{isError && (
				<div className="py-12 text-center">
					<p className="text-muted-foreground">
						Failed to load books. Please try again later.
					</p>
				</div>
			)}

			{/* Books Display */}
			{!isLoading &&
				!isError &&
				(filteredBooks.length === 0 ? (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">
							{debouncedSearch
								? `No books found for "${debouncedSearch}".`
								: parsedGenreId
									? "No books found in this genre. Try selecting a different genre."
									: ratingFilter !== "all"
										? "No books match your rating filter."
										: "No books found. Start adding books to see them here!"}
						</p>
					</div>
				) : (
					<>
						{viewMode === "grid" ? (
							<div className={cn("grid", gridDensityClasses[gridDensity])}>
								{filteredBooks.map((book) => (
									<BookCard
										key={book.id}
										id={book.id}
										title={book.title}
										subtitle={book.subtitle}
										coverUrl={book.coverUrl}
										authors={book.authors}
										avgRating={Number(book.avgRating)}
										reviewCount={Number(book.reviewCount)}
										addCount={Number(book.addCount)}
										pageCount={book.pageCount}
										userStatus={
											userStatuses?.[book.id]?.status as BookStatus | undefined
										}
										isLoggedIn={isLoggedIn}
									/>
								))}
							</div>
						) : (
							<div className="flex flex-col gap-3">
								{filteredBooks.map((book) => (
									<BookListItem
										key={book.id}
										id={book.id}
										title={book.title}
										subtitle={book.subtitle}
										coverUrl={book.coverUrl}
										authors={book.authors}
										avgRating={Number(book.avgRating)}
										reviewCount={Number(book.reviewCount)}
										addCount={Number(book.addCount)}
										pageCount={book.pageCount}
										publisher={book.publisher}
										datePublished={book.datePublished}
										synopsis={book.synopsis}
										userStatus={
											userStatuses?.[book.id]?.status as BookStatus | undefined
										}
										isLoggedIn={isLoggedIn}
									/>
								))}
							</div>
						)}

						{/* Load More Button */}
						{hasNextPage && (
							<div className="mt-8 flex justify-center">
								<Button
									variant="outline"
									size="lg"
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
								>
									{isFetchingNextPage ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Loading...
										</>
									) : (
										"Load More"
									)}
								</Button>
							</div>
						)}
					</>
				))}

			{/* Search Online Catalog Section */}
			{debouncedSearch && debouncedSearch.length >= 2 && (
				<>
					<hr className="my-8" />
					<div className="text-center">
						<p className="mb-4 text-muted-foreground">
							Can&apos;t find what you&apos;re looking for?
						</p>
						{!showExternalResults ? (
							<Button variant="outline" onClick={handleSearchOnline}>
								<Globe className="mr-2 h-4 w-4" />
								Search Online Catalog
							</Button>
						) : isLoadingExternal ? (
							<div className="py-4">
								<Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
								<p className="mt-2 text-muted-foreground text-sm">
									Searching online catalog...
								</p>
							</div>
						) : externalBooks.length > 0 ? (
							<div className="mt-4 text-left">
								<p className="mb-4 text-muted-foreground text-sm">
									Found {externalBooks.length} book
									{externalBooks.length !== 1 ? "s" : ""} in online catalog
								</p>
								<div className="space-y-3">
									{externalBooks.map((book, index) => {
										const isbn = book.isbn13 || book.isbn;
										const addedBookId = getAddedBookId(book);
										const isAdded = addedBookId !== null;
										const isAdding =
											addBookMutation.isPending &&
											addBookMutation.variables === isbn;

										return (
											<div
												key={isbn || index}
												className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
											>
												{/* Cover */}
												<div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-muted">
													{book.coverUrl ? (
														<Image
															src={book.coverUrl}
															alt={book.title}
															fill
															className="object-cover"
															sizes="44px"
														/>
													) : (
														<div className="flex h-full items-center justify-center text-muted-foreground text-xs">
															No cover
														</div>
													)}
												</div>

												{/* Info */}
												<div className="min-w-0 flex-1">
													<p className="truncate font-medium text-sm">
														{book.title}
													</p>
													{book.authors.length > 0 && (
														<p className="truncate text-muted-foreground text-xs">
															{book.authors.join(", ")}
														</p>
													)}
													<p className="truncate text-muted-foreground text-xs">
														{[
															book.publisher,
															book.datePublished,
															book.pageCount ? `${book.pageCount} pages` : null,
														]
															.filter(Boolean)
															.join(" • ")}
													</p>
												</div>

												{/* Add Button or Link */}
												{isAdded ? (
													<Link
														href={`/books/${addedBookId}` as "/"}
														className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
													>
														<ExternalLink className="h-4 w-4" />
														<span className="sr-only">View book</span>
													</Link>
												) : (
													<Button
														variant="outline"
														size="sm"
														disabled={!isbn || isAdding}
														onClick={() => handleAddBook(book)}
														className="shrink-0"
													>
														{isAdding ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<>
																<Plus className="mr-1 h-4 w-4" />
																Add
															</>
														)}
													</Button>
												)}
											</div>
										);
									})}
								</div>
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								No books found in online catalog. Try different keywords.
							</p>
						)}
					</div>
				</>
			)}
		</div>
	);
}
