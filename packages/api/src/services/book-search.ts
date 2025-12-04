import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { eq, inArray, sql } from "drizzle-orm";

// Return type for local book search results
export interface LocalBookSearchResult {
	id: number;
	title: string;
	titleLong: string | null;
	subtitle: string | null;
	isbn: string | null;
	isbn13: string | null;
	synopsis: string | null;
	overview: string | null;
	excerpt: string | null;
	coverUrl: string | null;
	imageOriginal: string | null;
	publisher: string | null;
	pageCount: number | null;
	language: string | null;
	datePublished: string | null;
	binding: string | null;
	edition: string | null;
	msrp: string | null;
	dimensions: string | null;
	createdAt: Date;
	updatedAt: Date;
	authors: { id: number; name: string }[];
}

// Search local database for books by title, author name, or ISBN
export async function searchLocalBooks(
	searchQuery: string,
	limit: number,
): Promise<LocalBookSearchResult[]> {
	// Normalize the query: remove periods/dots for matching "JRR" to "J.R.R."
	const normalizedQuery = searchQuery.replace(/\./g, "");
	const ilikePattern = `%${searchQuery}%`;

	// Step 1: Find books by title or subtitle (ILIKE for substring match)
	const booksByTitle = await db
		.select()
		.from(book)
		.where(
			sql`${book.title} ILIKE ${ilikePattern} OR ${book.subtitle} ILIKE ${ilikePattern}`,
		)
		.limit(limit);

	// Step 2: Find books by author name (ILIKE + normalized for dots)
	const booksByAuthorResults = await db
		.select({ book })
		.from(book)
		.innerJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
		.innerJoin(author, eq(author.id, bookAuthor.authorId))
		.where(
			sql`${author.name} ILIKE ${ilikePattern} OR REPLACE(${author.name}, '.', '') ILIKE ${"%" + normalizedQuery + "%"}`,
		)
		.limit(limit);

	const booksByAuthor = booksByAuthorResults.map((r) => r.book);

	// Step 3: If we have few results, try fuzzy matching with pg_trgm
	let fuzzyBooks: typeof booksByTitle = [];
	if (booksByTitle.length + booksByAuthor.length < limit) {
		const fuzzyResults = await db.execute<{
			id: number;
			title: string;
			title_long: string | null;
			subtitle: string | null;
			isbn: string | null;
			isbn13: string | null;
			synopsis: string | null;
			overview: string | null;
			excerpt: string | null;
			cover_url: string | null;
			image_original: string | null;
			publisher: string | null;
			page_count: number | null;
			language: string | null;
			date_published: string | null;
			binding: string | null;
			edition: string | null;
			msrp: string | null;
			dimensions: string | null;
			created_at: Date;
			updated_at: Date;
			similarity_score: number;
		}>(sql`
			SELECT DISTINCT
				b.id,
				b.title,
				b.title_long,
				b.subtitle,
				b.isbn,
				b.isbn13,
				b.synopsis,
				b.overview,
				b.excerpt,
				b.cover_url,
				b.image_original,
				b.publisher,
				b.page_count,
				b.language,
				b.date_published,
				b.binding,
				b.edition,
				b.msrp,
				b.dimensions,
				b.created_at,
				b.updated_at,
				GREATEST(
					similarity(b.title, ${searchQuery}),
					COALESCE(similarity(b.subtitle, ${searchQuery}), 0),
					COALESCE((
						SELECT MAX(similarity(a.name, ${searchQuery}))
						FROM author a
						INNER JOIN book_author ba ON ba.author_id = a.id
						WHERE ba.book_id = b.id
					), 0)
				) as similarity_score
			FROM book b
			WHERE
				similarity(b.title, ${searchQuery}) > 0.2
				OR similarity(b.subtitle, ${searchQuery}) > 0.2
				OR EXISTS (
					SELECT 1 FROM author a
					INNER JOIN book_author ba ON ba.author_id = a.id
					WHERE ba.book_id = b.id
					AND (
						similarity(a.name, ${searchQuery}) > 0.2
						OR similarity(REPLACE(a.name, '.', ''), ${normalizedQuery}) > 0.2
					)
				)
			ORDER BY similarity_score DESC
			LIMIT ${limit}
		`);

		fuzzyBooks = fuzzyResults.rows.map((r) => ({
			id: r.id,
			title: r.title,
			titleLong: r.title_long,
			subtitle: r.subtitle,
			isbn: r.isbn,
			isbn13: r.isbn13,
			synopsis: r.synopsis,
			overview: r.overview,
			excerpt: r.excerpt,
			coverUrl: r.cover_url,
			imageOriginal: r.image_original,
			publisher: r.publisher,
			pageCount: r.page_count,
			language: r.language,
			datePublished: r.date_published,
			binding: r.binding,
			edition: r.edition,
			msrp: r.msrp,
			dimensions: r.dimensions,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		}));
	}

	// Combine and deduplicate results (title matches first, then author, then fuzzy)
	const allBooks = [...booksByTitle, ...booksByAuthor, ...fuzzyBooks];
	const uniqueBooks = Array.from(
		new Map(allBooks.map((b) => [b.id, b])).values(),
	).slice(0, limit);

	if (uniqueBooks.length === 0) {
		return [];
	}

	// Get authors for the search results
	const bookIds = uniqueBooks.map((b) => b.id);

	const resultAuthors = await db
		.select({
			bookId: bookAuthor.bookId,
			authorId: author.id,
			authorName: author.name,
		})
		.from(bookAuthor)
		.innerJoin(author, eq(author.id, bookAuthor.authorId))
		.where(inArray(bookAuthor.bookId, bookIds));

	// Map authors to books
	const authorsByBook = new Map<number, { id: number; name: string }[]>();
	for (const ba of resultAuthors) {
		if (!authorsByBook.has(ba.bookId)) {
			authorsByBook.set(ba.bookId, []);
		}
		authorsByBook.get(ba.bookId)!.push({
			id: ba.authorId,
			name: ba.authorName,
		});
	}

	return uniqueBooks.map((b) => ({
		id: b.id,
		title: b.title,
		titleLong: b.titleLong,
		subtitle: b.subtitle,
		isbn: b.isbn,
		isbn13: b.isbn13,
		synopsis: b.synopsis,
		overview: b.overview,
		excerpt: b.excerpt,
		coverUrl: b.coverUrl,
		imageOriginal: b.imageOriginal,
		publisher: b.publisher,
		pageCount: b.pageCount,
		language: b.language,
		datePublished: b.datePublished,
		binding: b.binding,
		edition: b.edition,
		msrp: b.msrp,
		dimensions: b.dimensions,
		createdAt: b.createdAt,
		updatedAt: b.updatedAt,
		authors: authorsByBook.get(b.id) || [],
	}));
}
