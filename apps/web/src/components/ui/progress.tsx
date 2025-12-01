import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
	value?: number;
	max?: number;
	showLabel?: boolean;
	indicatorClassName?: string;
}

function Progress({
	className,
	value = 0,
	max = 100,
	showLabel = false,
	indicatorClassName,
	...props
}: ProgressProps) {
	const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

	return (
		<div
			data-slot="progress"
			className={cn("relative w-full", className)}
			{...props}
		>
			<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
				<div
					className={cn(
						"h-full bg-primary transition-all duration-300 ease-in-out",
						indicatorClassName
					)}
					style={{ width: `${percentage}%` }}
				/>
			</div>
			{showLabel && (
				<span className="mt-1 text-xs text-muted-foreground">
					{Math.round(percentage)}%
				</span>
			)}
		</div>
	);
}

export { Progress };
