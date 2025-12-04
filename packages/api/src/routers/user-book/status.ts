import { db } from "@bookmarkd/db";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, eq, inArray } from "drizzle-orm";
import z from "zod";
import { protectedProcedure } from "../../index";
import { findUserBook } from "../../services/user-book-queries";

// Book status enum matching the database
const bookStatusSchema = z.enum([
	"WantToRead",
	"CurrentlyReading",
	"Read",
	"DNF",
	"None",
]);

export const userBookStatusRouter = {
	// Get a specific user-book entry
	getByBookId: protectedProcedure
		.input(z.object({ bookId: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			return findUserBook(userId, input.bookId);
		}),

	// Get user-book statuses for multiple books at once
	getStatusForBooks: protectedProcedure
		.input(z.object({ bookIds: z.array(z.number()).max(100) }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			if (input.bookIds.length === 0) {
				return {};
			}

			const entries = await db
				.select({
					bookId: userBook.bookId,
					status: userBook.status,
					currentPage: userBook.currentPage,
				})
				.from(userBook)
				.where(
					and(
						eq(userBook.userId, userId),
						inArray(userBook.bookId, input.bookIds),
					),
				);

			// Return as a map of bookId -> status info
			const statusMap: Record<number, { status: string; currentPage: number }> =
				{};
			for (const entry of entries) {
				statusMap[entry.bookId] = {
					status: entry.status,
					currentPage: entry.currentPage,
				};
			}

			return statusMap;
		}),

	// Add a book to shelf or update status
	updateStatus: protectedProcedure
		.input(
			z.object({
				bookId: z.number(),
				status: bookStatusSchema,
				currentPage: z.number().int().min(0).optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const existing = await findUserBook(userId, input.bookId);

			const now = new Date();
			let startedAt = existing?.startedAt;
			let finishedAt = existing?.finishedAt;
			let currentPage = input.currentPage ?? existing?.currentPage;

			// Update timestamps based on status change
			if (input.status === "CurrentlyReading" && !startedAt) {
				startedAt = now;
			}
			if (input.status === "Read" && !finishedAt) {
				finishedAt = now;
			}
			if (input.status === "WantToRead") {
				startedAt = null;
				finishedAt = null;
				currentPage = 0;
			}

			if (existing) {
				// Update existing entry
				const [updated] = await db
					.update(userBook)
					.set({
						status: input.status,
						startedAt,
						finishedAt,
						currentPage,
					})
					.where(eq(userBook.id, existing.id))
					.returning();

				return updated;
			}
			// Create new entry
			const [created] = await db
				.insert(userBook)
				.values({
					userId,
					bookId: input.bookId,
					status: input.status,
					startedAt,
					finishedAt,
					currentPage: currentPage ?? 0,
				})
				.returning();

			return created;
		}),

	// Update reading progress
	updateProgress: protectedProcedure
		.input(
			z.object({
				bookId: z.number(),
				currentPage: z.number().int().min(0),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const existing = await findUserBook(userId, input.bookId);

			if (existing) {
				// Update existing entry
				const [updated] = await db
					.update(userBook)
					.set({
						currentPage: input.currentPage,
						// Auto-set to CurrentlyReading if not already reading and has progress
						status:
							existing.status === "WantToRead" || existing.status === "None"
								? "CurrentlyReading"
								: existing.status,
						startedAt: existing.startedAt || new Date(),
					})
					.where(eq(userBook.id, existing.id))
					.returning();

				return updated;
			}
			// Create new entry with CurrentlyReading status
			const [created] = await db
				.insert(userBook)
				.values({
					userId,
					bookId: input.bookId,
					currentPage: input.currentPage,
					status: "CurrentlyReading",
					startedAt: new Date(),
				})
				.returning();

			return created;
		}),

	// Update rating
	updateRating: protectedProcedure
		.input(
			z.object({
				bookId: z.number(),
				rating: z.number().int().min(1).max(5),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const existing = await findUserBook(userId, input.bookId);

			if (existing) {
				const [updated] = await db
					.update(userBook)
					.set({ rating: input.rating })
					.where(eq(userBook.id, existing.id))
					.returning();

				return updated;
			}
			// Create new entry with rating
			const [created] = await db
				.insert(userBook)
				.values({
					userId,
					bookId: input.bookId,
					rating: input.rating,
				})
				.returning();

			return created;
		}),

	// Remove a book from shelves
	remove: protectedProcedure
		.input(z.object({ bookId: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const [deleted] = await db
				.delete(userBook)
				.where(
					and(eq(userBook.userId, userId), eq(userBook.bookId, input.bookId)),
				)
				.returning();

			if (!deleted) {
				throw new Error("Book not found in your library");
			}

			return { success: true, bookId: input.bookId };
		}),
};
