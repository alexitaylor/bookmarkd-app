"use client";

import { Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export function SearchBar({
	value,
	onChange,
	placeholder = "Search by title or author...",
}: SearchBarProps) {
	return (
		<div className="relative w-full">
			<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
			<Input
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="pr-9 pl-9"
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
				>
					<XCircle className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
