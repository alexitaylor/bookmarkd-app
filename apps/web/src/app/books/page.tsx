"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	Globe,
	Grid3X3,
	List,
	Loader2,
	Plus,
	RotateCcw,
	Search,
	X,
	ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
	useQueryState,
} from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	type SortOption,
	ITEMS_PER_PAGE,
	sortLabels,
	sortOptions,
	viewOptions,
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
		parseAsStringLiteral(viewOptions).withDefault("gallery"),
	);
	const [genreId, setGenreId] = useQueryState("genre", parseAsInteger);
	const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString);

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

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
	} = useInfiniteQuery({
		queryKey: ["books", sort, genreId, debouncedSearch],
		queryFn: async ({ pageParam = 0 }) => {
			const params = {
				limit: ITEMS_PER_PAGE,
				offset: pageParam,
				genreId: genreId ?? undefined,
				query: debouncedSearch || undefined,
			};
			let result;
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
	const bookIds = allBooks.map((book) => book.id);

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
		return isbn ? addedBooks.get(isbn) ?? null : null;
	};

	const handleClearSearch = () => {
		setInputValue("");
		setSearchQuery(null);
	};

	const handleResetFilters = () => {
		setInputValue("");
		setSearchQuery(null);
		setGenreId(null);
		setSort("title");
		setViewMode("gallery");
		setShowExternalResults(false);
		setAddedBooks(new Map());
	};

	// Check if any filters are active (different from defaults)
	const hasActiveFilters =
		inputValue !== "" ||
		genreId !== null ||
		sort !== "title" ||
		viewMode !== "gallery";

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-3xl">Books</h1>
					<p className="mt-1 text-muted-foreground">
						Browse and discover books from the community
					</p>
				</div>

				{/* Controls */}
				<div className="flex flex-wrap items-center gap-2">
					{/* View Toggle */}
					<div className="flex rounded-md border">
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								"rounded-r-none px-3",
								viewMode === "gallery" && "bg-muted",
							)}
							onClick={() => setViewMode("gallery")}
							aria-label="Gallery view"
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								"rounded-l-none px-3",
								viewMode === "list" && "bg-muted",
							)}
							onClick={() => setViewMode("list")}
							aria-label="List view"
						>
							<List className="h-4 w-4" />
						</Button>
					</div>

					{/* Genre Filter */}
					<GenreCombobox value={genreId} onChange={setGenreId} />

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

					{/* Reset Filters Button */}
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleResetFilters}
							className="text-muted-foreground"
						>
							<RotateCcw className="mr-1 h-4 w-4" />
							Reset
						</Button>
					)}
				</div>
			</div>

			{/* Search Input */}
			<div className="relative mb-6">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search books by title..."
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					className="pl-10 pr-10"
				/>
				{inputValue && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
						onClick={handleClearSearch}
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Clear search</span>
					</Button>
				)}
			</div>

			{/* Loading State */}
			{isLoading &&
				(viewMode === "gallery" ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{Array.from({ length: 10 }).map((_, i) => (
							<BookCardSkeleton key={i} />
						))}
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{Array.from({ length: 8 }).map((_, i) => (
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
				(allBooks.length === 0 ? (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">
							{debouncedSearch
								? `No books found for "${debouncedSearch}".`
								: genreId
									? "No books found in this genre. Try selecting a different genre."
									: "No books found. Start adding books to see them here!"}
						</p>
					</div>
				) : (
					<>
						{viewMode === "gallery" ? (
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
								{allBooks.map((book) => (
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
								{allBooks.map((book) => (
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
						<p className="text-muted-foreground mb-4">
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
								<p className="mt-2 text-sm text-muted-foreground">
									Searching online catalog...
								</p>
							</div>
						) : externalBooks.length > 0 ? (
							<div className="mt-4 text-left">
								<p className="mb-4 text-sm text-muted-foreground">
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
														<div className="flex h-full items-center justify-center text-xs text-muted-foreground">
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
														<p className="truncate text-xs text-muted-foreground">
															{book.authors.join(", ")}
														</p>
													)}
													<p className="truncate text-xs text-muted-foreground">
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
														className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
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
							<p className="text-sm text-muted-foreground">
								No books found in online catalog. Try different keywords.
							</p>
						)}
					</div>
				</>
			)}
		</div>
	);
}
