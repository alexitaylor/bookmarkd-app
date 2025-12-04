import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, eq, inArray } from "drizzle-orm";

// Book status type matching the database enum
export type BookStatus =
	| "WantToRead"
	| "CurrentlyReading"
	| "Read"
	| "DNF"
	| "None";

// Shared types
export interface ShelfBook {
	id: number;
	bookId: number;
	status: string;
	currentPage: number;
	rating: number | null;
	startedAt: Date | null;
	finishedAt: Date | null;
	bookTitle: string;
	bookCoverUrl: string | null;
	bookPageCount: number | null;
	bookDatePublished: string | null;
	bookSynopsis: string | null;
	bookAuthors: string | null;
}

// Get authors for a list of book IDs as a string map
export async function getAuthorsStringForBooks(
	bookIds: number[],
): Promise<Record<number, string>> {
	if (bookIds.length === 0) {
		return {};
	}

	const bookAuthors = await db
		.select({
			bookId: bookAuthor.bookId,
			authorName: author.name,
		})
		.from(bookAuthor)
		.innerJoin(author, eq(author.id, bookAuthor.authorId))
		.where(inArray(bookAuthor.bookId, bookIds));

	// Group authors by book
	const authorsByBook: Record<number, string[]> = {};
	for (const ba of bookAuthors) {
		if (!authorsByBook[ba.bookId]) {
			authorsByBook[ba.bookId] = [];
		}
		authorsByBook[ba.bookId]?.push(ba.authorName);
	}

	// Convert to string format
	const result: Record<number, string> = {};
	for (const [bookId, authors] of Object.entries(authorsByBook)) {
		result[Number(bookId)] = authors.join(", ");
	}

	return result;
}

// Get user books with book info for a specific status or all statuses
export async function getUserBooksWithDetails(
	userId: string,
	status?: BookStatus,
): Promise<ShelfBook[]> {
	const baseQuery = db
		.select({
			id: userBook.id,
			bookId: userBook.bookId,
			status: userBook.status,
			currentPage: userBook.currentPage,
			rating: userBook.rating,
			startedAt: userBook.startedAt,
			finishedAt: userBook.finishedAt,
			bookTitle: book.title,
			bookCoverUrl: book.coverUrl,
			bookPageCount: book.pageCount,
			bookDatePublished: book.datePublished,
			bookSynopsis: book.synopsis,
		})
		.from(userBook)
		.innerJoin(book, eq(book.id, userBook.bookId));

	const userBooks = status
		? await baseQuery
				.where(and(eq(userBook.userId, userId), eq(userBook.status, status)))
				.orderBy(userBook.updatedAt)
		: await baseQuery
				.where(eq(userBook.userId, userId))
				.orderBy(userBook.updatedAt);

	// Get authors for all books in one query
	const bookIds = userBooks.map((ub) => ub.bookId);
	const authorsByBook = await getAuthorsStringForBooks(bookIds);

	// Add authors to user books
	return userBooks.map((ub) => ({
		...ub,
		bookAuthors: authorsByBook[ub.bookId] || null,
	}));
}

// Find existing user book entry
export async function findUserBook(userId: string, bookId: number) {
	const [existing] = await db
		.select()
		.from(userBook)
		.where(and(eq(userBook.userId, userId), eq(userBook.bookId, bookId)))
		.limit(1);

	return existing || null;
}
