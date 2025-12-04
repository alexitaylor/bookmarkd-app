"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckSquare, Square, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookStatusDropdown } from "@/components/book-status-dropdown";
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

interface ShelfBookCardProps {
	book: ShelfBook;
	showProgress?: boolean;
	isSelectMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: () => void;
}

export function ShelfBookCard({
	book,
	showProgress = false,
	isSelectMode = false,
	isSelected = false,
	onToggleSelect,
}: ShelfBookCardProps) {
	const [hoveredRating, setHoveredRating] = useState<number | null>(null);
	const queryClient = useQueryClient();

	const updateRatingMutation = useMutation({
		mutationFn: (rating: number) =>
			orpc.userBook.updateRating.call({ bookId: book.bookId, rating }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [["userBook"]] });
		},
	});

	const handleCardClick = (e: React.MouseEvent) => {
		if (isSelectMode && onToggleSelect) {
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

	return (
		// biome-ignore lint/a11y/useSemanticElements: <explanation>
		<div
			role="button"
			tabIndex={isSelectMode ? 0 : undefined}
			className={cn(
				"group relative flex h-full flex-col overflow-hidden rounded-lg",
				isSelectMode && "cursor-pointer",
				isSelected && "ring-2 ring-primary ring-offset-2",
			)}
			onClick={handleCardClick}
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
					className="absolute top-2 left-2 z-10 rounded bg-background/80 p-1 backdrop-blur-sm transition-colors hover:bg-background"
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
				className={cn(
					"relative aspect-[2/3] w-full flex-grow-2 overflow-hidden rounded-lg bg-muted shadow-sm transition-transform hover:scale-[1.02]",
					isSelectMode && "pointer-events-none",
				)}
			>
				{book.bookCoverUrl ? (
					<Image
						src={book.bookCoverUrl}
						alt={book.bookTitle}
						fill
						className="object-cover transition-opacity group-hover:opacity-90"
						sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
					/>
				) : (
					<div className="flex h-full items-center justify-center bg-secondary">
						<BookOpen className="h-12 w-12 text-muted-foreground" />
					</div>
				)}
			</Link>

			{/* Book Info */}
			<div className="mt-3 flex flex-1 flex-col gap-2">
				{/* Title and Author */}
				<div className="min-h-[3.5rem] flex-shrink-0">
					<Link href={`/books/${book.bookId}`}>
						<h3 className="line-clamp-2 font-medium leading-tight transition-colors hover:text-primary">
							{book.bookTitle}
						</h3>
					</Link>
					{book.bookAuthors && (
						<p className="mt-0.5 line-clamp-1 text-muted-foreground text-sm">
							{book.bookAuthors}
						</p>
					)}
				</div>

				{/* Quick Actions Row - Rating & Note */}
				<div className="flex items-center gap-2">
					{/* Quick Rating */}
					{/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
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
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
											"h-3.5 w-3.5 transition-colors",
											isActive
												? "fill-yellow-400 text-yellow-400"
												: "text-muted-foreground/30 hover:text-yellow-400/50",
										)}
									/>
								</button>
							);
						})}
					</div>

					{/* Quick Note */}
					<QuickNotePopover
						bookId={book.bookId}
						disabled={isSelectMode}
						compact
					/>
				</div>

				{/* Progress Bar (for Currently Reading) */}
				{showProgress && (
					<ReadingProgressBar
						currentPage={book.currentPage}
						pageCount={book.bookPageCount}
						height="h-1.5"
						showPageCount
						showPercentage
						className="flex-shrink-0"
					/>
				)}

				{/* Spacer to push dropdown to bottom */}
				<div className="flex-1" />

				{/* Status Dropdown */}
				<div className="flex-shrink-0">
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
