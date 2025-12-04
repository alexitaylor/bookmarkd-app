import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre, genre } from "@bookmarkd/db/schema/genre";
import { review } from "@bookmarkd/db/schema/review";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import { upsertExternalBook } from "../services/book-ingestion";
import {
	fetchBookByISBN,
	searchBooksFromISBNdb,
} from "../services/isbndb-client";

// Input schemas
const createBookSchema = z.object({
	title: z.string().min(1).max(256),
	subtitle: z.string().max(512).optional(),
	isbn: z.string().max(13).optional(),
	isbn13: z.string().max(13).optional(),
	synopsis: z.string().optional(),
	coverUrl: z.string().url().optional(),
	publisher: z.string().max(256).optional(),
	pageCount: z.number().int().positive().optional(),
	language: z.string().max(64).optional(),
	datePublished: z.string().optional(),
	authorIds: z.array(z.number()).optional(),
	genreIds: z.array(z.number()).optional(),
});

const updateBookSchema = createBookSchema.partial().extend({
	id: z.number(),
});

// Helper function to search local database
async function searchLocalBooks(
	searchQuery: string,
	limit: number,
): Promise<
	{
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
	}[]
> {
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

export const bookRouter = {
	// Get a single book by ID with related data
	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [foundBook] = await db
				.select()
				.from(book)
				.where(eq(book.id, input.id))
				.limit(1);

			if (!foundBook) {
				return null;
			}

			// Get authors
			const authors = await db
				.select({
					id: author.id,
					name: author.name,
				})
				.from(author)
				.innerJoin(bookAuthor, eq(bookAuthor.authorId, author.id))
				.where(eq(bookAuthor.bookId, input.id));

			// Get genres
			const genres = await db
				.select({
					id: genre.id,
					name: genre.name,
				})
				.from(genre)
				.innerJoin(bookGenre, eq(bookGenre.genreId, genre.id))
				.where(eq(bookGenre.bookId, input.id));

			return {
				...foundBook,
				authors,
				genres,
			};
		}),

	// Search books by title, author name, or ISBN using trigram similarity
	// Only searches local DB - use searchExternal for ISBNdb
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.handler(async ({ input }) => {
			const searchQuery = input.query.trim();

			// Search local DB only
			const localResults = await searchLocalBooks(searchQuery, input.limit);

			return {
				local: localResults,
				hasExternalResults: localResults.length === 0,
			};
		}),

	// Add a book by ISBN from ISBNdb
	addFromISBN: publicProcedure
		.input(z.object({ isbn: z.string().min(10).max(17) }))
		.handler(async ({ input }) => {
			const externalBook = await fetchBookByISBN(input.isbn);
			if (!externalBook) {
				throw new Error(`Book with ISBN ${input.isbn} not found`);
			}

			const upsertedBook = await upsertExternalBook(externalBook);
			return upsertedBook;
		}),

	// Search external ISBNdb API without storing results
	// User must explicitly call addFromISBN to import a book
	searchExternal: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.handler(async ({ input }) => {
			const results = await searchBooksFromISBNdb(input.query, input.limit);
			return { external: results };
		}),

	// Create a new book (protected - requires auth)
	create: protectedProcedure
		.input(createBookSchema)
		.handler(async ({ input }) => {
			const { authorIds, genreIds, ...bookData } = input;

			// Insert book
			const [newBook] = await db.insert(book).values(bookData).returning();

			if (!newBook) {
				throw new Error("Failed to create book");
			}

			// Link authors
			if (authorIds && authorIds.length > 0) {
				await db.insert(bookAuthor).values(
					authorIds.map((authorId) => ({
						bookId: newBook.id,
						authorId,
					})),
				);
			}

			// Link genres
			if (genreIds && genreIds.length > 0) {
				await db.insert(bookGenre).values(
					genreIds.map((genreId) => ({
						bookId: newBook.id,
						genreId,
					})),
				);
			}

			return newBook;
		}),

	// Update a book (protected - requires auth)
	update: protectedProcedure
		.input(updateBookSchema)
		.handler(async ({ input }) => {
			const { id, authorIds, genreIds, ...bookData } = input;

			// Update book
			const [updatedBook] = await db
				.update(book)
				.set(bookData)
				.where(eq(book.id, id))
				.returning();

			if (!updatedBook) {
				throw new Error("Book not found");
			}

			// Update authors if provided
			if (authorIds !== undefined) {
				// Remove existing author links
				await db.delete(bookAuthor).where(eq(bookAuthor.bookId, id));

				// Add new author links
				if (authorIds.length > 0) {
					await db.insert(bookAuthor).values(
						authorIds.map((authorId) => ({
							bookId: id,
							authorId,
						})),
					);
				}
			}

			// Update genres if provided
			if (genreIds !== undefined) {
				// Remove existing genre links
				await db.delete(bookGenre).where(eq(bookGenre.bookId, id));

				// Add new genre links
				if (genreIds.length > 0) {
					await db.insert(bookGenre).values(
						genreIds.map((genreId) => ({
							bookId: id,
							genreId,
						})),
					);
				}
			}

			return updatedBook;
		}),

	// Delete a book (protected - requires auth)
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [deletedBook] = await db
				.delete(book)
				.where(eq(book.id, input.id))
				.returning();

			if (!deletedBook) {
				throw new Error("Book not found");
			}

			return { success: true, id: input.id };
		}),

	// Get popular books (most added to shelves + highest rated)
	getPopular: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
					offset: z.number().int().min(0).default(0),
					genreId: z.number().int().optional(),
					query: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const {
				limit = 20,
				offset = 0,
				genreId,
				query: searchQuery,
			} = input ?? {};

			// Build query with optional filters
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
					addCount: sql<number>`count(distinct ${userBook.id})`.as("add_count"),
					avgRating: sql<number>`coalesce(avg(${review.rating}), 0)`.as(
						"avg_rating",
					),
					reviewCount: sql<number>`count(distinct ${review.id})`.as(
						"review_count",
					),
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

			// Get books with their add counts, average ratings, and review counts
			const popularBooks = await dbQuery
				.groupBy(book.id)
				.orderBy(
					desc(sql`count(distinct ${userBook.id})`),
					desc(sql`coalesce(avg(${review.rating}), 0)`),
				)
				.limit(limit)
				.offset(offset);

			// Get authors for each book
			const bookIds = popularBooks.map((b) => b.id);
			if (bookIds.length === 0) {
				return { books: [], hasMore: false };
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

			// Map authors to books
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

			const books = popularBooks.map((b) => ({
				...b,
				authors: authorsByBook.get(b.id) || [],
			}));

			return {
				books,
				hasMore: books.length === limit,
			};
		}),

	// Get related books (same author or same genre)
	getRelated: publicProcedure
		.input(
			z.object({
				bookId: z.number(),
				limit: z.number().int().min(1).max(20).default(6),
			}),
		)
		.handler(async ({ input }) => {
			// Get the book's authors and genres
			const bookAuthors = await db
				.select({ authorId: bookAuthor.authorId })
				.from(bookAuthor)
				.where(eq(bookAuthor.bookId, input.bookId));

			const bookGenres = await db
				.select({ genreId: bookGenre.genreId })
				.from(bookGenre)
				.where(eq(bookGenre.bookId, input.bookId));

			const authorIds = bookAuthors.map((a) => a.authorId);
			const genreIds = bookGenres.map((g) => g.genreId);

			if (authorIds.length === 0 && genreIds.length === 0) {
				return [];
			}

			// Find related books (same author first, then same genre)
			let relatedBooks: (typeof book.$inferSelect)[] = [];

			// Books by the same author
			if (authorIds.length > 0) {
				const sameAuthorBooks = await db
					.select()
					.from(book)
					.innerJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
					.where(
						and(
							inArray(bookAuthor.authorId, authorIds),
							sql`${book.id} != ${input.bookId}`,
						),
					)
					.limit(input.limit);

				relatedBooks = sameAuthorBooks.map((r) => r.book);
			}

			// If not enough books, add books from the same genre
			if (relatedBooks.length < input.limit && genreIds.length > 0) {
				const existingIds = relatedBooks.map((b) => b.id);
				const sameGenreBooks = await db
					.select()
					.from(book)
					.innerJoin(bookGenre, eq(bookGenre.bookId, book.id))
					.where(
						and(
							inArray(bookGenre.genreId, genreIds),
							sql`${book.id} != ${input.bookId}`,
							existingIds.length > 0
								? sql`${book.id} NOT IN (${sql.join(
										existingIds.map((id) => sql`${id}`),
										sql`, `,
									)})`
								: sql`1=1`,
						),
					)
					.limit(input.limit - relatedBooks.length);

				relatedBooks = [...relatedBooks, ...sameGenreBooks.map((r) => r.book)];
			}

			// Deduplicate
			const uniqueBooks = Array.from(
				new Map(relatedBooks.map((b) => [b.id, b])).values(),
			).slice(0, input.limit);

			if (uniqueBooks.length === 0) {
				return [];
			}

			// Get authors for each book
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
				subtitle: b.subtitle,
				coverUrl: b.coverUrl,
				pageCount: b.pageCount,
				authors: authorsByBook.get(b.id) || [],
			}));
		}),

	// Get recently added books
	getRecent: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
					offset: z.number().int().min(0).default(0),
					genreId: z.number().int().optional(),
					query: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const {
				limit = 20,
				offset = 0,
				genreId,
				query: searchQuery,
			} = input ?? {};

			// Build query with optional filters
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
					reviewCount: sql<number>`count(distinct ${review.id})`.as(
						"review_count",
					),
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

			// Get recent books with their add counts, average ratings, and review counts
			const recentBooks = await dbQuery
				.groupBy(book.id)
				.orderBy(desc(book.createdAt))
				.limit(limit)
				.offset(offset);

			if (recentBooks.length === 0) {
				return { books: [], hasMore: false };
			}

			// Get authors for each book
			const bookIds = recentBooks.map((b) => b.id);

			const bookAuthors = await db
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
			for (const ba of bookAuthors) {
				if (!authorsByBook.has(ba.bookId)) {
					authorsByBook.set(ba.bookId, []);
				}
				authorsByBook.get(ba.bookId)!.push({
					id: ba.authorId,
					name: ba.authorName,
				});
			}

			const books = recentBooks.map((b) => ({
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
		}),

	// Get all books sorted alphabetically by title
	getAll: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
					offset: z.number().int().min(0).default(0),
					genreId: z.number().int().optional(),
					query: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const {
				limit = 20,
				offset = 0,
				genreId,
				query: searchQuery,
			} = input ?? {};

			// Build query with optional filters
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
					addCount: sql<number>`count(distinct ${userBook.id})`.as("add_count"),
					avgRating: sql<number>`coalesce(avg(${review.rating}), 0)`.as(
						"avg_rating",
					),
					reviewCount: sql<number>`count(distinct ${review.id})`.as(
						"review_count",
					),
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

			// Get books sorted alphabetically with stats
			const allBooks = await dbQuery
				.groupBy(book.id)
				.orderBy(asc(book.title))
				.limit(limit)
				.offset(offset);

			// Get authors for each book
			const bookIds = allBooks.map((b) => b.id);
			if (bookIds.length === 0) {
				return { books: [], hasMore: false };
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

			// Map authors to books
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

			const books = allBooks.map((b) => ({
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
		}),

	// Get books sorted by highest rating
	getByRating: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
					offset: z.number().int().min(0).default(0),
					genreId: z.number().int().optional(),
					query: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const {
				limit = 20,
				offset = 0,
				genreId,
				query: searchQuery,
			} = input ?? {};

			// Build query with optional filters
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
					addCount: sql<number>`count(distinct ${userBook.id})`.as("add_count"),
					avgRating: sql<number>`coalesce(avg(${review.rating}), 0)`.as(
						"avg_rating",
					),
					reviewCount: sql<number>`count(distinct ${review.id})`.as(
						"review_count",
					),
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

			// Get books sorted by rating (only books with ratings)
			const ratedBooks = await dbQuery
				.groupBy(book.id)
				.orderBy(
					desc(sql`coalesce(avg(${review.rating}), 0)`),
					desc(sql`count(distinct ${review.id})`),
				)
				.limit(limit)
				.offset(offset);

			if (ratedBooks.length === 0) {
				return { books: [], hasMore: false };
			}

			// Get authors for each book
			const bookIds = ratedBooks.map((b) => b.id);

			const bookAuthors = await db
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
			for (const ba of bookAuthors) {
				if (!authorsByBook.has(ba.bookId)) {
					authorsByBook.set(ba.bookId, []);
				}
				authorsByBook.get(ba.bookId)!.push({
					id: ba.authorId,
					name: ba.authorName,
				});
			}

			const books = ratedBooks.map((b) => ({
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
		}),

	// Get personalized book recommendations based on reading history
	getRecommendations: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(20).default(10),
				})
				.optional(),
		)
		.handler(async ({ input, context }) => {
			const { notInArray } = await import("drizzle-orm");
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const { limit = 10 } = input ?? {};

			// Get all books the user has already added to any shelf
			const userBookIds = await db
				.select({ bookId: userBook.bookId })
				.from(userBook)
				.where(eq(userBook.userId, userId));

			const excludedBookIds = userBookIds.map((ub) => ub.bookId);

			// Get user's favorite genres (most read)
			const favoriteGenres = await db
				.select({
					genreId: genre.id,
					genreName: genre.name,
					count: sql<number>`count(*)`.as("count"),
				})
				.from(userBook)
				.innerJoin(bookGenre, eq(bookGenre.bookId, userBook.bookId))
				.innerJoin(genre, eq(genre.id, bookGenre.genreId))
				.where(and(eq(userBook.userId, userId), eq(userBook.status, "Read")))
				.groupBy(genre.id, genre.name)
				.orderBy(desc(sql`count(*)`))
				.limit(5);

			// Get user's favorite authors (most read)
			const favoriteAuthors = await db
				.select({
					authorId: author.id,
					authorName: author.name,
					count: sql<number>`count(*)`.as("count"),
				})
				.from(userBook)
				.innerJoin(bookAuthor, eq(bookAuthor.bookId, userBook.bookId))
				.innerJoin(author, eq(author.id, bookAuthor.authorId))
				.where(and(eq(userBook.userId, userId), eq(userBook.status, "Read")))
				.groupBy(author.id, author.name)
				.orderBy(desc(sql`count(*)`))
				.limit(5);

			const genreIds = favoriteGenres.map((g) => g.genreId);
			const authorIds = favoriteAuthors.map((a) => a.authorId);

			// If user has no reading history, return popular books
			if (genreIds.length === 0 && authorIds.length === 0) {
				const popularBooks = await db
					.select({
						id: book.id,
						title: book.title,
						subtitle: book.subtitle,
						coverUrl: book.coverUrl,
						pageCount: book.pageCount,
						datePublished: book.datePublished,
						addCount: sql<number>`count(distinct ${userBook.id})`.as(
							"add_count",
						),
						avgRating: sql<number>`coalesce(avg(${review.rating}), 0)`.as(
							"avg_rating",
						),
					})
					.from(book)
					.leftJoin(userBook, eq(userBook.bookId, book.id))
					.leftJoin(review, eq(review.bookId, book.id))
					.where(
						excludedBookIds.length > 0
							? notInArray(book.id, excludedBookIds)
							: sql`1=1`,
					)
					.groupBy(book.id)
					.orderBy(
						desc(sql`count(distinct ${userBook.id})`),
						desc(sql`coalesce(avg(${review.rating}), 0)`),
					)
					.limit(limit);

				// Get authors for books
				const bookIds = popularBooks.map((b) => b.id);
				const bookAuthorsResult =
					bookIds.length > 0
						? await db
								.select({
									bookId: bookAuthor.bookId,
									authorName: author.name,
								})
								.from(bookAuthor)
								.innerJoin(author, eq(author.id, bookAuthor.authorId))
								.where(inArray(bookAuthor.bookId, bookIds))
						: [];

				const authorsByBook = new Map<number, string[]>();
				for (const ba of bookAuthorsResult) {
					if (!authorsByBook.has(ba.bookId)) {
						authorsByBook.set(ba.bookId, []);
					}
					authorsByBook.get(ba.bookId)!.push(ba.authorName);
				}

				return {
					recommendations: popularBooks.map((b) => ({
						id: b.id,
						title: b.title,
						subtitle: b.subtitle,
						coverUrl: b.coverUrl,
						pageCount: b.pageCount,
						datePublished: b.datePublished,
						authors: authorsByBook.get(b.id) || [],
						avgRating: Number(b.avgRating),
						reason: "Popular with readers",
					})),
					basedOn: {
						genres: [],
						authors: [],
					},
				};
			}

			// Find books in favorite genres by favorite authors, excluding user's books
			const recommendedBooks = await db
				.select({
					id: book.id,
					title: book.title,
					subtitle: book.subtitle,
					coverUrl: book.coverUrl,
					pageCount: book.pageCount,
					datePublished: book.datePublished,
					avgRating: sql<number>`coalesce(avg(${review.rating}), 0)`.as(
						"avg_rating",
					),
					reviewCount: sql<number>`count(distinct ${review.id})`.as(
						"review_count",
					),
					genreMatch:
						sql<number>`count(distinct ${bookGenre.genreId}) filter (where ${bookGenre.genreId} in (${sql.join(
							genreIds.map((id) => sql`${id}`),
							sql`, `,
						)}))`.as("genre_match"),
					authorMatch:
						authorIds.length > 0
							? sql<number>`count(distinct ${bookAuthor.authorId}) filter (where ${bookAuthor.authorId} in (${sql.join(
									authorIds.map((id) => sql`${id}`),
									sql`, `,
								)}))`.as("author_match")
							: sql<number>`0`.as("author_match"),
				})
				.from(book)
				.leftJoin(bookGenre, eq(bookGenre.bookId, book.id))
				.leftJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
				.leftJoin(review, eq(review.bookId, book.id))
				.where(
					and(
						excludedBookIds.length > 0
							? notInArray(book.id, excludedBookIds)
							: sql`1=1`,
						genreIds.length > 0
							? inArray(bookGenre.genreId, genreIds)
							: sql`1=1`,
					),
				)
				.groupBy(book.id)
				.orderBy(
					desc(sql`count(distinct ${bookGenre.genreId})`),
					desc(sql`coalesce(avg(${review.rating}), 0)`),
				)
				.limit(limit);

			// Get authors for recommended books
			const recommendedBookIds = recommendedBooks.map((b) => b.id);
			const bookAuthorsResult =
				recommendedBookIds.length > 0
					? await db
							.select({
								bookId: bookAuthor.bookId,
								authorName: author.name,
							})
							.from(bookAuthor)
							.innerJoin(author, eq(author.id, bookAuthor.authorId))
							.where(inArray(bookAuthor.bookId, recommendedBookIds))
					: [];

			const authorsByBook = new Map<number, string[]>();
			for (const ba of bookAuthorsResult) {
				if (!authorsByBook.has(ba.bookId)) {
					authorsByBook.set(ba.bookId, []);
				}
				authorsByBook.get(ba.bookId)!.push(ba.authorName);
			}

			// Generate reason for recommendation
			const getRecommendationReason = (b: {
				genreMatch: number;
				authorMatch: number;
			}) => {
				if (b.authorMatch > 0 && b.genreMatch > 0) {
					return "Based on your favorite authors and genres";
				}
				if (b.authorMatch > 0) {
					return "By an author you enjoy";
				}
				if (b.genreMatch > 0) {
					return "Similar to books you've read";
				}
				return "Recommended for you";
			};

			return {
				recommendations: recommendedBooks.map((b) => ({
					id: b.id,
					title: b.title,
					subtitle: b.subtitle,
					coverUrl: b.coverUrl,
					pageCount: b.pageCount,
					datePublished: b.datePublished,
					authors: authorsByBook.get(b.id) || [],
					avgRating: Number(b.avgRating),
					reason: getRecommendationReason(b),
				})),
				basedOn: {
					genres: favoriteGenres.map((g) => g.genreName),
					authors: favoriteAuthors.map((a) => a.authorName),
				},
			};
		}),
};
