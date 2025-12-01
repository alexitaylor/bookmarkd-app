import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre, genre } from "@bookmarkd/db/schema/genre";
import { eq, ilike } from "drizzle-orm";
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

	// Search books by title or author name
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.handler(async ({ input }) => {
			const searchPattern = `%${input.query}%`;

			// Search by title
			const booksByTitle = await db
				.select()
				.from(book)
				.where(ilike(book.title, searchPattern))
				.limit(input.limit);

			// Search by author name
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
				.where(ilike(author.name, searchPattern))
				.limit(input.limit);

			// Combine and deduplicate results
			const allBooks = [...booksByTitle, ...booksByAuthor];
			const uniqueBooks = Array.from(
				new Map(allBooks.map((b) => [b.id, b])).values(),
			);

			return uniqueBooks.slice(0, input.limit);
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
};
