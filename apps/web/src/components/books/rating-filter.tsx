"use client";

import { Star } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { RatingFilterOption } from "./types";

interface RatingFilterProps {
	value: RatingFilterOption;
	onChange: (value: RatingFilterOption) => void;
}

export function RatingFilter({ value, onChange }: RatingFilterProps) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-[130px]">
				<div className="flex flex-row items-center gap-1">
					<Star className="mr-2 h-4 w-4 text-yellow-500" />
					<SelectValue placeholder="Rating" />
				</div>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">All</SelectItem>
				<SelectItem value="5">5 Stars</SelectItem>
				<SelectItem value="4">4+ Stars</SelectItem>
				<SelectItem value="3">3+ Stars</SelectItem>
				<SelectItem value="2">2+ Stars</SelectItem>
				<SelectItem value="1">1+ Stars</SelectItem>
				<SelectItem value="unrated">Unrated</SelectItem>
			</SelectContent>
		</Select>
	);
}
