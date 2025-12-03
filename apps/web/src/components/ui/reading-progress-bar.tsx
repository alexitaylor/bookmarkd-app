"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ReadingProgressBarProps {
	currentPage: number;
	pageCount: number | null;
	/** Height of the progress bar. Defaults to "h-2" */
	height?: string;
	/** Show the percentage text */
	showPercentage?: boolean;
	/** Show the page count text (e.g., "Page 50 of 200") */
	showPageCount?: boolean;
	/** Additional className for the container */
	className?: string;
}

/**
 * Get the progress bar color based on percentage.
 * - 0-24%: red (just started)
 * - 25-49%: orange (getting into it)
 * - 50-74%: yellow (halfway there)
 * - 75-99%: emerald (almost done)
 * - 100%: green (finished)
 */
export function getProgressColor(percent: number): string {
	if (percent >= 100) return "bg-green-500";
	if (percent >= 75) return "bg-emerald-500";
	if (percent >= 50) return "bg-yellow-500";
	if (percent >= 25) return "bg-orange-500";
	return "bg-red-500";
}

export function ReadingProgressBar({
	currentPage,
	pageCount,
	height = "h-2",
	showPercentage = false,
	showPageCount = false,
	className,
}: ReadingProgressBarProps) {
	if (!pageCount || pageCount <= 0) return null;

	const progress = Math.round((currentPage / pageCount) * 100);
	const progressColor = getProgressColor(progress);

	return (
		<div className={cn("space-y-1", className)}>
			<Progress
				value={progress}
				className={height}
				indicatorClassName={progressColor}
			/>
			{(showPercentage || showPageCount) && (
				<div className="flex items-center justify-between text-muted-foreground text-xs">
					{showPageCount && (
						<span>
							Page {currentPage} of {pageCount}
						</span>
					)}
					{showPercentage && <span>{progress}%</span>}
				</div>
			)}
		</div>
	);
}
