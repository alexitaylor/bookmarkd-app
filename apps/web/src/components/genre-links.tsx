"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Color palette for genre tags - visually appealing colors that work in light/dark mode
const colorPalette = [
	{ bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
	{ bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
	{ bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
	{ bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
	{ bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
	{ bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
	{ bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
	{ bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
	{ bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
	{ bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
	{ bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
	{ bg: "bg-lime-100 dark:bg-lime-900/30", text: "text-lime-700 dark:text-lime-300" },
	{ bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-300" },
	{ bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300" },
	{ bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
];

// Get a consistent color for a genre based on its ID (deterministic, not random)
function getGenreColor(genreId: number) {
	return colorPalette[genreId % colorPalette.length];
}

interface GenreLinksProps {
	className?: string;
}

export function GenreLinks({ className }: GenreLinksProps) {
	const { data: genres, isLoading } = useQuery(
		orpc.genre.getPopular.queryOptions({ limit: 20 })
	);

	if (isLoading) {
		return (
			<div className={cn("flex flex-wrap gap-2", className)}>
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-9 w-24 rounded-full" />
				))}
			</div>
		);
	}

	if (!genres || genres.length === 0) {
		return null;
	}

	return (
		<div className={cn("flex flex-wrap gap-2", className)}>
			{genres.map((genre) => {
				const style = getGenreColor(genre.id);
				return (
					<Link
						key={genre.id}
						href={`/books?genre=${genre.id}` as "/books"}
						className={cn(
							"inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all",
							"hover:scale-105 hover:shadow-md",
							style.bg,
							style.text
						)}
					>
						{genre.name}
					</Link>
				);
			})}
		</div>
	);
}
