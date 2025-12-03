"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookStatusDropdown } from "@/components/book-status-dropdown";
import { ReadingProgressBar } from "@/components/ui/reading-progress-bar";

type BookStatus = "WantToRead" | "CurrentlyReading" | "Read" | "DNF" | "None";

interface ShelfBook {
	id: number;
	bookId: number;
	status: string;
	currentPage: number;
	bookTitle: string;
	bookCoverUrl: string | null;
	bookPageCount: number | null;
	bookAuthors: string | null;
	bookDatePublished: string | null;
}

interface ShelfBookCardProps {
	book: ShelfBook;
	showProgress?: boolean;
}

export function ShelfBookCard({
	book,
	showProgress = false,
}: ShelfBookCardProps) {
	return (
		<div className="group relative flex h-full flex-col overflow-hidden rounded-lg">
			{/* Book Cover */}
			<Link
				href={`/books/${book.bookId}`}
				className="relative aspect-[2/3] w-full flex-grow-2 overflow-hidden rounded-lg bg-muted shadow-sm transition-transform hover:scale-[1.02]"
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
