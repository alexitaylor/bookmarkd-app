import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre } from "@bookmarkd/db/schema/genre";
import { review } from "@bookmarkd/db/schema/review";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

// Shared types
export interface BookListItem {
	id: number;
	title: string;
	subtitle: string | null;
	coverUrl: string | null;
	pageCount: number | null;
	publisher: string | null;
	datePublished: string | null;
	synopsis: string | null;
	addCount: number;
	avgRating: number;
	reviewCount: number;
	authors: { id: number; name: string }[];
}

export interface BookListResult {
	books: BookListItem[];
	hasMore: boolean;
}

// Options for building book list queries
export interface BookListQueryOptions {
	limit: number;
	offset: number;
	genreId?: number;
	searchQuery?: string;
	orderBy: "popular" | "recent" | "title" | "rating";
}

// Get authors for a list of book IDs
export async function getAuthorsForBooks(
	bookIds: number[],
): Promise<Map<number, { id: number; name: string }[]>> {
	if (bookIds.length === 0) {
		return new Map();
	}

	const bookAuthors = await db
		.select({
			bookId: bookAuthor.bookId,
			authorId: author.id,
			authorName: author.name,
		})
		.from(bookAuthor)
		.innerJoin(author, eq(author.id, bookAuthor.authorId))
		.where(inArray(bookAuthor.bookId, bookIds));

	const authorsByBook = new Map<number, { id: number; name: string }[]>();
	for (const ba of bookAuthors) {
		if (!authorsByBook.has(ba.bookId)) {
			authorsByBook.set(ba.bookId, []);
		}
		authorsByBook.get(ba.bookId)!.push({
			id: ba.authorId,
			name: ba.authorName,
		});
	}

	return authorsByBook;
}

// Build and execute a book list query with common filters
export async function queryBookList(
	options: BookListQueryOptions,
): Promise<BookListResult> {
	const { limit, offset, genreId, searchQuery, orderBy } = options;

	// Build base query
	let dbQuery = db
		.select({
			id: book.id,
			title: book.title,
			subtitle: book.subtitle,
			coverUrl: book.coverUrl,
			pageCount: book.pageCount,
			publisher: book.publisher,
			datePublished: book.datePublished,
			synopsis: book.synopsis,
			createdAt: book.createdAt,
			addCount: sql<number>`count(distinct ${userBook.id})`.as("add_count"),
			avgRating: sql<number>`coalesce(avg(${review.rating}), 0)`.as(
				"avg_rating",
			),
			reviewCount: sql<number>`count(distinct ${review.id})`.as("review_count"),
		})
		.from(book)
		.leftJoin(userBook, eq(userBook.bookId, book.id))
		.leftJoin(review, eq(review.bookId, book.id))
		.$dynamic();

	// Build where conditions
	const conditions: ReturnType<typeof eq>[] = [];

	// Add genre filter if provided
	if (genreId) {
		dbQuery = dbQuery.innerJoin(bookGenre, eq(bookGenre.bookId, book.id));
		conditions.push(eq(bookGenre.genreId, genreId));
	}

	// Add search query filter if provided
	if (searchQuery && searchQuery.trim().length > 0) {
		const pattern = `%${searchQuery.trim()}%`;
		conditions.push(
			sql`(${book.title} ILIKE ${pattern} OR ${book.subtitle} ILIKE ${pattern})`,
		);
	}

	// Apply conditions
	if (conditions.length > 0) {
		dbQuery = dbQuery.where(and(...conditions));
	}

	// Apply ordering and execute query
	const getOrderedQuery = () => {
		const grouped = dbQuery.groupBy(book.id);
		switch (orderBy) {
			case "popular":
				return grouped.orderBy(
					desc(sql`count(distinct ${userBook.id})`),
					desc(sql`coalesce(avg(${review.rating}), 0)`),
				);
			case "recent":
				return grouped.orderBy(desc(book.createdAt));
			case "title":
				return grouped.orderBy(asc(book.title));
			case "rating":
				return grouped.orderBy(
					desc(sql`coalesce(avg(${review.rating}), 0)`),
					desc(sql`count(distinct ${review.id})`),
				);
		}
	};

	const results = await getOrderedQuery().limit(limit).offset(offset);

	if (results.length === 0) {
		return { books: [], hasMore: false };
	}

	// Get authors for each book
	const bookIds = results.map((b) => b.id);
	const authorsByBook = await getAuthorsForBooks(bookIds);

	const books = results.map((b) => ({
		id: b.id,
		title: b.title,
		subtitle: b.subtitle,
		coverUrl: b.coverUrl,
		pageCount: b.pageCount,
		publisher: b.publisher,
		datePublished: b.datePublished,
		synopsis: b.synopsis,
		addCount: b.addCount,
		avgRating: b.avgRating,
		reviewCount: b.reviewCount,
		authors: authorsByBook.get(b.id) || [],
	}));

	return {
		books,
		hasMore: books.length === limit,
	};
}
