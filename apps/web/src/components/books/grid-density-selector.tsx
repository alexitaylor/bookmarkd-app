"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { GridDensity } from "./types";

interface GridDensitySelectorProps {
	value: GridDensity;
	onChange: (value: GridDensity) => void;
}

export function GridDensitySelector({
	value,
	onChange,
}: GridDensitySelectorProps) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-[140px]">
				<SelectValue placeholder="Density" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="compact">Compact</SelectItem>
				<SelectItem value="comfortable">Comfortable</SelectItem>
				<SelectItem value="spacious">Spacious</SelectItem>
			</SelectContent>
		</Select>
	);
}
