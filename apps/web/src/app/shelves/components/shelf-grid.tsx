"use client";

import { BookmarkPlus, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ShelfBookCard } from "./shelf-book-card";

type SortOption = "dateAdded" | "title" | "author";

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

interface ShelfGridProps {
	books: ShelfBook[];
	isLoading: boolean;
	shelfType: "want" | "current" | "read" | "dnf";
}

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
		emptyDescription:
			"Books you've decided not to finish will appear here.",
	},
};

export function ShelfGrid({ books, isLoading, shelfType }: ShelfGridProps) {
	const [sortBy, setSortBy] = useState<SortOption>("dateAdded");
	const config = shelfConfig[shelfType];

	const sortedBooks = useMemo(() => {
		const sorted = [...books];
		switch (sortBy) {
			case "title":
				sorted.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle));
				break;
			case "author":
				sorted.sort((a, b) => {
					const authorA = a.bookAuthors || "";
					const authorB = b.bookAuthors || "";
					return authorA.localeCompare(authorB);
				});
				break;
			case "dateAdded":
			default:
				// Already sorted by updatedAt from API, reverse for newest first
				sorted.reverse();
				break;
		}
		return sorted;
	}, [books, sortBy]);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex justify-end">
					<Skeleton className="h-10 w-[150px]" />
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
			{/* Sort Controls */}
			<div className="flex justify-end">
				<Select
					value={sortBy}
					onValueChange={(value) => setSortBy(value as SortOption)}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="dateAdded">Date Added</SelectItem>
						<SelectItem value="title">Title (A-Z)</SelectItem>
						<SelectItem value="author">Author (A-Z)</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Books Grid */}
			<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{sortedBooks.map((book) => (
					<ShelfBookCard
						key={book.id}
						book={book}
						showProgress={shelfType === "current"}
					/>
				))}
			</div>
		</div>
	);
}
