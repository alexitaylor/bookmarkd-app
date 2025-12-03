// Color palette for genre cards - consistent with genre-links
export const colorPalette = [
	{
		bg: "bg-purple-100 dark:bg-purple-900/30",
		text: "text-purple-700 dark:text-purple-300",
		border: "border-purple-200 dark:border-purple-800",
		borderLeft: "border-l-purple-400 dark:border-l-purple-600",
	},
	{
		bg: "bg-blue-100 dark:bg-blue-900/30",
		text: "text-blue-700 dark:text-blue-300",
		border: "border-blue-200 dark:border-blue-800",
		borderLeft: "border-l-blue-400 dark:border-l-blue-600",
	},
	{
		bg: "bg-pink-100 dark:bg-pink-900/30",
		text: "text-pink-700 dark:text-pink-300",
		border: "border-pink-200 dark:border-pink-800",
		borderLeft: "border-l-pink-400 dark:border-l-pink-600",
	},
	{
		bg: "bg-amber-100 dark:bg-amber-900/30",
		text: "text-amber-700 dark:text-amber-300",
		border: "border-amber-200 dark:border-amber-800",
		borderLeft: "border-l-amber-400 dark:border-l-amber-600",
	},
	{
		bg: "bg-emerald-100 dark:bg-emerald-900/30",
		text: "text-emerald-700 dark:text-emerald-300",
		border: "border-emerald-200 dark:border-emerald-800",
		borderLeft: "border-l-emerald-400 dark:border-l-emerald-600",
	},
	{
		bg: "bg-rose-100 dark:bg-rose-900/30",
		text: "text-rose-700 dark:text-rose-300",
		border: "border-rose-200 dark:border-rose-800",
		borderLeft: "border-l-rose-400 dark:border-l-rose-600",
	},
	{
		bg: "bg-teal-100 dark:bg-teal-900/30",
		text: "text-teal-700 dark:text-teal-300",
		border: "border-teal-200 dark:border-teal-800",
		borderLeft: "border-l-teal-400 dark:border-l-teal-600",
	},
	{
		bg: "bg-indigo-100 dark:bg-indigo-900/30",
		text: "text-indigo-700 dark:text-indigo-300",
		border: "border-indigo-200 dark:border-indigo-800",
		borderLeft: "border-l-indigo-400 dark:border-l-indigo-600",
	},
	{
		bg: "bg-orange-100 dark:bg-orange-900/30",
		text: "text-orange-700 dark:text-orange-300",
		border: "border-orange-200 dark:border-orange-800",
		borderLeft: "border-l-orange-400 dark:border-l-orange-600",
	},
	{
		bg: "bg-cyan-100 dark:bg-cyan-900/30",
		text: "text-cyan-700 dark:text-cyan-300",
		border: "border-cyan-200 dark:border-cyan-800",
		borderLeft: "border-l-cyan-400 dark:border-l-cyan-600",
	},
	{
		bg: "bg-violet-100 dark:bg-violet-900/30",
		text: "text-violet-700 dark:text-violet-300",
		border: "border-violet-200 dark:border-violet-800",
		borderLeft: "border-l-violet-400 dark:border-l-violet-600",
	},
	{
		bg: "bg-lime-100 dark:bg-lime-900/30",
		text: "text-lime-700 dark:text-lime-300",
		border: "border-lime-200 dark:border-lime-800",
		borderLeft: "border-l-lime-400 dark:border-l-lime-600",
	},
	{
		bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
		text: "text-fuchsia-700 dark:text-fuchsia-300",
		border: "border-fuchsia-200 dark:border-fuchsia-800",
		borderLeft: "border-l-fuchsia-400 dark:border-l-fuchsia-600",
	},
	{
		bg: "bg-sky-100 dark:bg-sky-900/30",
		text: "text-sky-700 dark:text-sky-300",
		border: "border-sky-200 dark:border-sky-800",
		borderLeft: "border-l-sky-400 dark:border-l-sky-600",
	},
	{
		bg: "bg-yellow-100 dark:bg-yellow-900/30",
		text: "text-yellow-700 dark:text-yellow-300",
		border: "border-yellow-200 dark:border-yellow-800",
		borderLeft: "border-l-yellow-400 dark:border-l-yellow-600",
	},
];

export type GenreColorStyle = (typeof colorPalette)[number];

export function getGenreColor(genreId: number): GenreColorStyle {
	return colorPalette[genreId % colorPalette.length];
}
