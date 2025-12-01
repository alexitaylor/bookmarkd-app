"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/book-card";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/utils/orpc";
import { cn } from "@/lib/utils";

interface SearchBarProps {
	className?: string;
	placeholder?: string;
}

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}

export function SearchBar({
	className,
	placeholder = "Search for books, authors, or ISBN...",
}: SearchBarProps) {
	const [query, setQuery] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const debouncedQuery = useDebounce(query.trim(), 300);

	const shouldSearch = debouncedQuery.length >= 2;

	const { data: searchResults, isLoading, isFetching } = useQuery({
		queryKey: ["book", "search", { query: debouncedQuery, limit: 12 }],
		queryFn: () => client.book.search({ query: debouncedQuery, limit: 12 }),
		enabled: shouldSearch,
	});

	const showResults = isFocused && debouncedQuery.length >= 2;
	const hasResults = searchResults && searchResults.length > 0;

	// Close results when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsFocused(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleClear = () => {
		setQuery("");
	};

	return (
		<div ref={containerRef} className={cn("relative w-full", className)}>
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder={placeholder}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => setIsFocused(true)}
					className="pl-10 pr-10 h-12 text-base"
				/>
				{query && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
						onClick={handleClear}
					>
						{isFetching ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<X className="h-4 w-4" />
						)}
						<span className="sr-only">Clear search</span>
					</Button>
				)}
			</div>

			{/* Search Results */}
			{showResults && (
				<div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border bg-background shadow-lg max-h-[70vh] overflow-y-auto">
					<div className="p-4">
						{isLoading ? (
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="space-y-1.5">
										<Skeleton className="aspect-[3/4] w-full rounded-lg" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-2 w-2/3" />
									</div>
								))}
							</div>
						) : hasResults ? (
							<>
								<p className="text-sm text-muted-foreground mb-4">
									{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{debouncedQuery}&quot;
								</p>
								<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
									{searchResults.map((book) => (
										<BookCard
											key={book.id}
											id={book.id}
											title={book.title}
											coverUrl={book.coverUrl}
											authors={book.authors}
											size="sm"
										/>
									))}
								</div>
							</>
						) : (
							<div className="py-8 text-center">
								<p className="text-muted-foreground">
									No books found for &quot;{debouncedQuery}&quot;
								</p>
								<p className="text-sm text-muted-foreground mt-1">
									Try searching with different keywords
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
