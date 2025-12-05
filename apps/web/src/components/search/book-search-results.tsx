"use client";

import { Library, Loader2, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookStatusDropdown } from "@/components/book-status-dropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookStatus, LocalBook } from "./hooks/use-book-search";

export interface BookSearchResultsProps {
	/** Books to display */
	books: LocalBook[];
	/** User status map for books */
	statusMap?: Record<number, { status: string; currentPage: number }>;
	/** Layout variant */
	layout: "grid" | "list";
	/** Callback when a book is clicked (for closing dropdown/dialog) */
	onBookClick?: () => void;
	/** Whether there are more results to load */
	hasMore?: boolean;
	/** Callback to load more results */
	onLoadMore?: () => void;
	/** Whether more results are loading */
	isLoadingMore?: boolean;
	/** Search query for empty state display */
	searchQuery?: string;
	/** Whether initial search is loading */
	isLoading?: boolean;
	/** Whether search should be performed (query length >= 2) */
	shouldSearch?: boolean;
	/** Current keyboard-selected index for navigation */
	selectedIndex?: number;
}

export function BookSearchResults({
	books,
	statusMap,
	layout,
	onBookClick,
	hasMore,
	onLoadMore,
	isLoadingMore,
	searchQuery,
	isLoading,
	shouldSearch,
	selectedIndex,
}: BookSearchResultsProps) {
	// Empty state - no query
	if (!shouldSearch && !searchQuery) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Search className="h-12 w-12 text-muted-foreground/50" />
				<p className="mt-4 text-muted-foreground text-sm">
					Start typing to search for books
				</p>
			</div>
		);
	}

	// Empty state - query too short
	if (searchQuery && !shouldSearch) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Search className="h-12 w-12 text-muted-foreground/50" />
				<p className="mt-4 text-muted-foreground text-sm">
					Type at least 2 characters to search
				</p>
			</div>
		);
	}

	// Loading state
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="mt-4 text-muted-foreground text-sm">Searching...</p>
			</div>
		);
	}

	// No results
	if (books.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Library className="h-12 w-12 text-muted-foreground/50" />
				<p className="mt-4 text-muted-foreground text-sm">
					No books found for "{searchQuery}"
				</p>
			</div>
		);
	}

	// Render results based on layout
	if (layout === "grid") {
		return (
			<div>
				<p className="mb-4 text-muted-foreground text-sm">
					{books.length} result{books.length !== 1 ? "s" : ""} for "
					{searchQuery}"
				</p>
				<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
					{books.map((book, index) => {
						const userStatus =
							(statusMap?.[book.id]?.status as BookStatus) ?? "None";
						return (
							<GridBookCard
								key={book.id}
								book={book}
								userStatus={userStatus}
								onBookClick={onBookClick}
								isSelected={selectedIndex === index}
							/>
						);
					})}
				</div>
				{hasMore && onLoadMore && (
					<div className="mt-4 text-center">
						<Button
							variant="outline"
							size="sm"
							onClick={onLoadMore}
							disabled={isLoadingMore}
						>
							{isLoadingMore && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Load More Results
						</Button>
					</div>
				)}
			</div>
		);
	}

	// List layout
	return (
		<div>
			<ul className="divide-y divide-border">
				{books.map((book, index) => {
					const userStatus =
						(statusMap?.[book.id]?.status as BookStatus) ?? "None";
					return (
						<ListBookItem
							key={book.id}
							book={book}
							userStatus={userStatus}
							onBookClick={onBookClick}
							isSelected={selectedIndex === index}
						/>
					);
				})}
			</ul>
			{hasMore && onLoadMore && (
				<div className="border-border border-t p-4 text-center">
					<Button
						variant="outline"
						size="sm"
						onClick={onLoadMore}
						disabled={isLoadingMore}
					>
						{isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Load More Results
					</Button>
				</div>
			)}
		</div>
	);
}

// Grid layout book card
function GridBookCard({
	book,
	userStatus,
	onBookClick,
	isSelected,
}: {
	book: LocalBook;
	userStatus: BookStatus;
	onBookClick?: () => void;
	isSelected?: boolean;
}) {
	return (
		<div
			className={cn(
				"group relative space-y-1.5",
				isSelected && "rounded-lg ring-2 ring-primary ring-offset-2",
			)}
		>
			<Link
				href={`/books/${book.id}`}
				onClick={onBookClick}
				className="relative block aspect-[2/3] overflow-hidden rounded-lg bg-muted"
			>
				{book.coverUrl ? (
					<Image
						src={book.coverUrl}
						alt={book.title}
						fill
						className="object-cover transition-transform group-hover:scale-105"
						sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
					/>
				) : (
					<div className="flex h-full items-center justify-center p-2 text-center text-muted-foreground text-xs">
						No cover
					</div>
				)}
			</Link>
			<div className="space-y-0.5">
				<Link
					href={`/books/${book.id}`}
					onClick={onBookClick}
					className="line-clamp-1 font-medium text-xs hover:underline"
				>
					{book.title}
				</Link>
				{book.authors.length > 0 && (
					<p className="line-clamp-1 text-muted-foreground text-xs">
						{book.authors.map((a) => a.name).join(", ")}
					</p>
				)}
			</div>
			<BookStatusDropdown
				bookId={book.id}
				pageCount={book.pageCount}
				currentStatus={userStatus}
				compact
			/>
		</div>
	);
}

// List layout book item
function ListBookItem({
	book,
	userStatus,
	onBookClick,
	isSelected,
}: {
	book: LocalBook;
	userStatus: BookStatus;
	onBookClick?: () => void;
	isSelected?: boolean;
}) {
	return (
		<li
			className={cn(
				"flex items-start gap-4 px-4 py-3 transition-colors hover:bg-accent/50",
				isSelected && "bg-accent",
			)}
		>
			{/* Book Cover */}
			<Link
				href={`/books/${book.id}`}
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

			{/* Book Info */}
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<Link
					href={`/books/${book.id}`}
					onClick={onBookClick}
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
				<BookStatusDropdown
					bookId={book.id}
					pageCount={book.pageCount}
					currentStatus={userStatus}
					compact
				/>
			</div>
		</li>
	);
}
