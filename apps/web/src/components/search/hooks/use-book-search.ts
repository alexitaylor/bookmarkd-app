"use client";

import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { client } from "@/utils/orpc";

// Types
export type BookStatus =
	| "WantToRead"
	| "CurrentlyReading"
	| "Read"
	| "DNF"
	| "None";

export interface LocalBook {
	id: number;
	title: string;
	subtitle: string | null;
	coverUrl: string | null;
	isbn: string | null;
	isbn13: string | null;
	pageCount: number | null;
	authors: { id: number; name: string }[];
	genres?: string[];
}

export interface ExternalBook {
	title: string;
	subtitle: string | null;
	isbn: string | null;
	isbn13: string | null;
	synopsis: string | null;
	coverUrl: string | null;
	publisher: string | null;
	pageCount: number | null;
	language: string | null;
	datePublished: string | null;
	authors: string[];
	genres: string[];
}

export interface AddedBookInfo {
	id: number;
	pageCount: number | null;
}

export interface UseBookSearchOptions {
	/** Initial limit for local results pagination */
	initialLocalLimit?: number;
	/** Initial limit for external results pagination */
	initialExternalLimit?: number;
	/** Whether search queries should be enabled */
	enabled?: boolean;
}

export interface UseBookSearchReturn {
	// State
	query: string;
	setQuery: (query: string) => void;
	debouncedQuery: string;
	showExternalResults: boolean;
	addedBooks: Map<string, AddedBookInfo>;
	localLimit: number;
	externalLimit: number;

	// Query results
	localResults: LocalBook[];
	externalBooks: ExternalBook[];
	statusMap:
		| Record<number, { status: string; currentPage: number }>
		| undefined;

	// Loading states
	isLoading: boolean;
	isFetching: boolean;
	isLoadingExternal: boolean;
	isFetchingExternal: boolean;
	isLoadingMoreLocal: boolean;
	isLoadingMoreExternal: boolean;
	isAddingBook: boolean;
	addingBookIsbn: string | null;

	// Derived state
	shouldSearch: boolean;
	hasLocalResults: boolean;
	hasMoreLocal: boolean;
	hasMoreExternal: boolean;

	// Actions
	handleSearchOnline: () => void;
	handleLoadMoreLocal: () => void;
	handleLoadMoreExternal: () => void;
	handleAddExternalBook: (book: ExternalBook) => void;
	getAddedBookInfo: (book: ExternalBook) => AddedBookInfo | null;
	reset: () => void;
}

const DEFAULT_LOCAL_LIMIT = 12;
const DEFAULT_EXTERNAL_LIMIT = 20;

/**
 * Custom hook for debouncing a value
 */
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

/**
 * Shared hook for book search functionality.
 * Handles local DB search, external ISBNdb search, pagination,
 * user status fetching, and adding external books to library.
 */
