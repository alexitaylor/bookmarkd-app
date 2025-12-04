"use client";

import {
	CheckSquare,
	FileJson,
	FileSpreadsheet,
	RotateCcw,
	Star,
	XCircle,
} from "lucide-react";
import {
	type GridDensity,
	GridDensitySelector,
	type ViewMode,
	ViewModeToggle,
} from "@/components/books";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ShareShelfDialog } from "./share-shelf-dialog";
import type {
	RatingOption,
	ShelfBook,
	ShelfType,
	SortOption,
} from "./shelf-types";

interface ShelfFiltersProps {
	// Sort
	sortBy: SortOption;
	onSortChange: (value: SortOption) => void;
	// Rating filter
	ratingFilter: RatingOption;
	onRatingFilterChange: (value: RatingOption) => void;
	// Year filter
	yearFilter: string;
	onYearFilterChange: (value: string) => void;
	availableYears: number[];
	// View mode
	viewMode: ViewMode;
	onViewModeChange: (value: ViewMode) => void;
	// Grid density
	gridDensity: GridDensity;
	onGridDensityChange: (value: GridDensity) => void;
	// Select mode
	isSelectMode: boolean;
	onToggleSelectMode: () => void;
	// Export functions
	onExportCSV: () => void;
	onExportJSON: () => void;
	// Share
	shelfType: ShelfType;
	filteredBooks: ShelfBook[];
	// Active filters
	hasActiveFilters: boolean;
	onResetFilters: () => void;
}

export function ShelfFilters({
	sortBy,
	onSortChange,
	ratingFilter,
	onRatingFilterChange,
	yearFilter,
	onYearFilterChange,
	availableYears,
	viewMode,
	onViewModeChange,
	gridDensity,
	onGridDensityChange,
	isSelectMode,
	onToggleSelectMode,
	onExportCSV,
	onExportJSON,
	shelfType,
	filteredBooks,
	hasActiveFilters,
	onResetFilters,
}: ShelfFiltersProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Sort */}
			<Select value={sortBy} onValueChange={onSortChange}>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Sort by" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="dateAdded">Date Added</SelectItem>
					<SelectItem value="title">Title (A-Z)</SelectItem>
					<SelectItem value="author">Author (A-Z)</SelectItem>
					<SelectItem value="ratingDesc">Rating (High to Low)</SelectItem>
					<SelectItem value="ratingAsc">Rating (Low to High)</SelectItem>
					<SelectItem value="pagesDesc">Pages (Most)</SelectItem>
					<SelectItem value="pagesAsc">Pages (Least)</SelectItem>
					{shelfType === "current" && (
						<SelectItem value="progress">Progress (%)</SelectItem>
					)}
				</SelectContent>
			</Select>

			{/* Rating Filter */}
			<Select value={ratingFilter} onValueChange={onRatingFilterChange}>
				<SelectTrigger className="w-[130px]">
					<Star className="mr-2 h-4 w-4 text-yellow-500" />
					<SelectValue placeholder="Rating" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All</SelectItem>
					<SelectItem value="5">5 Stars</SelectItem>
					<SelectItem value="4">4 Stars</SelectItem>
					<SelectItem value="3">3 Stars</SelectItem>
					<SelectItem value="2">2 Stars</SelectItem>
					<SelectItem value="1">1 Star</SelectItem>
					<SelectItem value="unrated">Unrated</SelectItem>
				</SelectContent>
			</Select>

			{/* Year Filter (only for "read" shelf) */}
			{shelfType === "read" && availableYears.length > 0 && (
				<Select value={yearFilter} onValueChange={onYearFilterChange}>
					<SelectTrigger className="w-[120px]">
						<SelectValue placeholder="Year" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Years</SelectItem>
						{availableYears.map((year) => (
							<SelectItem key={year} value={year.toString()}>
								{year}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{/* Reset Filters */}
			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onResetFilters}
					className="h-10 px-3 text-muted-foreground hover:text-foreground"
				>
					<RotateCcw className="mr-1.5 h-4 w-4" />
					Reset
				</Button>
			)}

			{/* Divider */}
			<div className="hidden h-10 w-px bg-border sm:block" />

			{/* Grid Density (only in grid view) */}
			{viewMode === "grid" && (
				<GridDensitySelector
					value={gridDensity}
					onChange={onGridDensityChange}
				/>
			)}

			{/* View Toggle */}
			<ViewModeToggle value={viewMode} onChange={onViewModeChange} />

			{/* Divider */}
			<div className="hidden h-10 w-px bg-border sm:block" />

			{/* Select Mode Toggle */}
			<Button
				variant={isSelectMode ? "secondary" : "outline"}
				size="sm"
				onClick={onToggleSelectMode}
				className="h-9"
			>
				{isSelectMode ? (
					<>
						<XCircle className="mr-1.5 h-4 w-4" />
						Cancel
					</>
				) : (
					<>
						<CheckSquare className="mr-1.5 h-4 w-4" />
						Select
					</>
				)}
			</Button>

			{/* Export Buttons */}
			<div className="flex rounded-md border">
				<Button
					variant="ghost"
					size="sm"
					onClick={onExportCSV}
					className="h-9 rounded-r-none border-r px-3"
					title="Export as CSV"
				>
					<FileSpreadsheet className="mr-1.5 h-4 w-4" />
					CSV
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onExportJSON}
					className="h-9 rounded-l-none px-3"
					title="Export as JSON"
				>
					<FileJson className="mr-1.5 h-4 w-4" />
					JSON
				</Button>
			</div>

			{/* Share Button */}
			<ShareShelfDialog
				shelfType={shelfType}
				books={filteredBooks}
				booksCount={filteredBooks.length}
			/>
		</div>
	);
}
