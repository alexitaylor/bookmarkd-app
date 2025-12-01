"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Genre icons/colors mapping for visual variety
const genreStyles: Record<string, { bg: string; text: string }> = {
	Fantasy: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
	"Science Fiction": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
	Romance: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
	Mystery: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
	Thriller: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
	Horror: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
	"Literary Fiction": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
	"Historical Fiction": { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
	Biography: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
	"Self-Help": { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
};

const defaultStyle = { bg: "bg-secondary", text: "text-secondary-foreground" };

interface GenreLinksProps {
	className?: string;
}

export function GenreLinks({ className }: GenreLinksProps) {
	const { data: genres, isLoading } = useQuery(
		orpc.genre.getAll.queryOptions({ topLevelOnly: true })
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
				const style = genreStyles[genre.name] || defaultStyle;
				return (
					<Link
						key={genre.id}
						href={`/books?genre=${genre.id}`}
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
