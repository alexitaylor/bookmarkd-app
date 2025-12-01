"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronRight, Library, Search, ArrowLeft } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Color palette for genre cards - consistent with genre-links
const colorPalette = [
	{ bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
	{ bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
	{ bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800" },
	{ bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
	{ bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
	{ bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
	{ bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
	{ bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
	{ bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
	{ bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
	{ bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
	{ bg: "bg-lime-100 dark:bg-lime-900/30", text: "text-lime-700 dark:text-lime-300", border: "border-lime-200 dark:border-lime-800" },
	{ bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-200 dark:border-fuchsia-800" },
	{ bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
	{ bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800" },
];

function getGenreColor(genreId: number) {
	return colorPalette[genreId % colorPalette.length];
}

export default function GenresPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedGenreId, setSelectedGenreId] = useQueryState("id", parseAsInteger);
	const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

	// Fetch popular genres with book count
	const { data: genres, isLoading: isLoadingGenres } = useQuery(
		orpc.genre.getPopular.queryOptions({ limit: 50 })
	);

	// Fetch selected genre details with books
	const genreQueryOptions = selectedGenreId !== null
		? orpc.genre.getById.queryOptions({ input: { id: selectedGenreId } })
		: { queryKey: ['genre', 'getById', 'disabled'] as const, queryFn: () => Promise.resolve(null) };

	const { data: selectedGenre, isLoading: isLoadingGenreDetail } = useQuery({
		...genreQueryOptions,
		enabled: selectedGenreId !== null,
	});

	// Filter genres based on search
	const filteredGenres = genres?.filter((genre) =>
		genre.name.toLowerCase().includes(searchQuery.toLowerCase())
	) ?? [];

	const handleSelectGenre = (genreId: number) => {
		setSelectedGenreId(genreId);
		setIsMobileDetailOpen(true);
	};

	const handleBackToList = () => {
		setIsMobileDetailOpen(false);
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-3xl font-bold flex items-center gap-3">
					<Library className="h-8 w-8" />
					Browse Genres
				</h1>
				<p className="mt-2 text-muted-foreground">
					Explore books by genre and discover your next great read
				</p>
			</div>

			{/* Master-Detail Layout */}
			<div className="grid h-[calc(100vh-240px)] min-h-[500px] gap-6 lg:grid-cols-[350px_1fr]">
				{/* Genre List (Master) */}
				<div
					className={cn(
						"flex flex-col rounded-lg border bg-card",
						isMobileDetailOpen && "hidden lg:flex"
					)}
				>
					{/* Search */}
					<div className="border-b p-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search genres..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					{/* Genre List */}
					<div className="flex-1 overflow-y-auto min-h-0 p-2">
						{isLoadingGenres ? (
							<div className="space-y-2 p-2">
								{Array.from({ length: 10 }).map((_, i) => (
									<Skeleton key={i} className="h-16 w-full rounded-lg" />
								))}
							</div>
						) : filteredGenres.length === 0 ? (
							<div className="flex h-full items-center justify-center p-4 text-center">
								<p className="text-muted-foreground">
									{searchQuery ? `No genres found for "${searchQuery}"` : "No genres available"}
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{filteredGenres.map((genre) => {
									const style = getGenreColor(genre.id);
									const isSelected = selectedGenreId === genre.id;
									return (
										<button
											key={genre.id}
											onClick={() => handleSelectGenre(genre.id)}
											className={cn(
												"w-full rounded-lg border p-4 text-left transition-all hover:shadow-md",
												style.bg,
												style.border,
												isSelected && "ring-2 ring-primary ring-offset-2"
											)}
										>
											<div className="flex items-center justify-between">
												<div>
													<h3 className={cn("font-semibold", style.text)}>
														{genre.name}
													</h3>
													<p className="text-sm text-muted-foreground">
														{genre.bookCount} {genre.bookCount === 1 ? "book" : "books"}
													</p>
												</div>
												<ChevronRight className={cn("h-5 w-5", style.text)} />
											</div>
										</button>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Genre Detail (Detail) */}
				<div
					className={cn(
						"flex flex-col rounded-lg border bg-card",
						!isMobileDetailOpen && "hidden lg:flex"
					)}
				>
					{selectedGenreId === null ? (
						<div className="flex h-full flex-col items-center justify-center p-8 text-center">
							<BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
							<h3 className="text-lg font-medium text-muted-foreground">
								Select a genre
							</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Choose a genre from the list to see its books
							</p>
						</div>
					) : isLoadingGenreDetail ? (
						<div className="p-6 space-y-4">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-4 w-32" />
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 mt-6">
								{Array.from({ length: 8 }).map((_, i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="aspect-[2/3] w-full rounded-lg" />
										<Skeleton className="h-4 w-full" />
									</div>
								))}
							</div>
						</div>
					) : selectedGenre ? (
						<>
							{/* Header with back button for mobile */}
							<div className="border-b p-4">
								<div className="flex items-center gap-3">
									<Button
										variant="ghost"
										size="icon"
										className="lg:hidden"
										onClick={handleBackToList}
									>
										<ArrowLeft className="h-5 w-5" />
									</Button>
									<div>
										<h2 className="text-xl font-bold">{selectedGenre.name}</h2>
										<p className="text-sm text-muted-foreground">
											{selectedGenre.books.length} {selectedGenre.books.length === 1 ? "book" : "books"} in this genre
										</p>
									</div>
								</div>
								{/* Subgenres */}
								{selectedGenre.children && selectedGenre.children.length > 0 && (
									<div className="mt-4 flex flex-wrap gap-2">
										{selectedGenre.children.map((child) => {
											const style = getGenreColor(child.id);
											return (
												<button
													key={child.id}
													onClick={() => handleSelectGenre(child.id)}
													className={cn(
														"inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-all hover:scale-105",
														style.bg,
														style.text
													)}
												>
													{child.name}
												</button>
											);
										})}
									</div>
								)}
								{/* Parent breadcrumb */}
								{selectedGenre.parent && (
									<div className="mt-3">
										<button
											onClick={() => handleSelectGenre(selectedGenre.parent!.id)}
											className="text-sm text-primary hover:underline flex items-center gap-1"
										>
											<ArrowLeft className="h-3 w-3" />
											Back to {selectedGenre.parent.name}
										</button>
									</div>
								)}
							</div>

							{/* Books Grid */}
							<div className="flex-1 overflow-y-auto min-h-0 p-4">
								{selectedGenre.books.length === 0 ? (
									<div className="flex h-full flex-col items-center justify-center text-center">
										<BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
										<p className="text-muted-foreground">
											No books in this genre yet
										</p>
										<Link href="/books" className="mt-2 text-sm text-primary hover:underline">
											Browse all books
										</Link>
									</div>
								) : (
									<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
										{selectedGenre.books.map((book) => (
											<Link
												key={book.id}
												href={`/books/${book.id}`}
												className="group flex flex-col rounded-lg overflow-hidden transition-transform hover:scale-[1.02]"
											>
												<div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
													{book.coverUrl ? (
														<Image
															src={book.coverUrl}
															alt={book.title}
															fill
															className="object-cover transition-opacity group-hover:opacity-90"
															sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
														/>
													) : (
														<div className="flex h-full items-center justify-center bg-secondary">
															<BookOpen className="h-12 w-12 text-muted-foreground" />
														</div>
													)}
												</div>
												<div className="mt-2 space-y-1">
													<h3 className="font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
														{book.title}
													</h3>
													{book.subtitle && (
														<p className="text-sm text-muted-foreground line-clamp-1">
															{book.subtitle}
														</p>
													)}
												</div>
											</Link>
										))}
									</div>
								)}
							</div>

							{/* View all books with this genre */}
							{selectedGenre.books.length > 0 && (
								<div className="border-t p-4">
									<Link
										href={`/books?genre=${selectedGenreId}`}
										className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
									>
										View all {selectedGenre.name} books
										<ChevronRight className="ml-1 h-4 w-4" />
									</Link>
								</div>
							)}
						</>
					) : null}
				</div>
			</div>
		</div>
	);
}
