"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface ReadingStatsProps {
	className?: string;
	/** Default to compact view */
	defaultCompact?: boolean;
	/** Hide the toggle button (always show the default view) */
	hideToggle?: boolean;
}

export function ReadingStats({
	className,
	defaultCompact = true,
	hideToggle = false,
}: ReadingStatsProps) {
	const [isCompact, setIsCompact] = useState(defaultCompact);
	const { data: stats, isLoading } = useQuery(
		orpc.userBook.getStats.queryOptions(),
	);

	if (isLoading) {
		return (
			<div className={cn("space-y-4", className)}>
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">Your Stats</h3>
				</div>
				<div className="grid gap-3 sm:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
						<Skeleton key={i} className="h-20 w-full rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	if (!stats) return null;

	const compactView = (
		<div className="grid gap-3 sm:grid-cols-3">
			<StatCard
				value={stats.booksReadThisYear}
				label="Books This Year"
				href="/shelves?tab=read"
			/>
			<StatCard value={stats.pagesReadThisYear} label="Pages Read" />
			<StatCard
				value={stats.currentlyReading}
				label="Reading Now"
				href="/shelves?tab=current"
			/>
		</div>
	);

	const expandedView = (
		<div className="space-y-6">
			{/* Reading Activity */}
			<div className="space-y-3">
				<h4 className="text-muted-foreground text-sm">Reading Activity</h4>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<StatCard
						value={stats.booksReadThisYear}
						label="Books This Year"
						href="/shelves?tab=read"
					/>
					<StatCard value={stats.booksThisMonth} label="Books This Month" />
					<StatCard value={stats.avgPagesPerDay} label="Avg Pages/Day" />
					<StatCard
						value={stats.readingStreak}
						label={`Day${stats.readingStreak !== 1 ? "s" : ""} Streak`}
					/>
				</div>
			</div>

			{/* Achievement Stats */}
			<div className="space-y-3">
				<h4 className="text-muted-foreground text-sm">Achievements</h4>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					<StatCard
						value={
							stats.longestBookRead
								? `${stats.longestBookRead.pages.toLocaleString()} pg`
								: "—"
						}
						label="Longest Book"
						subtitle={stats.longestBookRead?.title}
					/>
					<StatCard value={stats.favoriteGenre || "—"} label="Favorite Genre" />
					<StatCard value={stats.uniqueAuthorsRead} label="Authors Read" />
				</div>
			</div>

			{/* Time Stats */}
			<div className="space-y-3">
				<h4 className="text-muted-foreground text-sm">Reading Pace</h4>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					<StatCard
						value={stats.avgBookLength ? `${stats.avgBookLength} pg` : "—"}
						label="Avg Book Length"
					/>
					<StatCard
						value={
							stats.avgDaysToFinish
								? `${stats.avgDaysToFinish} day${stats.avgDaysToFinish !== 1 ? "s" : ""}`
								: "—"
						}
						label="Avg Time to Finish"
					/>
					<StatCard
						value={
							stats.fastestRead
								? `${stats.fastestRead.days} day${stats.fastestRead.days !== 1 ? "s" : ""}`
								: "—"
						}
						label="Fastest Read"
						subtitle={stats.fastestRead?.title}
					/>
				</div>
			</div>
		</div>
	);

	return (
		<div className={cn("flex flex-col justify-around space-y-4", className)}>
			<div className="flex items-center justify-between">
				<h3 className="font-semibold">Your Stats</h3>
				{!hideToggle && (
					<Toggle
						variant="outline"
						size="default"
						className="px-3"
						pressed={!isCompact}
						onPressedChange={(pressed) => setIsCompact(!pressed)}
						aria-label={isCompact ? "Show more stats" : "Show fewer stats"}
					>
						{isCompact ? (
							<>
								<LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								<span className="text-sm">More</span>
							</>
						) : (
							<>
								<LayoutList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
								<span className="text-sm">Less</span>
							</>
						)}
					</Toggle>
				)}
			</div>
			{isCompact ? compactView : expandedView}
		</div>
	);
}
