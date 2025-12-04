"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BookMarked,
	BookOpen,
	Check,
	Globe,
	Library,
	Loader2,
	Plus,
	Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

type BookStatus = "WantToRead" | "CurrentlyReading" | "Read" | "DNF" | "None";

interface BookWithStatus {
	id: number;
	title: string;
	subtitle: string | null;
	coverUrl: string | null;
	isbn: string | null;
	isbn13: string | null;
	authors: { id: number; name: string }[];
	genres?: string[];
	userStatus: BookStatus | null;
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

interface BookSearchProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<
	Exclude<BookStatus, "DNF" | "None">,
	{ label: string; icon: typeof BookOpen }
> = {
	WantToRead: { label: "Want to Read", icon: BookMarked },
	CurrentlyReading: { label: "Currently Reading", icon: BookOpen },
	Read: { label: "Read", icon: Check },
};

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

export function BookSearch({ open, onOpenChange }: BookSearchProps) {
	const [query, setQuery] = useState("");
	const [showExternalResults, setShowExternalResults] = useState(false);
	const [addedBooks, setAddedBooks] = useState<Map<string, number>>(new Map());
	const [addingBookId, setAddingBookId] = useState<number | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
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
		enabled: shouldSearch && open,
	});

	// Get user statuses for search results
	const bookIds = searchResults?.local?.map((b) => b.id) ?? [];
	const { data: statusMap } = useQuery({
		queryKey: ["userBook", "getStatusForBooks", { bookIds }],
		queryFn: () => client.userBook.getStatusForBooks({ bookIds }),
		enabled: bookIds.length > 0 && open,
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
		enabled: false,
	});

	// Add book mutation (for external books)
	const addBookMutation = useMutation({
		mutationFn: (isbn: string) => client.book.addFromISBN({ isbn }),
		onSuccess: (book, isbn) => {
			toast.success(`"${book.title}" added to library`);
			setAddedBooks((prev) => new Map(prev).set(isbn, book.id));
			queryClient.invalidateQueries({ queryKey: ["book"] });
		},
		onError: (error) => {
			toast.error(`Failed to add book: ${error.message}`);
		},
	});

	// Update status mutation
	const updateStatusMutation = useMutation({
		mutationFn: ({ bookId, status }: { bookId: number; status: BookStatus }) =>
			client.userBook.updateStatus({ bookId, status }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userBook"] });
		},
	});

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

	// Combine local results with user status
	const booksWithStatus: BookWithStatus[] = localResults.map((book) => ({
		...book,
		userStatus: (statusMap?.[book.id]?.status as BookStatus) ?? null,
	}));

	// Reset state when dialog closes
	useEffect(() => {
		if (!open) {
			setQuery("");
			setShowExternalResults(false);
			setAddedBooks(new Map());
		}
	}, [open]);

	// Reset external results when query changes
	useEffect(() => {
		setShowExternalResults(false);
		setAddedBooks(new Map());
	}, [debouncedQuery]);

	// Auto-focus input when dialog opens
	useEffect(() => {
		if (open && inputRef.current) {
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [open]);

	const handleSearchOnline = () => {
		setShowExternalResults(true);
		searchExternal();
	};

	const handleAddExternalBook = (book: ExternalBook) => {
		const isbn = book.isbn13 || book.isbn;
		if (!isbn) {
			toast.error("Cannot add book: No ISBN available");
			return;
		}
		addBookMutation.mutate(isbn);
	};

	const handleAddToShelf = async (book: BookWithStatus, status: BookStatus) => {
		setAddingBookId(book.id);
		try {
			await updateStatusMutation.mutateAsync({ bookId: book.id, status });
			toast.success(
				`Added "${book.title}" to ${statusConfig[status as keyof typeof statusConfig]?.label || status}`,
			);
		} catch {
			toast.error("Failed to add book to shelf");
		} finally {
			setAddingBookId(null);
		}
	};

	const getAddedBookId = (book: ExternalBook): number | null => {
		const isbn = book.isbn13 || book.isbn;
		return isbn ? (addedBooks.get(isbn) ?? null) : null;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="w-[90vw] max-w-none gap-0 p-0 sm:w-[60vw] sm:max-w-none"
				showCloseButton={false}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Search Books</DialogTitle>
				</DialogHeader>

				{/* Search Input */}
				<div className="flex items-center gap-3 border-border border-b px-4 py-3">
					<Search className="h-5 w-5 shrink-0 text-muted-foreground" />
					<input
						ref={inputRef}
						type="text"
						placeholder="Search books by title, author, or ISBN..."
						className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					{(isLoading || isFetching) && (
						<Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
					)}
				</div>

				{/* Results - Fixed height to prevent flickering */}
				<div className="h-[60vh] overflow-y-auto">
					{/* Empty state - no query */}
					{!shouldSearch && !query && (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<Search className="h-12 w-12 text-muted-foreground/50" />
							<p className="mt-4 text-muted-foreground text-sm">
								Start typing to search for books
							</p>
						</div>
					)}

					{/* Empty state - query too short */}
					{query && !shouldSearch && (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<Search className="h-12 w-12 text-muted-foreground/50" />
							<p className="mt-4 text-muted-foreground text-sm">
								Type at least 2 characters to search
							</p>
						</div>
					)}

					{/* No results */}
					{shouldSearch && !isLoading && !hasLocalResults && (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<Library className="h-12 w-12 text-muted-foreground/50" />
							<p className="mt-4 text-muted-foreground text-sm">
								No books found for "{debouncedQuery}"
							</p>

							{/* Search Online Catalog Button */}
							{!showExternalResults && (
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
									<div className="mt-6 w-full text-left">
										<p className="mb-4 text-center text-muted-foreground text-sm">
											— Results from Online Catalog —
										</p>
										<ExternalBooksList
											books={externalBooks}
											onAddBook={handleAddExternalBook}
											getAddedBookId={getAddedBookId}
											addBookMutation={addBookMutation}
										/>
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

					{/* Results list */}
					{shouldSearch && hasLocalResults && (
						<>
							<ul className="divide-y divide-border">
								{booksWithStatus.map((book) => (
									<li
										key={book.id}
										className="flex items-start gap-4 px-4 py-3 transition-colors hover:bg-accent/50"
									>
										{/* Book Cover */}
										<Link
											href={`/books/${book.id}`}
											onClick={() => onOpenChange(false)}
											className="relative h-20 w-14 shrink-0 overflow-hidden rounded-sm bg-muted"
										>
											{book.coverUrl ? (
												<Image
													src={book.coverUrl}
													alt={book.title}
													fill
													className="object-cover"
													sizes="56px"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-muted-foreground text-xs">
													No cover
												</div>
											)}
										</Link>

										{/* Book Info */}
										<div className="flex min-w-0 flex-1 flex-col gap-1">
											<Link
												href={`/books/${book.id}`}
												onClick={() => onOpenChange(false)}
												className="line-clamp-1 font-medium text-foreground hover:underline"
											>
												{book.title}
											</Link>
											<p className="line-clamp-1 text-muted-foreground text-sm">
												{book.authors.map((a) => a.name).join(", ")}
											</p>
											{book.genres && book.genres.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{book.genres.slice(0, 2).map((genre) => (
														<span
															key={genre}
															className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
														>
															{genre}
														</span>
													))}
												</div>
											)}
										</div>

										{/* Add to Shelf Button */}
										<div className="shrink-0">
											<ShelfDropdown
												book={book}
												onAddToShelf={handleAddToShelf}
												isLoading={addingBookId === book.id}
											/>
										</div>
									</li>
								))}
							</ul>

							{/* Search Online Catalog Section */}
							<div className="border-border border-t p-4">
								{!showExternalResults ? (
									<div className="text-center">
										<p className="mb-2 text-muted-foreground text-sm">
											Can't find what you're looking for?
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
										<p className="mb-3 text-center text-muted-foreground text-sm">
											— Results from Online Catalog —
										</p>
										<ExternalBooksList
											books={externalBooks}
											onAddBook={handleAddExternalBook}
											getAddedBookId={getAddedBookId}
											addBookMutation={addBookMutation}
										/>
									</div>
								) : (
									<p className="text-center text-muted-foreground text-sm">
										No additional books found in online catalog.
									</p>
								)}
							</div>
						</>
					)}
				</div>

				{/* Footer */}
				<div className="border-border border-t px-4 py-2">
					<p className="text-muted-foreground text-xs">
						Press{" "}
						<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
							Esc
						</kbd>{" "}
						to close
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Shelf dropdown component
function ShelfDropdown({
	book,
	onAddToShelf,
	isLoading,
}: {
	book: BookWithStatus;
	onAddToShelf: (book: BookWithStatus, status: BookStatus) => void;
	isLoading: boolean;
}) {
	const currentStatus = book.userStatus;
	const hasStatus = currentStatus && currentStatus !== "None";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={hasStatus ? "secondary" : "outline"}
					size="sm"
					className="gap-1.5 bg-transparent"
					disabled={isLoading}
				>
					{isLoading ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : hasStatus ? (
						<Check className="h-3.5 w-3.5" />
					) : (
						<Plus className="h-3.5 w-3.5" />
					)}
					<span className="hidden sm:inline">
						{hasStatus
							? statusConfig[currentStatus as keyof typeof statusConfig]?.label
							: "Add to Shelf"}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{(Object.keys(statusConfig) as (keyof typeof statusConfig)[]).map(
					(status) => {
						const config = statusConfig[status];
						return (
							<DropdownMenuItem
								key={status}
								onClick={() => onAddToShelf(book, status)}
								className={cn(currentStatus === status && "bg-accent")}
							>
								<config.icon className="mr-2 h-4 w-4" />
								{config.label}
								{currentStatus === status && (
									<Check className="ml-auto h-4 w-4" />
								)}
							</DropdownMenuItem>
						);
					},
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// External books list component
function ExternalBooksList({
	books,
	onAddBook,
	getAddedBookId,
	addBookMutation,
}: {
	books: ExternalBook[];
	onAddBook: (book: ExternalBook) => void;
	getAddedBookId: (book: ExternalBook) => number | null;
	addBookMutation: ReturnType<typeof useMutation<unknown, Error, string>>;
}) {
	return (
		<div className="space-y-2">
			{books.map((book, index) => {
				const isbn = book.isbn13 || book.isbn;
				const addedBookId = getAddedBookId(book);
				const isAdded = addedBookId !== null;
				const isAdding =
					addBookMutation.isPending && addBookMutation.variables === isbn;

				return (
					<div
						key={isbn || index}
						className="flex items-center gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-accent/50"
					>
						<div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
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
							<p className="truncate font-medium text-sm">{book.title}</p>
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
						{isAdded ? (
							<Link
								href={`/books/${addedBookId}`}
								className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								<Check className="h-4 w-4" />
								<span className="hidden sm:inline">Added</span>
							</Link>
						) : (
							<Button
								variant="outline"
								size="sm"
								disabled={!isbn || isAdding}
								onClick={() => onAddBook(book)}
								className="h-8 shrink-0"
							>
								{isAdding ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<>
										<Plus className="h-4 w-4 sm:mr-1" />
										<span className="hidden sm:inline">Save to Library</span>
									</>
								)}
							</Button>
						)}
					</div>
				);
			})}
		</div>
	);
}
