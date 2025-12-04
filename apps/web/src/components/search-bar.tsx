"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Check,
	ExternalLink,
	Globe,
	Loader2,
	Plus,
	Search,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BookCard } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

interface SearchBarProps {
	className?: string;
	placeholder?: string;
}

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

interface ExternalBook {
	title: string;
	subtitle: string | null;
	isbn: string | null;
	isbn13: string | null;
	synopsis: string | null;
	coverUrl: string | null;
	publisher: string | null;
	pageCount: number | null;
	language: string | null;
	datePublished: string | null;
	authors: string[];
	genres: string[];
}

export function SearchBar({
	className,
	placeholder = "Search for books, authors, or ISBN...",
}: SearchBarProps) {
	const [query, setQuery] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [showExternalResults, setShowExternalResults] = useState(false);
	const [addedBooks, setAddedBooks] = useState<Map<string, number>>(new Map()); // ISBN -> book ID
	const containerRef = useRef<HTMLDivElement>(null);
	const queryClient = useQueryClient();
	const debouncedQuery = useDebounce(query.trim(), 300);

	const shouldSearch = debouncedQuery.length >= 2;

	// Local search
	const {
		data: searchResults,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ["book", "search", { query: debouncedQuery, limit: 12 }],
		queryFn: () => client.book.search({ query: debouncedQuery, limit: 12 }),
		enabled: shouldSearch,
	});

	// External search (only when user clicks "Search Online Catalog")
	const {
		data: externalResults,
		isLoading: isLoadingExternal,
		refetch: searchExternal,
	} = useQuery({
		queryKey: ["book", "searchExternal", { query: debouncedQuery, limit: 20 }],
		queryFn: () =>
			client.book.searchExternal({ query: debouncedQuery, limit: 20 }),
		enabled: false, // Manual trigger only
	});

	// Add book mutation
	const addBookMutation = useMutation({
		mutationFn: (isbn: string) => client.book.addFromISBN({ isbn }),
		onSuccess: (book, isbn) => {
			toast.success(`"${book.title}" added to library`);
			setAddedBooks((prev) => new Map(prev).set(isbn, book.id));
			// Refresh local search results
			queryClient.invalidateQueries({ queryKey: [["book"]] });
		},
		onError: (error) => {
			toast.error(`Failed to add book: ${error.message}`);
		},
	});

	const showResults = isFocused && debouncedQuery.length >= 2;
	const localResults = searchResults?.local ?? [];
	const hasLocalResults = localResults.length > 0;
	const hasExternalResults = searchResults?.hasExternalResults ?? false;
	const allExternalBooks = externalResults?.external ?? [];

	// Get set of ISBNs that exist in local results
	const localIsbns = new Set(
		localResults.flatMap((book) => [book.isbn, book.isbn13].filter(Boolean)),
	);

	// Filter out external books that already exist in local results
	const externalBooks = allExternalBooks.filter((book) => {
		const isbn = book.isbn13 || book.isbn;
		return !isbn || !localIsbns.has(isbn);
	});

	// Reset external results when query changes
	useEffect(() => {
		setShowExternalResults(false);
		setAddedBooks(new Map());
	}, [debouncedQuery]);

	// Close results when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsFocused(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleClear = () => {
		setQuery("");
		setShowExternalResults(false);
		setAddedBooks(new Map());
	};

	const handleSearchOnline = () => {
		setShowExternalResults(true);
		searchExternal();
	};

	const handleAddBook = (book: ExternalBook) => {
		const isbn = book.isbn13 || book.isbn;
		if (!isbn) {
			toast.error("Cannot add book: No ISBN available");
			return;
		}
		addBookMutation.mutate(isbn);
	};

	const getAddedBookId = (book: ExternalBook): number | null => {
		const isbn = book.isbn13 || book.isbn;
		return isbn ? (addedBooks.get(isbn) ?? null) : null;
	};

	return (
		<div ref={containerRef} className={cn("relative w-full", className)}>
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder={placeholder}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => setIsFocused(true)}
					className="h-12 pr-10 pl-10 text-base"
				/>
				{query && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8"
						onClick={handleClear}
					>
						{isFetching ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<X className="h-4 w-4" />
						)}
						<span className="sr-only">Clear search</span>
					</Button>
				)}
			</div>

			{/* Search Results */}
			{showResults && (
				<div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border bg-background shadow-lg">
					<div className="p-4">
						{isLoading ? (
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="space-y-1.5">
										<Skeleton className="aspect-[3/4] w-full rounded-lg" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-2 w-2/3" />
									</div>
								))}
							</div>
						) : hasLocalResults ? (
							<>
								<p className="mb-4 text-muted-foreground text-sm">
									{localResults.length} result
									{localResults.length !== 1 ? "s" : ""} for &quot;
									{debouncedQuery}&quot;
								</p>
								<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
									{localResults.map((book) => (
										<BookCard
											key={book.id}
											id={book.id}
											title={book.title}
											coverUrl={book.coverUrl}
											authors={book.authors}
											size="sm"
										/>
									))}
								</div>

								{/* Search Online Catalog Section */}
								<div className="mt-6 border-t pt-4">
									{!showExternalResults ? (
										<div className="text-center">
											<p className="mb-2 text-muted-foreground text-sm">
												Can&apos;t find what you&apos;re looking for?
											</p>
											<Button
												variant="outline"
												size="sm"
												onClick={handleSearchOnline}
											>
												<Globe className="mr-2 h-4 w-4" />
												Search Online Catalog
											</Button>
										</div>
									) : isLoadingExternal ? (
										<div className="py-4 text-center">
											<Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
											<p className="mt-2 text-muted-foreground text-sm">
												Searching online catalog...
											</p>
										</div>
									) : externalBooks.length > 0 ? (
										<div>
											<p className="mb-3 text-muted-foreground text-sm">
												Found {externalBooks.length} more book
												{externalBooks.length !== 1 ? "s" : ""} in online
												catalog
											</p>
											<div className="space-y-2">
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
															className="flex items-center gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-accent/50"
														>
															<div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded bg-muted">
																{book.coverUrl ? (
																	<Image
																		src={book.coverUrl}
																		alt={book.title}
																		fill
																		className="object-cover"
																		sizes="32px"
																	/>
																) : (
																	<div className="flex h-full items-center justify-center text-[8px] text-muted-foreground">
																		No cover
																	</div>
																)}
															</div>
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
																		book.pageCount
																			? `${book.pageCount} pages`
																			: null,
																	]
																		.filter(Boolean)
																		.join(" • ")}
																</p>
															</div>
															{isAdded ? (
																<Link
																	href={`/books/${addedBookId}` as "/"}
																	className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
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
																	className="h-8 flex-shrink-0"
																>
																	{isAdding ? (
																		<Loader2 className="h-4 w-4 animate-spin" />
																	) : (
																		<Plus className="h-4 w-4" />
																	)}
																</Button>
															)}
														</div>
													);
												})}
											</div>
										</div>
									) : (
										<p className="text-center text-muted-foreground text-sm">
											No additional books found in online catalog.
										</p>
									)}
								</div>
							</>
						) : (
							<div className="py-6 text-center">
								<p className="text-muted-foreground">
									No books found in your library for &quot;{debouncedQuery}
									&quot;
								</p>

								{/* Search Online Catalog Button */}
								{hasExternalResults && !showExternalResults && (
									<Button
										variant="outline"
										className="mt-4"
										onClick={handleSearchOnline}
									>
										<Globe className="mr-2 h-4 w-4" />
										Search Online Catalog
									</Button>
								)}

								{/* External Results Loading */}
								{showExternalResults && isLoadingExternal && (
									<div className="mt-6">
										<Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
										<p className="mt-2 text-muted-foreground text-sm">
											Searching online catalog...
										</p>
									</div>
								)}

								{/* External Results */}
								{showExternalResults &&
									!isLoadingExternal &&
									externalBooks.length > 0 && (
										<div className="mt-6 text-left">
											<p className="mb-4 text-muted-foreground text-sm">
												Found {externalBooks.length} book
												{externalBooks.length !== 1 ? "s" : ""} in online
												catalog
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
															<div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-muted">
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
																		book.pageCount
																			? `${book.pageCount} pages`
																			: null,
																	]
																		.filter(Boolean)
																		.join(" • ")}
																</p>
															</div>

															{/* Add Button or Link */}
															{isAdded ? (
																<Link
																	href={`/books/${addedBookId}` as "/"}
																	className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
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
																	className="flex-shrink-0"
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
									)}

								{/* No External Results */}
								{showExternalResults &&
									!isLoadingExternal &&
									externalBooks.length === 0 && (
										<p className="mt-4 text-muted-foreground text-sm">
											No books found in online catalog either. Try different
											keywords.
										</p>
									)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
