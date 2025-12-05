"use client";

import { Loader2, Search, X } from "lucide-react";
import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BookSearchInputProps {
	value: string;
	onChange: (value: string) => void;
	isLoading?: boolean;
	onClear?: () => void;
	onFocus?: () => void;
	placeholder?: string;
	className?: string;
	/** Show border styling (for dropdown variant) */
	showBorder?: boolean;
	/** Input size variant */
	size?: "default" | "lg";
}

export const BookSearchInput = forwardRef<
	HTMLInputElement,
	BookSearchInputProps
>(
	(
		{
			value,
			onChange,
			isLoading = false,
			onClear,
			onFocus,
			placeholder = "Search books by title, author, or ISBN...",
			className,
			showBorder = false,
			size = "default",
		},
		ref,
	) => {
		const showClearButton = value && onClear;

		return (
			<div
				className={cn(
					"flex items-center gap-3 px-4 py-3",
					showBorder && "rounded-lg border bg-background",
					className,
				)}
			>
				<Search className="h-5 w-5 shrink-0 text-muted-foreground" />
				<input
					ref={ref}
					type="text"
					placeholder={placeholder}
					className={cn(
						"flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
						size === "lg" ? "text-base" : "text-sm",
					)}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onFocus={onFocus}
				/>
				{isLoading && (
					<Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
				)}
				{showClearButton && !isLoading && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-6 w-6 shrink-0"
						onClick={onClear}
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Clear search</span>
					</Button>
				)}
			</div>
		);
	},
);

BookSearchInput.displayName = "BookSearchInput";
