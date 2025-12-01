import { db } from "@bookmarkd/db";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre, genre } from "@bookmarkd/db/schema/genre";
import { desc, eq, isNull, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../index";

export const genreRouter = {
	// Get all genres (optionally filtered by parent)
	getAll: publicProcedure
		.input(
			z
				.object({
					parentId: z.number().nullable().optional(),
					topLevelOnly: z.boolean().default(false),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const { parentId, topLevelOnly = false } = input ?? {};

			if (topLevelOnly) {
				// Get only top-level genres (no parent)
				return await db
					.select()
					.from(genre)
					.where(isNull(genre.parentId))
					.orderBy(genre.name);
			}

			if (parentId !== undefined) {
				if (parentId === null) {
					return await db
						.select()
						.from(genre)
						.where(isNull(genre.parentId))
						.orderBy(genre.name);
				}
				return await db
					.select()
					.from(genre)
					.where(eq(genre.parentId, parentId))
					.orderBy(genre.name);
			}

			return await db.select().from(genre).orderBy(genre.name);
		}),

	// Get popular genres sorted by book count
	getPopular: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const { limit = 20 } = input ?? {};

			const popularGenres = await db
				.select({
					id: genre.id,
					name: genre.name,
					parentId: genre.parentId,
					bookCount: sql<number>`count(${bookGenre.bookId})`.as("book_count"),
				})
				.from(genre)
				.leftJoin(bookGenre, eq(bookGenre.genreId, genre.id))
				.groupBy(genre.id)
				.orderBy(desc(sql`count(${bookGenre.bookId})`), genre.name)
				.limit(limit);

			return popularGenres;
		}),

	// Get genre by ID with subgenres and books
	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [foundGenre] = await db
				.select()
				.from(genre)
				.where(eq(genre.id, input.id))
				.limit(1);

			if (!foundGenre) {
				return null;
			}

			// Get parent genre if exists
			let parent = null;
			if (foundGenre.parentId) {
				const [parentGenre] = await db
					.select()
					.from(genre)
					.where(eq(genre.id, foundGenre.parentId))
					.limit(1);
				parent = parentGenre || null;
			}

			// Get child genres (subgenres)
			const children = await db
				.select()
				.from(genre)
				.where(eq(genre.parentId, input.id))
				.orderBy(genre.name);

			// Get books in this genre
			const books = await db
				.select({
					id: book.id,
					title: book.title,
					subtitle: book.subtitle,
					coverUrl: book.coverUrl,
				})
				.from(book)
				.innerJoin(bookGenre, eq(bookGenre.bookId, book.id))
				.where(eq(bookGenre.genreId, input.id));

			return {
				...foundGenre,
				parent,
				children,
				books,
			};
		}),

	// Get genre tree (hierarchical structure)
	getTree: publicProcedure.handler(async () => {
		const allGenres = await db.select().from(genre).orderBy(genre.name);

		// Build tree structure
		const genreMap = new Map<
			number,
			(typeof allGenres)[0] & { children: typeof allGenres }
		>();
		const rootGenres: ((typeof allGenres)[0] & {
			children: typeof allGenres;
		})[] = [];

		// First pass: create map entries
		for (const g of allGenres) {
			genreMap.set(g.id, { ...g, children: [] });
		}

		// Second pass: build tree
		for (const g of allGenres) {
			const genreWithChildren = genreMap.get(g.id)!;
			if (g.parentId === null) {
				rootGenres.push(genreWithChildren);
			} else {
				const parent = genreMap.get(g.parentId);
				if (parent) {
					parent.children.push(genreWithChildren);
				}
			}
		}

		return rootGenres;
	}),

	// Create a new genre (protected)
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(256),
				parentId: z.number().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const [newGenre] = await db
				.insert(genre)
				.values({
					name: input.name,
					parentId: input.parentId,
				})
				.returning();

			return newGenre;
		}),

	// Update a genre (protected)
	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).max(256).optional(),
				parentId: z.number().nullable().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const { id, ...updateData } = input;

			const [updatedGenre] = await db
				.update(genre)
				.set(updateData)
				.where(eq(genre.id, id))
				.returning();

			if (!updatedGenre) {
				throw new Error("Genre not found");
			}

			return updatedGenre;
		}),

	// Delete a genre (protected)
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [deletedGenre] = await db
				.delete(genre)
				.where(eq(genre.id, input.id))
				.returning();

			if (!deletedGenre) {
				throw new Error("Genre not found");
			}

			return { success: true, id: input.id };
		}),
};
