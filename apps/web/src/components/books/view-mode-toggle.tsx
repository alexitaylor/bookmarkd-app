"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewMode } from "./types";

interface ViewModeToggleProps {
	value: ViewMode;
	onChange: (value: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
	return (
		<div className="flex rounded-md border">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => onChange("grid")}
				className={cn(
					"h-9 rounded-r-none border-r px-3",
					value === "grid"
						? "bg-accent text-accent-foreground"
						: "text-muted-foreground",
				)}
				aria-label="Grid view"
			>
				<LayoutGrid className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => onChange("list")}
				className={cn(
					"h-9 rounded-l-none px-3",
					value === "list"
						? "bg-accent text-accent-foreground"
						: "text-muted-foreground",
				)}
				aria-label="List view"
			>
				<List className="h-4 w-4" />
			</Button>
		</div>
	);
}
