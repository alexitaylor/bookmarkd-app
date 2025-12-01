import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre, genre } from "@bookmarkd/db/schema/genre";
import { review } from "@bookmarkd/db/schema/review";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../index";

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

export const bookRouter = {
	// Get all books with pagination
	getAll: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(100).default(20),
					offset: z.number().int().min(0).default(0),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const { limit = 20, offset = 0 } = input ?? {};

			const books = await db
				.select()
				.from(book)
				.limit(limit)
				.offset(offset)
				.orderBy(book.title);

			return books;
		}),

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
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.handler(async ({ input }) => {
			const searchQuery = input.query.trim();

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
				.limit(input.limit);

			// Step 2: Find books by author name (ILIKE + normalized for dots)
			const booksByAuthor = await db
				.select({
					id: book.id,
					title: book.title,
					subtitle: book.subtitle,
					isbn: book.isbn,
					isbn13: book.isbn13,
					synopsis: book.synopsis,
					coverUrl: book.coverUrl,
					publisher: book.publisher,
					pageCount: book.pageCount,
					language: book.language,
					datePublished: book.datePublished,
					createdAt: book.createdAt,
					updatedAt: book.updatedAt,
				})
				.from(book)
				.innerJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
				.innerJoin(author, eq(author.id, bookAuthor.authorId))
				.where(
					sql`${author.name} ILIKE ${ilikePattern} OR REPLACE(${author.name}, '.', '') ILIKE ${"%" + normalizedQuery + "%"}`,
				)
				.limit(input.limit);

			// Step 3: If we have few results, try fuzzy matching with pg_trgm
			let fuzzyBooks: typeof booksByTitle = [];
			if (booksByTitle.length + booksByAuthor.length < input.limit) {
				const fuzzyResults = await db.execute<{
					id: number;
					title: string;
					subtitle: string | null;
					isbn: string | null;
					isbn13: string | null;
					synopsis: string | null;
					cover_url: string | null;
					publisher: string | null;
					page_count: number | null;
					language: string | null;
					date_published: string | null;
					created_at: Date;
					updated_at: Date;
					similarity_score: number;
				}>(sql`
					SELECT DISTINCT
						b.id,
						b.title,
						b.subtitle,
						b.isbn,
						b.isbn13,
						b.synopsis,
						b.cover_url,
						b.publisher,
						b.page_count,
						b.language,
						b.date_published,
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
					LIMIT ${input.limit}
				`);

				fuzzyBooks = fuzzyResults.rows.map((r) => ({
					id: r.id,
					title: r.title,
					subtitle: r.subtitle,
					isbn: r.isbn,
					isbn13: r.isbn13,
					synopsis: r.synopsis,
					coverUrl: r.cover_url,
					publisher: r.publisher,
					pageCount: r.page_count,
					language: r.language,
					datePublished: r.date_published,
					createdAt: r.created_at,
					updatedAt: r.updated_at,
				}));
			}

			// Combine and deduplicate results (title matches first, then author, then fuzzy)
			const allBooks = [...booksByTitle, ...booksByAuthor, ...fuzzyBooks];
			const uniqueBooks = Array.from(
				new Map(allBooks.map((b) => [b.id, b])).values(),
			).slice(0, input.limit);

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
				subtitle: b.subtitle,
				isbn: b.isbn,
				isbn13: b.isbn13,
				synopsis: b.synopsis,
				coverUrl: b.coverUrl,
				publisher: b.publisher,
				pageCount: b.pageCount,
				language: b.language,
				datePublished: b.datePublished,
				createdAt: b.createdAt,
				updatedAt: b.updatedAt,
				authors: authorsByBook.get(b.id) || [],
			}));
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
					limit: z.number().int().min(1).max(50).default(12),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const { limit = 12 } = input ?? {};

			// Get books with their add counts and average ratings
			const popularBooks = await db
				.select({
					id: book.id,
					title: book.title,
					subtitle: book.subtitle,
					coverUrl: book.coverUrl,
					pageCount: book.pageCount,
					addCount: sql<number>`count(distinct ${userBook.id})`.as("add_count"),
					avgRating: sql<number>`coalesce(avg(${review.rating}), 0)`.as(
						"avg_rating",
					),
				})
				.from(book)
				.leftJoin(userBook, eq(userBook.bookId, book.id))
				.leftJoin(review, eq(review.bookId, book.id))
				.groupBy(book.id)
				.orderBy(
					desc(sql`count(distinct ${userBook.id})`),
					desc(sql`coalesce(avg(${review.rating}), 0)`),
				)
				.limit(limit);

			// Get authors for each book
			const bookIds = popularBooks.map((b) => b.id);
			if (bookIds.length === 0) {
				return [];
			}

			const bookAuthors = await db
				.select({
					bookId: bookAuthor.bookId,
					authorId: author.id,
					authorName: author.name,
				})
				.from(bookAuthor)
				.innerJoin(author, eq(author.id, bookAuthor.authorId));

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

			return popularBooks.map((b) => ({
				...b,
				authors: authorsByBook.get(b.id) || [],
			}));
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
					.select({
						id: book.id,
						title: book.title,
						subtitle: book.subtitle,
						isbn: book.isbn,
						isbn13: book.isbn13,
						synopsis: book.synopsis,
						coverUrl: book.coverUrl,
						publisher: book.publisher,
						pageCount: book.pageCount,
						language: book.language,
						datePublished: book.datePublished,
						createdAt: book.createdAt,
						updatedAt: book.updatedAt,
					})
					.from(book)
					.innerJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
					.where(
						and(
							inArray(bookAuthor.authorId, authorIds),
							sql`${book.id} != ${input.bookId}`,
						),
					)
					.limit(input.limit);

				relatedBooks = sameAuthorBooks;
			}

			// If not enough books, add books from the same genre
			if (relatedBooks.length < input.limit && genreIds.length > 0) {
				const existingIds = relatedBooks.map((b) => b.id);
				const sameGenreBooks = await db
					.select({
						id: book.id,
						title: book.title,
						subtitle: book.subtitle,
						isbn: book.isbn,
						isbn13: book.isbn13,
						synopsis: book.synopsis,
						coverUrl: book.coverUrl,
						publisher: book.publisher,
						pageCount: book.pageCount,
						language: book.language,
						datePublished: book.datePublished,
						createdAt: book.createdAt,
						updatedAt: book.updatedAt,
					})
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

				relatedBooks = [...relatedBooks, ...sameGenreBooks];
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
					limit: z.number().int().min(1).max(50).default(12),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const { limit = 12 } = input ?? {};

			const recentBooks = await db
				.select()
				.from(book)
				.orderBy(desc(book.createdAt))
				.limit(limit);

			if (recentBooks.length === 0) {
				return [];
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

			return recentBooks.map((b) => ({
				id: b.id,
				title: b.title,
				subtitle: b.subtitle,
				coverUrl: b.coverUrl,
				pageCount: b.pageCount,
				authors: authorsByBook.get(b.id) || [],
			}));
		}),
};
