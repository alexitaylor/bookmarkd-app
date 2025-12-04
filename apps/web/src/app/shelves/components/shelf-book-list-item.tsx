"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Calendar, CheckSquare, Square, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookStatusDropdown } from "@/components/book-status-dropdown";
import { HtmlContent } from "@/components/ui/html-content";
import { ReadingProgressBar } from "@/components/ui/reading-progress-bar";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { QuickNotePopover } from "./quick-note-popover";

type BookStatus = "WantToRead" | "CurrentlyReading" | "Read" | "DNF" | "None";

interface ShelfBook {
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

interface ShelfBookListItemProps {
	book: ShelfBook;
	showProgress?: boolean;
	isSelectMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: () => void;
}

function formatDate(date: Date | null): string | null {
	if (!date) return null;
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function ShelfBookListItem({
	book,
	showProgress = false,
	isSelectMode = false,
	isSelected = false,
	onToggleSelect,
}: ShelfBookListItemProps) {
	const [hoveredRating, setHoveredRating] = useState<number | null>(null);
	const queryClient = useQueryClient();

	const updateRatingMutation = useMutation({
		mutationFn: (rating: number) =>
			orpc.userBook.updateRating.call({ bookId: book.bookId, rating }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [["userBook"]] });
		},
	});

	const handleRowClick = (e: React.MouseEvent) => {
		if (isSelectMode && onToggleSelect) {
			e.preventDefault();
			onToggleSelect();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (
			isSelectMode &&
			onToggleSelect &&
			(e.key === "Enter" || e.key === " ")
		) {
			e.preventDefault();
			onToggleSelect();
		}
	};

	const handleRatingClick = (rating: number, e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		updateRatingMutation.mutate(rating);
	};

	// Format publication year from datePublished
	const pubYear = book.bookDatePublished
		? new Date(book.bookDatePublished).getFullYear()
		: null;

	// Format reading dates
	const startedDate = formatDate(book.startedAt);
	const finishedDate = formatDate(book.finishedAt);

	return (
		// biome-ignore lint/a11y/useSemanticElements: <explanation>
		<div
			role="button"
			tabIndex={isSelectMode ? 0 : undefined}
			className={cn(
				"group flex gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-md",
				isSelectMode && "cursor-pointer",
				isSelected && "ring-2 ring-primary",
			)}
			onClick={handleRowClick}
			onKeyDown={handleKeyDown}
		>
			{/* Selection Checkbox */}
			{isSelectMode && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleSelect?.();
					}}
					className="flex-shrink-0 self-center"
				>
					{isSelected ? (
						<CheckSquare className="h-5 w-5 text-primary" />
					) : (
						<Square className="h-5 w-5 text-muted-foreground" />
					)}
				</button>
			)}

			{/* Book Cover */}
			<Link
				href={`/books/${book.bookId}`}
				className={cn("shrink-0", isSelectMode && "pointer-events-none")}
			>
				<div className="relative h-28 w-[72px] overflow-hidden rounded-md bg-muted shadow-sm transition-transform group-hover:scale-[1.02] sm:h-36 sm:w-24">
					{book.bookCoverUrl ? (
						<Image
							src={book.bookCoverUrl}
							alt={book.bookTitle}
							fill
							className="object-cover"
							sizes="96px"
						/>
					) : (
						<div className="flex h-full items-center justify-center bg-secondary">
							<BookOpen className="h-8 w-8 text-muted-foreground" />
						</div>
					)}
				</div>
			</Link>

			{/* Book Info */}
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex-1">
					<Link
						href={`/books/${book.bookId}`}
						className={cn(isSelectMode && "pointer-events-none")}
					>
						<h3 className="line-clamp-1 font-medium transition-colors group-hover:text-primary sm:text-lg">
							{book.bookTitle}
						</h3>
					</Link>
					{book.bookAuthors && (
						<p className="mt-0.5 line-clamp-1 text-muted-foreground text-sm">
							by {book.bookAuthors}
						</p>
					)}

					{/* Meta info row */}
					<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
						{pubYear && <span>{pubYear}</span>}
						{book.bookPageCount && <span>{book.bookPageCount} pages</span>}
					</div>

					{/* Synopsis */}
					{book.bookSynopsis && (
						<HtmlContent
							content={book.bookSynopsis}
							lineClamp={2}
							className="mt-2 text-muted-foreground text-sm"
						/>
					)}

					{/* Your Rating row */}
					<div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
						{/* Interactive Rating */}
						<div className="flex items-center gap-1.5">
							<span className="text-muted-foreground text-xs">
								Your rating:
							</span>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: interactive rating */}
							<div
								className="flex items-center gap-0.5"
								onMouseLeave={() => setHoveredRating(null)}
							>
								{Array.from({ length: 5 }).map((_, i) => {
									const starIndex = i + 1;
									const isActive = hoveredRating
										? starIndex <= hoveredRating
										: book.rating
											? starIndex <= book.rating
											: false;
									return (
										<button
											// biome-ignore lint/suspicious/noArrayIndexKey: star rating index
											key={i}
											type="button"
											onClick={(e) => handleRatingClick(starIndex, e)}
											onMouseEnter={() => setHoveredRating(starIndex)}
											disabled={isSelectMode || updateRatingMutation.isPending}
											className={cn(
												"transition-transform hover:scale-110 disabled:pointer-events-none",
												isSelectMode && "pointer-events-none",
											)}
										>
											<Star
												className={cn(
													"h-4 w-4 transition-colors",
													isActive
														? "fill-yellow-400 text-yellow-400"
														: "text-muted-foreground/30 hover:text-yellow-400/50",
												)}
											/>
										</button>
									);
								})}
							</div>
						</div>

						{/* Quick Note */}
						<QuickNotePopover
							bookId={book.bookId}
							disabled={isSelectMode}
							compact
						/>
					</div>

					{/* Reading dates */}
					{(startedDate || finishedDate) && (
						<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
							{startedDate && (
								<span className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									Started: {startedDate}
								</span>
							)}
							{finishedDate && (
								<span className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									Finished: {finishedDate}
								</span>
							)}
						</div>
					)}

					{/* Progress Bar (for Currently Reading) */}
					{showProgress && (
						<div className="mt-2">
							<ReadingProgressBar
								currentPage={book.currentPage}
								pageCount={book.bookPageCount}
								height="h-1.5"
								showPageCount
								showPercentage
								className="max-w-[250px]"
							/>
						</div>
					)}
				</div>

				{/* Status Dropdown */}
				<div className="mt-2">
					<BookStatusDropdown
						bookId={book.bookId}
						pageCount={book.bookPageCount}
						currentStatus={book.status as BookStatus}
						compact
					/>
				</div>
			</div>
		</div>
	);
}