export function useBookSearch(
	options: UseBookSearchOptions = {},
): UseBookSearchReturn {
	const {
		initialLocalLimit = DEFAULT_LOCAL_LIMIT,
		initialExternalLimit = DEFAULT_EXTERNAL_LIMIT,
		enabled = true,
	} = options;

	// State
	const [query, setQuery] = useState("");
	const [showExternalResults, setShowExternalResults] = useState(false);
	const [addedBooks, setAddedBooks] = useState<Map<string, AddedBookInfo>>(
		new Map(),
	);
	const [localLimit, setLocalLimit] = useState(initialLocalLimit);
	const [externalLimit, setExternalLimit] = useState(initialExternalLimit);
	const [isLoadingMoreLocal, setIsLoadingMoreLocal] = useState(false);
	const [isLoadingMoreExternal, setIsLoadingMoreExternal] = useState(false);

	const queryClient = useQueryClient();
	const debouncedQuery = useDebounce(query.trim(), 300);
	const shouldSearch = debouncedQuery.length >= 2;

	// Local search query
	const {
		data: searchResults,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ["book", "search", { query: debouncedQuery, limit: localLimit }],
		queryFn: () =>
			client.book.search({ query: debouncedQuery, limit: localLimit }),
		enabled: shouldSearch && enabled,
		placeholderData: keepPreviousData,
	});

	// Get user statuses for search results (including added external books)
	const localBookIds = searchResults?.local?.map((b) => b.id) ?? [];
	const addedBookIds = Array.from(addedBooks.values()).map((b) => b.id);
	const allBookIds = [...new Set([...localBookIds, ...addedBookIds])];
	const { data: statusMap } = useQuery({
		queryKey: ["userBook", "getStatusForBooks", { bookIds: allBookIds }],
		queryFn: () => client.userBook.getStatusForBooks({ bookIds: allBookIds }),
		enabled: allBookIds.length > 0 && enabled,
	});

	// External search query (manual trigger only)
	const {
		data: externalResults,
		isLoading: isLoadingExternal,
		isFetching: isFetchingExternal,
		refetch: searchExternal,
	} = useQuery({
		queryKey: [
			"book",
			"searchExternal",
			{ query: debouncedQuery, limit: externalLimit },
		],
		queryFn: () =>
			client.book.searchExternal({
				query: debouncedQuery,
				limit: externalLimit,
			}),
		enabled: false,
		placeholderData: keepPreviousData,
	});

	// Add book mutation (for external books)
	const addBookMutation = useMutation({
		mutationFn: (isbn: string) => client.book.addFromISBN({ isbn }),
		onSuccess: (book, isbn) => {
			toast.success(`"${book.title}" added to library`);
			setAddedBooks((prev) =>
				new Map(prev).set(isbn, { id: book.id, pageCount: book.pageCount }),
			);
			queryClient.invalidateQueries({ queryKey: ["book"] });
		},
		onError: (error) => {
			toast.error(`Failed to add book: ${error.message}`);
		},
	});

	// Derived data
	const localResults: LocalBook[] = searchResults?.local ?? [];
	const hasLocalResults = localResults.length > 0;
	const allExternalBooks: ExternalBook[] = externalResults?.external ?? [];

	// Check if there might be more results
	const hasMoreLocal = localResults.length === localLimit;
	const hasMoreExternal = allExternalBooks.length === externalLimit;

	// Get set of ISBNs that exist in local results
	const localIsbns = new Set(
		localResults.flatMap((book) => [book.isbn, book.isbn13].filter(Boolean)),
	);

	// Filter out external books that already exist in local results
	// But keep books that were added in this session (so we can show the dropdown)
	const externalBooks = allExternalBooks.filter((book) => {
		const isbn = book.isbn13 || book.isbn;
		if (!isbn) return true;
		// Don't filter out if we added it in this session
		if (addedBooks.has(isbn)) return true;
		// Filter out if it exists in local DB results
		return !localIsbns.has(isbn);
	});

	// Reset external results and limits when query changes
	useEffect(() => {
		setShowExternalResults(false);
		setAddedBooks(new Map());
		setLocalLimit(initialLocalLimit);
		setExternalLimit(initialExternalLimit);
		setIsLoadingMoreLocal(false);
		setIsLoadingMoreExternal(false);
	}, [debouncedQuery, initialLocalLimit, initialExternalLimit]);

	// Reset loading more states when fetching completes
	useEffect(() => {
		if (!isFetching) {
			setIsLoadingMoreLocal(false);
		}
	}, [isFetching]);

	useEffect(() => {
		if (!isFetchingExternal) {
			setIsLoadingMoreExternal(false);
		}
	}, [isFetchingExternal]);

	// Actions
	const handleSearchOnline = useCallback(() => {
		setShowExternalResults(true);
		searchExternal();
	}, [searchExternal]);

	const handleLoadMoreLocal = useCallback(() => {
		setIsLoadingMoreLocal(true);
		setLocalLimit((prev) => prev + initialLocalLimit);
	}, [initialLocalLimit]);

	const handleLoadMoreExternal = useCallback(() => {
		setIsLoadingMoreExternal(true);
		setExternalLimit((prev) => prev + initialExternalLimit);
		// Re-fetch with new limit
		setTimeout(() => searchExternal(), 0);
	}, [initialExternalLimit, searchExternal]);

	const handleAddExternalBook = useCallback(
		(book: ExternalBook) => {
			const isbn = book.isbn13 || book.isbn;
			if (!isbn) {
				toast.error("Cannot add book: No ISBN available");
				return;
			}
			addBookMutation.mutate(isbn);
		},
		[addBookMutation],
	);

	const getAddedBookInfo = useCallback(
		(book: ExternalBook): AddedBookInfo | null => {
			const isbn = book.isbn13 || book.isbn;
			return isbn ? (addedBooks.get(isbn) ?? null) : null;
		},
		[addedBooks],
	);

	const reset = useCallback(() => {
		setQuery("");
		setShowExternalResults(false);
		setAddedBooks(new Map());
		setLocalLimit(initialLocalLimit);
		setExternalLimit(initialExternalLimit);
	}, [initialLocalLimit, initialExternalLimit]);

	return {
		// State
		query,
		setQuery,
		debouncedQuery,
		showExternalResults,
		addedBooks,
		localLimit,
		externalLimit,

		// Query results
		localResults,
		externalBooks,
		statusMap,

		// Loading states
		isLoading,
		isFetching,
		isLoadingExternal,
		isFetchingExternal,
		isLoadingMoreLocal,
		isLoadingMoreExternal,
		isAddingBook: addBookMutation.isPending,
		addingBookIsbn: addBookMutation.isPending
			? (addBookMutation.variables ?? null)
			: null,

		// Derived state
		shouldSearch,
		hasLocalResults,
		hasMoreLocal,
		hasMoreExternal,

		// Actions
		handleSearchOnline,
		handleLoadMoreLocal,
		handleLoadMoreExternal,
		handleAddExternalBook,
		getAddedBookInfo,
		reset,
	};
}
