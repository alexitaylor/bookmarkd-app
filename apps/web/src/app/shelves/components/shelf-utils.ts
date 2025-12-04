import type { ShelfBook, ShelfType } from "./shelf-types";

// Get unique years from finished dates
export function getYearOptions(books: ShelfBook[]): number[] {
	const years = new Set<number>();
	for (const book of books) {
		if (book.finishedAt) {
			const year = new Date(book.finishedAt).getFullYear();
			years.add(year);
		}
	}
	return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
}

// Export to CSV
export function exportToCSV(books: ShelfBook[], shelfType: ShelfType) {
	const headers = [
		"Title",
		"Author",
		"Pages",
		"Rating",
		"Status",
		"Current Page",
		"Date Published",
	];
	const rows = books.map((book) => [
		`"${book.bookTitle.replace(/"/g, '""')}"`,
		`"${(book.bookAuthors || "").replace(/"/g, '""')}"`,
		book.bookPageCount || "",
		book.rating || "",
		book.status,
		book.currentPage,
		book.bookDatePublished || "",
	]);

	const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
		"\n",
	);

	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = `${shelfType}-shelf-export.csv`;
	link.click();
	URL.revokeObjectURL(link.href);
}

// Export to JSON
export function exportToJSON(books: ShelfBook[], shelfType: ShelfType) {
	const jsonData = books.map((book) => ({
		title: book.bookTitle,
		author: book.bookAuthors,
		pages: book.bookPageCount,
		rating: book.rating,
		status: book.status,
		currentPage: book.currentPage,
		datePublished: book.bookDatePublished,
		startedAt: book.startedAt,
		finishedAt: book.finishedAt,
	}));

	const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
		type: "application/json",
	});
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = `${shelfType}-shelf-export.json`;
	link.click();
	URL.revokeObjectURL(link.href);
}
