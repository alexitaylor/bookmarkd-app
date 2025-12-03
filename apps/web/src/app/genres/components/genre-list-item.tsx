"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGenreColor } from "./color-utils";

interface Genre {
	id: number;
	name: string;
	parentId: number | null;
	bookCount: number | string;
}

interface GenreListItemProps {
	genre: Genre;
	isSelected: boolean;
	onSelect: (genreId: number) => void;
}

export function GenreListItem({
	genre,
	isSelected,
	onSelect,
}: GenreListItemProps) {
	const style = getGenreColor(genre.id);
	const isSubgenre = genre.parentId !== null;
	const bookCount =
		typeof genre.bookCount === "string"
			? Number.parseInt(genre.bookCount, 10)
			: genre.bookCount;

	return (
		<button
			type="button"
			onClick={() => onSelect(genre.id)}
			className={cn(
				"w-full text-left transition-all",
				isSubgenre
					? // Subgenre styling - indented, colored border from palette
						cn(
							"ml-3 rounded-md border-l-2 py-2.5 pr-2 pl-3",
							style.borderLeft,
							"hover:bg-muted/50",
							isSelected && "bg-muted/50",
						)
					: // Main genre styling - full card
						cn(
							"mt-1 rounded-lg border p-4 hover:shadow-md",
							style.bg,
							style.border,
							isSelected && [
								"ring-2 ring-primary ring-offset-2",
								"shadow-md",
								"border-primary/50",
								"pl-5",
							],
						),
			)}
		>
			<div className="flex items-center justify-between">
				<div>
					<h3
						className={cn(
							isSubgenre
								? cn("text-sm", style.text)
								: cn("font-semibold", style.text),
							isSelected && !isSubgenre && "text-primary",
						)}
					>
						{genre.name}
					</h3>
					<p
						className={cn(
							"text-muted-foreground",
							isSubgenre ? "text-xs" : "text-sm",
						)}
					>
						{bookCount} {bookCount === 1 ? "book" : "books"}
					</p>
				</div>
				<ChevronRight
					className={cn(
						"transition-transform",
						isSubgenre
							? cn("h-4 w-4", style.text, "opacity-70")
							: cn("h-5 w-5", style.text),
						isSelected && "translate-x-0.5",
						isSelected && !isSubgenre && "text-primary",
					)}
				/>
			</div>
		</button>
	);
}
