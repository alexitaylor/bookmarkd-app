"use client";

import { ExternalLink, Globe, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookStatusDropdown } from "@/components/book-status-dropdown";
import { Button } from "@/components/ui/button";
import type {
	AddedBookInfo,
	BookStatus,
	ExternalBook,
} from "./hooks/use-book-search";

export interface ExternalBooksListProps {
	/** External books to display */
	books: ExternalBook[];
	/** Callback to add an external book to library */
	onAddBook: (book: ExternalBook) => void;
	/** Get info about a book that was added in this session */
	getAddedBookInfo: (book: ExternalBook) => AddedBookInfo | null;
	/** Whether a book is currently being added */
	isAddingBook: boolean;
	/** ISBN of the book currently being added */
	addingBookIsbn: string | null;
	/** Callback when a book link is clicked (for closing dropdown/dialog) */
	onBookClick?: () => void;
	/** Whether there are more results to load */
	hasMore?: boolean;
	/** Callback to load more results */
	onLoadMore?: () => void;
	/** Whether more results are loading */
	isLoadingMore?: boolean;
	/** Status map for added books */
	statusMap?: Record<number, { status: string; currentPage: number }>;
}

export function ExternalBooksList({
	books,
	onAddBook,
	getAddedBookInfo,
	isAddingBook,
	addingBookIsbn,
	onBookClick,
	hasMore,
	onLoadMore,
	isLoadingMore,
	statusMap,
}: ExternalBooksListProps) {
	if (books.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			{books.map((book, index) => {
				const isbn = book.isbn13 || book.isbn;
				const addedBookInfo = getAddedBookInfo(book);
				const isAdded = addedBookInfo !== null;
				const isAdding = isAddingBook && addingBookIsbn === isbn;

				return (
					<div
						key={isbn || index}
						className="flex items-start gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
					>
						{/* Cover - clickable if added */}
						{isAdded ? (
							<Link
								href={`/books/${addedBookInfo.id}`}
								onClick={onBookClick}
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
						) : (
							<div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-sm bg-muted">
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
							</div>
						)}

						{/* Book Info */}
						<div className="min-w-0 flex-1">
							{isAdded ? (
								<Link
									href={`/books/${addedBookInfo.id}`}
									onClick={onBookClick}
									className="block truncate font-medium text-sm hover:underline"
								>
									{book.title}
								</Link>
							) : (
								<p className="truncate font-medium text-sm">{book.title}</p>
							)}
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

						{/* Actions */}
						{isAdded ? (
							<div className="flex shrink-0 items-center gap-2">
								{/* Link to book detail */}
								<Link
									href={`/books/${addedBookInfo.id}`}
									onClick={onBookClick}
									className="inline-flex h-8 items-center justify-center rounded-md border px-2 font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
								>
									<ExternalLink className="h-4 w-4" />
									<span className="sr-only">View book</span>
								</Link>
								{/* Add to shelf dropdown */}
								<BookStatusDropdown
									bookId={addedBookInfo.id}
									pageCount={addedBookInfo.pageCount}
									currentStatus={
										(statusMap?.[addedBookInfo.id]?.status as BookStatus) ??
										"None"
									}
									compact
								/>
							</div>
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

			{/* Load More Button */}
			{hasMore && onLoadMore && (
				<div className="mt-4 text-center">
					<Button
						variant="outline"
						size="sm"
						onClick={onLoadMore}
						disabled={isLoadingMore}
					>
						{isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Load More
					</Button>
				</div>
			)}
		</div>
	);
}

// Section wrapper for external results with header and CTA
export interface ExternalSearchSectionProps {
	/** Whether to show external results section */
	showExternalResults: boolean;
	/** Whether external search is loading */
	isLoadingExternal: boolean;
	/** External books after filtering duplicates */
	externalBooks: ExternalBook[];
	/** Callback to trigger external search */
	onSearchOnline: () => void;
	/** Props to pass to ExternalBooksList */
	listProps: Omit<ExternalBooksListProps, "books">;
	/** Custom message for when there are no results */
	noResultsMessage?: string;
}

export function ExternalSearchSection({
	showExternalResults,
	isLoadingExternal,
	externalBooks,
	onSearchOnline,
	listProps,
	noResultsMessage = "No additional books found in online catalog.",
}: ExternalSearchSectionProps) {
	if (!showExternalResults) {
		return (
			<div className="text-center">
				<p className="mb-2 text-muted-foreground text-sm">
					Can't find what you're looking for?
				</p>
				<Button variant="outline" size="sm" onClick={onSearchOnline}>
					<Globe className="mr-2 h-4 w-4" />
					Search Online Catalog
				</Button>
			</div>
		);
	}

	if (isLoadingExternal) {
		return (
			<div className="py-4 text-center">
				<Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
				<p className="mt-2 text-muted-foreground text-sm">
					Searching online catalog...
				</p>
			</div>
		);
	}

	if (externalBooks.length > 0) {
		return (
			<div>
				<p className="mb-3 text-center text-muted-foreground text-sm">
					— Results from Online Catalog —
				</p>
				<ExternalBooksList books={externalBooks} {...listProps} />
			</div>
		);
	}

	return (
		<p className="text-center text-muted-foreground text-sm">
			{noResultsMessage}
		</p>
	);
}
