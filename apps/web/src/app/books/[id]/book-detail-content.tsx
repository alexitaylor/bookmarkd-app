"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { BookHeader } from "./components/book-header";
import { ReadingStatusSection } from "./components/reading-status-section";
import { BookTabs } from "./components/book-tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Author {
	id: number;
	name: string;
}

interface Genre {
	id: number;
	name: string;
}

interface Book {
	id: number;
	title: string;
	subtitle?: string | null;
	synopsis?: string | null;
	coverUrl?: string | null;
	pageCount?: number | null;
	publisher?: string | null;
	language?: string | null;
	datePublished?: string | null;
	isbn?: string | null;
	isbn13?: string | null;
	authors: Author[];
	genres: Genre[];
}

interface BookDetailContentProps {
	book: Book;
}

export function BookDetailContent({ book }: BookDetailContentProps) {
	const [activeTab, setActiveTab] = useState("overview");

	// Fetch user's book status
	const { data: userBook, isLoading: isLoadingUserBook } = useQuery(
		orpc.userBook.getByBookId.queryOptions({ input: { bookId: book.id } })
	);

	// Fetch review stats
	const { data: reviewStats } = useQuery(
		orpc.review.getStats.queryOptions({ input: { bookId: book.id } })
	);

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			{/* Book Header */}
			<BookHeader
				book={book}
				avgRating={reviewStats?.avgRating}
				reviewCount={reviewStats?.count}
			/>

			{/* Reading Status & Progress Section */}
			<div className="mt-8">
				{isLoadingUserBook ? (
					<div className="space-y-4">
						<Skeleton className="h-10 w-48" />
						<Skeleton className="h-4 w-full max-w-md" />
					</div>
				) : (
					<ReadingStatusSection
						bookId={book.id}
						pageCount={book.pageCount}
						userBook={userBook}
					/>
				)}
			</div>

			{/* Tabs Section */}
			<div className="mt-8">
				<BookTabs
					bookId={book.id}
					book={book}
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>
			</div>
		</div>
	);
}
