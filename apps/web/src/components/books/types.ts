export type ViewMode = "grid" | "list";
export type GridDensity = "compact" | "comfortable" | "spacious";
export type RatingFilterOption =
	| "all"
	| "5"
	| "4"
	| "3"
	| "2"
	| "1"
	| "unrated";

export const viewModeOptions = ["grid", "list"] as const;
export const gridDensityOptions = [
	"compact",
	"comfortable",
	"spacious",
] as const;
export const ratingFilterOptions = [
	"all",
	"5",
	"4",
	"3",
	"2",
	"1",
	"unrated",
] as const;

export const gridDensityClasses: Record<GridDensity, string> = {
	compact:
		"grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7",
	comfortable: "grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
	spacious: "grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};
