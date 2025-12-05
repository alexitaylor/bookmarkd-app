"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { BookSearchInput } from "./book-search-input";
import { BookSearchResults } from "./book-search-results";
import { ExternalSearchSection } from "./external-books-list";
import { useBookSearch } from "./hooks/use-book-search";

export interface BookSearchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Dialog variant of book search, used in the navbar.
 * Features: list layout, fixed height, keyboard navigation, ESC hint
 */
export function BookSearchDialog({ open, onOpenChange }: BookSearchDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null);
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
	} = useBookSearch({ enabled: open });

	// Reset state when dialog closes
	useEffect(() => {
		if (!open) {
			reset();
			setSelectedIndex(-1);
		}
	}, [open, reset]);

	// Auto-focus input when dialog opens
	useEffect(() => {
		if (open && inputRef.current) {
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [open]);

	// Reset selected index when results change
	useEffect(() => {
		setSelectedIndex(-1);
	}, [debouncedQuery]);

	const handleClose = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const totalResults = localResults.length;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev < totalResults - 1 ? prev + 1 : prev,
					);
					break;
				case "ArrowUp":
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
			}
		},
		[localResults, selectedIndex, handleClose],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="w-[90vw] max-w-none gap-0 p-0 sm:w-[60vw] sm:max-w-none"
				showCloseButton={false}
				onKeyDown={handleKeyDown}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Search Books</DialogTitle>
				</DialogHeader>

				{/* Search Input */}
				<div className="border-border border-b">
					<BookSearchInput
						ref={inputRef}
						value={query}
						onChange={setQuery}
						isLoading={isLoading || isFetching}
						placeholder="Search books by title, author, or ISBN..."
					/>
				</div>

				{/* Results - Fixed height to prevent flickering */}
				<div className="h-[60vh] overflow-y-auto">
					{/* Local results */}
					<BookSearchResults
						books={localResults}
						statusMap={statusMap}
						layout="list"
						onBookClick={handleClose}
						hasMore={hasMoreLocal}
						onLoadMore={handleLoadMoreLocal}
						isLoadingMore={isLoadingMoreLocal}
						searchQuery={debouncedQuery}
						isLoading={isLoading}
						shouldSearch={shouldSearch}
						selectedIndex={selectedIndex}
					/>

					{/* External search section */}
					{shouldSearch && localResults.length > 0 && (
						<div className="border-border border-t p-4">
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
					)}

					{/* External search when no local results */}
					{shouldSearch && !isLoading && localResults.length === 0 && (
						<div className="p-4">
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
					)}
				</div>

				{/* Footer with keyboard hints */}
				<div className="border-border border-t px-4 py-2">
					<p className="text-muted-foreground text-xs">
						<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
							↑↓
						</kbd>{" "}
						to navigate{" "}
						<kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
							Enter
						</kbd>{" "}
						to select{" "}
						<kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
							Esc
						</kbd>{" "}
						to close
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
