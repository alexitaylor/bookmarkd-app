"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { SearchBar } from "@/components/search-bar";
import { SectionHeader } from "@/components/section-header";
import { BookCard, BookCardCompact } from "@/components/book-card";
import { HorizontalScroll } from "@/components/horizontal-scroll";
import { StatCard } from "@/components/stat-card";
import { UpdateProgressModal } from "@/components/update-progress-modal";
import { ReadingGoalProgress } from "@/components/reading-goal-progress";
import { GenreLinks } from "@/components/genre-links";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
	id: string;
	name: string;
	email: string;
	image?: string | null;
}

interface HomeContentProps {
	user: User;
}

export function HomeContent({ user }: HomeContentProps) {
	const [selectedBook, setSelectedBook] = useState<{
		bookId: number;
		title: string;
		currentPage: number;
		pageCount: number | null;
	} | null>(null);

	// Fetch currently reading books
	const { data: currentlyReading, isLoading: isLoadingCurrent } = useQuery(
		orpc.userBook.getCurrentlyReading.queryOptions({ limit: 6 })
	);

	// Fetch popular books
	const { data: popularBooks, isLoading: isLoadingPopular } = useQuery(
		orpc.book.getPopular.queryOptions({ limit: 12 })
	);

	// Fetch recently added books
	const { data: recentBooks, isLoading: isLoadingRecent } = useQuery(
		orpc.book.getRecent.queryOptions({ limit: 12 })
	);

	// Fetch reading stats
	const { data: stats, isLoading: isLoadingStats } = useQuery(
		orpc.userBook.getStats.queryOptions()
	);

	const handleUpdateProgress = (bookId: number) => {
		const book = currentlyReading?.find((b) => b.bookId === bookId);
		if (book) {
			setSelectedBook({
				bookId: book.bookId,
				title: book.bookTitle,
				currentPage: book.currentPage,
				pageCount: book.bookPageCount,
			});
		}
	};

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
			{/* Welcome Header */}
			<div className="space-y-2">
				<h1 className="text-3xl font-bold">
					Welcome back, {user.name?.split(" ")[0] || "Reader"}!
				</h1>
				<p className="text-muted-foreground">
					Discover your next favorite book
				</p>
			</div>

			{/* Search Bar */}
			<SearchBar />

			{/* Browse by Genre */}
			<section className="space-y-4">
				<SectionHeader title="Browse by Genre" href="/genres" />
				<GenreLinks />
			</section>

			{/* Continue Reading Section */}
			<section className="space-y-4">
				<SectionHeader
					title="Continue Reading"
					href="/shelves?status=CurrentlyReading"
				/>
				{isLoadingCurrent ? (
					<HorizontalScroll>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="w-32 shrink-0 space-y-2">
								<Skeleton className="aspect-[2/3] w-full rounded-lg" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-2 w-full" />
							</div>
						))}
					</HorizontalScroll>
				) : currentlyReading && currentlyReading.length > 0 ? (
					<HorizontalScroll>
						{currentlyReading.map((book) => (
							<BookCardCompact
								key={book.id}
								id={book.id}
								bookId={book.bookId}
								title={book.bookTitle}
								coverUrl={book.bookCoverUrl}
								progress={book.progress}
								currentPage={book.currentPage}
								pageCount={book.bookPageCount}
								onUpdateProgress={handleUpdateProgress}
							/>
						))}
					</HorizontalScroll>
				) : (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<p className="text-muted-foreground">
							You&apos;re not currently reading any books.
						</p>
						<p className="text-sm text-muted-foreground mt-1">
							Browse popular books below to get started!
						</p>
					</div>
				)}
			</section>

			{/* Reading Goal & Stats Row */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Reading Goal Progress */}
				<ReadingGoalProgress />

				{/* Reading Stats */}
				<div className="space-y-4">
					<h3 className="font-semibold">Your Stats</h3>
					{isLoadingStats ? (
						<div className="grid gap-3 sm:grid-cols-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-20 w-full rounded-lg" />
							))}
						</div>
					) : stats ? (
						<div className="grid gap-3 sm:grid-cols-3">
							<StatCard
								value={stats.booksReadThisYear}
								label="Books Read"
								href="/shelves?status=Read"
							/>
							<StatCard
								value={stats.pagesReadThisYear.toLocaleString()}
								label="Pages Read"
							/>
							<StatCard
								value={stats.currentlyReading}
								label="Reading Now"
								href="/shelves?status=CurrentlyReading"
							/>
						</div>
					) : null}
				</div>
			</div>

			{/* Popular Books Section */}
			<section className="space-y-4">
				<SectionHeader title="Popular Books" href="/books?sort=popular" />
				{isLoadingPopular ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="aspect-[2/3] w-full rounded-lg" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-3 w-2/3" />
							</div>
						))}
					</div>
				) : popularBooks && popularBooks.length > 0 ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{popularBooks.map((book) => (
							<BookCard
								key={book.id}
								id={book.id}
								title={book.title}
								coverUrl={book.coverUrl}
								authors={book.authors}
								avgRating={book.avgRating}
							/>
						))}
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<p className="text-muted-foreground">
							No books available yet. Check back soon!
						</p>
					</div>
				)}
			</section>

			{/* Recently Added Books Section */}
			<section className="space-y-4">
				<SectionHeader title="Recently Added" href="/books?sort=recent" />
				{isLoadingRecent ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="aspect-[2/3] w-full rounded-lg" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-3 w-2/3" />
							</div>
						))}
					</div>
				) : recentBooks && recentBooks.length > 0 ? (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{recentBooks.map((book) => (
							<BookCard
								key={book.id}
								id={book.id}
								title={book.title}
								coverUrl={book.coverUrl}
								authors={book.authors}
							/>
						))}
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<p className="text-muted-foreground">
							No recent books added. Check back soon!
						</p>
					</div>
				)}
			</section>

			{/* Update Progress Modal */}
			{selectedBook && (
				<UpdateProgressModal
					open={!!selectedBook}
					onOpenChange={(open) => !open && setSelectedBook(null)}
					bookId={selectedBook.bookId}
					bookTitle={selectedBook.title}
					currentPage={selectedBook.currentPage}
					pageCount={selectedBook.pageCount}
				/>
			)}
		</div>
	);
}
