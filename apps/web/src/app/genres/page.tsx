"use client";

import { useQuery } from "@tanstack/react-query";
import { Library } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import { orpc } from "@/utils/orpc";
import { GenreBreadcrumb, GenreDetail, GenreSidebar } from "./components";

export default function GenresPage() {
	const [selectedGenreId, setSelectedGenreId] = useQueryState(
		"id",
		parseAsInteger,
	);
	const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

	// Fetch popular genres with book count
	const { data: genres, isLoading: isLoadingGenres } = useQuery(
		orpc.genre.getPopular.queryOptions({ limit: 50 }),
	);

	// Fetch selected genre details with books
	const genreQueryOptions =
		selectedGenreId !== null
			? orpc.genre.getById.queryOptions({ input: { id: selectedGenreId } })
			: {
					queryKey: ["genre", "getById", "disabled"] as const,
					queryFn: () => Promise.resolve(null),
				};

	const { data: selectedGenre, isLoading: isLoadingGenreDetail } = useQuery({
		...genreQueryOptions,
		enabled: selectedGenreId !== null,
	});

	const handleSelectGenre = (genreId: number) => {
		setSelectedGenreId(genreId);
		setIsMobileDetailOpen(true);
	};

	const handleBackToList = () => {
		setIsMobileDetailOpen(false);
	};

	const handleClearSelection = () => {
		setSelectedGenreId(null);
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Breadcrumbs */}
			<GenreBreadcrumb
				selectedGenre={selectedGenre}
				onClearSelection={handleClearSelection}
				onSelectGenre={handleSelectGenre}
			/>

			{/* Header */}
			<div className="mb-6">
				<h1 className="flex items-center gap-3 font-bold text-3xl">
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
				<GenreSidebar
					genres={genres}
					isLoading={isLoadingGenres}
					selectedGenreId={selectedGenreId}
					onSelectGenre={handleSelectGenre}
					isMobileDetailOpen={isMobileDetailOpen}
				/>

				{/* Genre Detail (Detail) */}
				<GenreDetail
					selectedGenreId={selectedGenreId}
					selectedGenre={selectedGenre}
					isLoading={isLoadingGenreDetail}
					isMobileDetailOpen={isMobileDetailOpen}
					onSelectGenre={handleSelectGenre}
					onBackToList={handleBackToList}
				/>
			</div>
		</div>
	);
}
