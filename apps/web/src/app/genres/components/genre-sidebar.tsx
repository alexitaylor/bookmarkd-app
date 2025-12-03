"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GenreListItem } from "./genre-list-item";

interface Genre {
	id: number;
	name: string;
	parentId: number | null;
	bookCount: number | string;
}

interface GenreSidebarProps {
	genres: Genre[] | undefined;
	isLoading: boolean;
	selectedGenreId: number | null;
	onSelectGenre: (genreId: number) => void;
	isMobileDetailOpen: boolean;
}

export function GenreSidebar({
	genres,
	isLoading,
	selectedGenreId,
	onSelectGenre,
	isMobileDetailOpen,
}: GenreSidebarProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// Filter genres with books and organize hierarchically (parents with nested children)
	const filteredGenres = useMemo(() => {
		const filtered =
			genres?.filter(
				(genre) =>
					(typeof genre.bookCount === "string"
						? Number.parseInt(genre.bookCount, 10)
						: genre.bookCount) > 0 &&
					genre.name.toLowerCase().includes(searchQuery.toLowerCase()),
			) ?? [];

		// Create a map of all genres by ID for quick lookup
		const genreMap = new Map(filtered.map((g) => [g.id, g]));

		// Group children by parent ID
		const childrenByParent = new Map<number, typeof filtered>();
		for (const genre of filtered) {
			if (genre.parentId !== null) {
				const existing = childrenByParent.get(genre.parentId) ?? [];
				existing.push(genre);
				childrenByParent.set(genre.parentId, existing);
			}
		}

		// Sort children alphabetically within each parent
		for (const [parentId, children] of childrenByParent) {
			childrenByParent.set(
				parentId,
				children.sort((a, b) => a.name.localeCompare(b.name)),
			);
		}

		// Recursively add genre and its descendants
		const addGenreWithDescendants = (
			genre: (typeof filtered)[0],
			result: typeof filtered,
			visited: Set<number>,
		) => {
			if (visited.has(genre.id)) return;
			visited.add(genre.id);
			result.push(genre);

			const children = childrenByParent.get(genre.id);
			if (children) {
				for (const child of children) {
					addGenreWithDescendants(child, result, visited);
				}
			}
		};

		// Find root genres (parentId is null OR parent is not in the filtered list)
		const rootGenres = filtered
			.filter((g) => g.parentId === null || !genreMap.has(g.parentId))
			.sort((a, b) => a.name.localeCompare(b.name));

		// Build hierarchical list
		const result: typeof filtered = [];
		const visited = new Set<number>();
		for (const root of rootGenres) {
			addGenreWithDescendants(root, result, visited);
		}

		return result;
	}, [genres, searchQuery]);

	return (
		<div
			className={cn(
				"flex flex-col overflow-hidden rounded-lg border bg-card",
				isMobileDetailOpen && "hidden lg:flex",
			)}
		>
			{/* Search */}
			<div className="border-b p-4">
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search genres..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{/* Genre List */}
			<div className="min-h-0 flex-1 overflow-y-auto p-2">
				{isLoading ? (
					<div className="space-y-2 p-2">
						{Array.from({ length: 10 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
							<Skeleton key={i} className="h-16 w-full rounded-lg" />
						))}
					</div>
				) : filteredGenres.length === 0 ? (
					<div className="flex h-full items-center justify-center p-4 text-center">
						<p className="text-muted-foreground">
							{searchQuery
								? `No genres found for "${searchQuery}"`
								: "No genres available"}
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{filteredGenres.map((genre) => (
							<GenreListItem
								key={genre.id}
								genre={genre}
								isSelected={selectedGenreId === genre.id}
								onSelect={onSelectGenre}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
