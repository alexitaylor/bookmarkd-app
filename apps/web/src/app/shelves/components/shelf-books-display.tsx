"use client";

import { gridDensityClasses } from "@/components/books";
import { cn } from "@/lib/utils";
import { ShelfBookCard } from "./shelf-book-card";
import { ShelfBookListItem } from "./shelf-book-list-item";
import type {
	GridDensity,
	ShelfBook,
	ShelfType,
	ViewMode,
} from "./shelf-types";

interface ShelfBooksDisplayProps {
	books: ShelfBook[];
	viewMode: ViewMode;
	gridDensity: GridDensity;
	shelfType: ShelfType;
	isSelectMode: boolean;
	selectedBookIds: Set<number>;
	onToggleBookSelection: (bookId: number) => void;
	onResetFilters: () => void;
}

export function ShelfBooksDisplay({
	books,
	viewMode,
	gridDensity,
	shelfType,
	isSelectMode,
	selectedBookIds,
	onToggleBookSelection,
	onResetFilters,
}: ShelfBooksDisplayProps) {
	if (books.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-muted-foreground">No books match your filters.</p>
				<button
					type="button"
					onClick={onResetFilters}
					className="mt-2 text-primary text-sm hover:underline"
				>
					Clear all filters
				</button>
			</div>
		);
	}

	if (viewMode === "grid") {
		return (
			<div className={cn("grid", gridDensityClasses[gridDensity])}>
				{books.map((book) => (
					<ShelfBookCard
						key={book.id}
						book={book}
						showProgress={shelfType === "current"}
						isSelectMode={isSelectMode}
						isSelected={selectedBookIds.has(book.id)}
						onToggleSelect={() => onToggleBookSelection(book.id)}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{books.map((book) => (
				<ShelfBookListItem
					key={book.id}
					book={book}
					showProgress={shelfType === "current"}
					isSelectMode={isSelectMode}
					isSelected={selectedBookIds.has(book.id)}
					onToggleSelect={() => onToggleBookSelection(book.id)}
				/>
			))}
		</div>
	);
}
