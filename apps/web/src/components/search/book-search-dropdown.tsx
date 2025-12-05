"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BookSearchInput } from "./book-search-input";
import { BookSearchResults } from "./book-search-results";
import { ExternalSearchSection } from "./external-books-list";
import { useBookSearch } from "./hooks/use-book-search";

export interface BookSearchDropdownProps {
	className?: string;
	placeholder?: string;
}

/**
 * Dropdown variant of book search, used on the home page.
 * Features: grid layout, click-outside to close, keyboard navigation
 */
export function BookSearchDropdown({
	className,
	placeholder = "Search for books, authors, or ISBN...",
}: BookSearchDropdownProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);

	const {
		query,
		setQuery,
		debouncedQuery,
		showExternalResults,
		localResults,
		externalBooks,
		statusMap,
		isLoading,
		isFetching,
		isLoadingExternal,
		isLoadingMoreLocal,
		isLoadingMoreExternal,
		isAddingBook,
		addingBookIsbn,
		shouldSearch,
		hasMoreLocal,
		hasMoreExternal,
		handleSearchOnline,
		handleLoadMoreLocal,
		handleLoadMoreExternal,
		handleAddExternalBook,
		getAddedBookInfo,
		reset,
	} = useBookSearch();

	const showResults = isFocused && shouldSearch;

	// Close results when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;

			// Check if click is inside the container
			if (containerRef.current?.contains(target)) {
				return;
			}

			// Check if click is inside a Radix dropdown portal (for BookStatusDropdown)
			const dropdownContent = document.querySelector(
				"[data-radix-popper-content-wrapper]",
			);
			if (dropdownContent?.contains(target)) {
				return;
			}

			setIsFocused(false);
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Reset selected index when results change
	useEffect(() => {
		setSelectedIndex(-1);
	}, [debouncedQuery]);

	const handleClear = useCallback(() => {
		reset();
		setSelectedIndex(-1);
	}, [reset]);

	const handleClose = useCallback(() => {
		setIsFocused(false);
	}, []);

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!showResults) return;

			const totalResults = localResults.length;

			switch (e.key) {
				case "ArrowDown":
				case "ArrowRight":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev < totalResults - 1 ? prev + 1 : prev,
					);
					break;
				case "ArrowUp":
				case "ArrowLeft":
					e.preventDefault();
					setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
					break;
				case "Enter":
					if (selectedIndex >= 0 && selectedIndex < localResults.length) {
						const selectedBook = localResults[selectedIndex];
						if (selectedBook) {
							window.location.href = `/books/${selectedBook.id}`;
							handleClose();
						}
					}
					break;
				case "Escape":
					setIsFocused(false);
					inputRef.current?.blur();
					break;
			}
		},
		[showResults, localResults, selectedIndex, handleClose],
	);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: this is fine
		<div
			ref={containerRef}
			className={cn("relative w-full", className)}
			onKeyDown={handleKeyDown}
		>
			<BookSearchInput
				ref={inputRef}
				value={query}
				onChange={setQuery}
				isLoading={isFetching}
				onClear={query ? handleClear : undefined}
				onFocus={() => setIsFocused(true)}
				placeholder={placeholder}
				showBorder
				size="lg"
				className="h-12"
			/>

			{/* Search Results Dropdown */}
			{showResults && (
				<div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border bg-background shadow-lg">
					<div className="p-4">
						{isLoading ? (
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="space-y-1.5">
										<Skeleton className="aspect-[2/3] w-full rounded-lg" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-2 w-2/3" />
									</div>
								))}
							</div>
						) : localResults.length > 0 ? (
							<>
								{/* Local results in grid layout */}
								<BookSearchResults
									books={localResults}
									statusMap={statusMap}
									layout="grid"
									onBookClick={handleClose}
									hasMore={hasMoreLocal}
									onLoadMore={handleLoadMoreLocal}
									isLoadingMore={isLoadingMoreLocal}
									searchQuery={debouncedQuery}
									isLoading={false}
									shouldSearch={shouldSearch}
									selectedIndex={selectedIndex}
								/>

								{/* External search section */}
								<div className="mt-6 border-t pt-4">
									<ExternalSearchSection
										showExternalResults={showExternalResults}
										isLoadingExternal={isLoadingExternal}
										externalBooks={externalBooks}
										onSearchOnline={handleSearchOnline}
										listProps={{
											onAddBook: handleAddExternalBook,
											getAddedBookInfo,
											isAddingBook,
											addingBookIsbn,
											onBookClick: handleClose,
											hasMore: hasMoreExternal,
											onLoadMore: handleLoadMoreExternal,
											isLoadingMore: isLoadingMoreExternal,
											statusMap,
										}}
									/>
								</div>
							</>
						) : (
							<div className="py-6 text-center">
								<p className="text-muted-foreground">
									No books found in your library for &quot;{debouncedQuery}
									&quot;
								</p>

								{/* External search section when no local results */}
								<div className="mt-4">
									<ExternalSearchSection
										showExternalResults={showExternalResults}
										isLoadingExternal={isLoadingExternal}
										externalBooks={externalBooks}
										onSearchOnline={handleSearchOnline}
										listProps={{
											onAddBook: handleAddExternalBook,
											getAddedBookInfo,
											isAddingBook,
											addingBookIsbn,
											onBookClick: handleClose,
											hasMore: hasMoreExternal,
											onLoadMore: handleLoadMoreExternal,
											isLoadingMore: isLoadingMoreExternal,
											statusMap,
										}}
										noResultsMessage="No books found in online catalog either. Try different keywords."
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
