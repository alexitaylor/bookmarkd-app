import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { eq, ilike } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../index";

export const authorRouter = {
	// Get all authors
	getAll: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(100).default(50),
					offset: z.number().int().min(0).default(0),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const { limit = 50, offset = 0 } = input ?? {};

			const authors = await db
				.select()
				.from(author)
				.limit(limit)
				.offset(offset)
				.orderBy(author.name);

			return authors;
		}),

	// Get author by ID with their books
	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [foundAuthor] = await db
				.select()
				.from(author)
				.where(eq(author.id, input.id))
				.limit(1);

			if (!foundAuthor) {
				return null;
			}

			// Get books by this author
			const books = await db
				.select({
					id: book.id,
					title: book.title,
					subtitle: book.subtitle,
					coverUrl: book.coverUrl,
					datePublished: book.datePublished,
				})
				.from(book)
				.innerJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
				.where(eq(bookAuthor.authorId, input.id));

			return {
				...foundAuthor,
				books,
			};
		}),

	// Search authors by name
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.handler(async ({ input }) => {
			const authors = await db
				.select()
				.from(author)
				.where(ilike(author.name, `%${input.query}%`))
				.limit(input.limit)
				.orderBy(author.name);

			return authors;
		}),

	// Create a new author (protected)
	create: protectedProcedure
		.input(z.object({ name: z.string().min(1).max(256) }))
		.handler(async ({ input }) => {
			const [newAuthor] = await db
				.insert(author)
				.values({ name: input.name })
				.returning();

			return newAuthor;
		}),

	// Update an author (protected)
	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).max(256),
			}),
		)
		.handler(async ({ input }) => {
			const [updatedAuthor] = await db
				.update(author)
				.set({ name: input.name })
				.where(eq(author.id, input.id))
				.returning();

			if (!updatedAuthor) {
				throw new Error("Author not found");
			}

			return updatedAuthor;
		}),

	// Delete an author (protected)
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [deletedAuthor] = await db
				.delete(author)
				.where(eq(author.id, input.id))
				.returning();

			if (!deletedAuthor) {
				throw new Error("Author not found");
			}

			return { success: true, id: input.id };
		}),
};
