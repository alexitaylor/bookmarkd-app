import { db } from "@bookmarkd/db";
import { book } from "@bookmarkd/db/schema/book";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, eq, gte, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure } from "../index";

// Book status enum matching the database
const bookStatusSchema = z.enum([
	"WantToRead",
	"CurrentlyReading",
	"Read",
	"DNF",
	"None",
]);

export const userBookRouter = {
	// Get user's book shelves (grouped by status)
	getShelves: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session?.user?.id;
		if (!userId) {
			throw new Error("User not authenticated");
		}

		const userBooks = await db
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
			})
			.from(userBook)
			.innerJoin(book, eq(book.id, userBook.bookId))
			.where(eq(userBook.userId, userId))
			.orderBy(userBook.updatedAt);

		// Group by status
		const shelves = {
			wantToRead: userBooks.filter((ub) => ub.status === "WantToRead"),
			currentlyReading: userBooks.filter(
				(ub) => ub.status === "CurrentlyReading",
			),
			read: userBooks.filter((ub) => ub.status === "Read"),
			dnf: userBooks.filter((ub) => ub.status === "DNF"),
		};

		return shelves;
	}),

	// Get a specific user-book entry
	getByBookId: protectedProcedure
		.input(z.object({ bookId: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const [entry] = await db
				.select()
				.from(userBook)
				.where(
					and(eq(userBook.userId, userId), eq(userBook.bookId, input.bookId)),
				)
				.limit(1);

			return entry || null;
		}),

	// Add a book to shelf or update status
	updateStatus: protectedProcedure
		.input(
			z.object({
				bookId: z.number(),
				status: bookStatusSchema,
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Check if entry exists
			const [existing] = await db
				.select()
				.from(userBook)
				.where(
					and(eq(userBook.userId, userId), eq(userBook.bookId, input.bookId)),
				)
				.limit(1);

			const now = new Date();
			let startedAt = existing?.startedAt;
			let finishedAt = existing?.finishedAt;

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
			}

			if (existing) {
				// Update existing entry
				const [updated] = await db
					.update(userBook)
					.set({
						status: input.status,
						startedAt,
						finishedAt,
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

			// Check if entry exists
			const [existing] = await db
				.select()
				.from(userBook)
				.where(
					and(eq(userBook.userId, userId), eq(userBook.bookId, input.bookId)),
				)
				.limit(1);

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

			// Check if entry exists
			const [existing] = await db
				.select()
				.from(userBook)
				.where(
					and(eq(userBook.userId, userId), eq(userBook.bookId, input.bookId)),
				)
				.limit(1);

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

	// Get user's reading stats
	getStats: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session?.user?.id;
		if (!userId) {
			throw new Error("User not authenticated");
		}

		// Get start of current year
		const currentYear = new Date().getFullYear();
		const startOfYear = new Date(currentYear, 0, 1);

		// Count books read this year
		const [booksReadThisYear] = await db
			.select({
				count: sql<number>`count(*)`.as("count"),
			})
			.from(userBook)
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "Read"),
					gte(userBook.finishedAt, startOfYear),
				),
			);

		// Sum pages read this year (from books finished this year)
		const [pagesReadThisYear] = await db
			.select({
				total: sql<number>`coalesce(sum(${book.pageCount}), 0)`.as("total"),
			})
			.from(userBook)
			.innerJoin(book, eq(book.id, userBook.bookId))
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "Read"),
					gte(userBook.finishedAt, startOfYear),
				),
			);

		// Count currently reading
		const [currentlyReading] = await db
			.select({
				count: sql<number>`count(*)`.as("count"),
			})
			.from(userBook)
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "CurrentlyReading"),
				),
			);

		return {
			booksReadThisYear: Number(booksReadThisYear?.count || 0),
			pagesReadThisYear: Number(pagesReadThisYear?.total || 0),
			currentlyReading: Number(currentlyReading?.count || 0),
		};
	}),

	// Get currently reading books with details
	getCurrentlyReading: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(20).default(6),
				})
				.optional(),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const { limit = 6 } = input ?? {};

			const currentBooks = await db
				.select({
					id: userBook.id,
					bookId: userBook.bookId,
					currentPage: userBook.currentPage,
					startedAt: userBook.startedAt,
					bookTitle: book.title,
					bookCoverUrl: book.coverUrl,
					bookPageCount: book.pageCount,
				})
				.from(userBook)
				.innerJoin(book, eq(book.id, userBook.bookId))
				.where(
					and(
						eq(userBook.userId, userId),
						eq(userBook.status, "CurrentlyReading"),
					),
				)
				.orderBy(userBook.updatedAt)
				.limit(limit);

			return currentBooks.map((b) => ({
				...b,
				progress:
					b.bookPageCount && b.bookPageCount > 0
						? Math.round((b.currentPage / b.bookPageCount) * 100)
						: 0,
			}));
		}),

	// Get reading goal progress
	getReadingGoal: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session?.user?.id;
		if (!userId) {
			throw new Error("User not authenticated");
		}

		// Import user table
		const { user } = await import("@bookmarkd/db/schema/auth");

		// Get user's reading goal
		const [userData] = await db
			.select({
				readingGoal: user.readingGoal,
				readingGoalYear: user.readingGoalYear,
			})
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		const currentYear = new Date().getFullYear();
		const goalYear = userData?.readingGoalYear || currentYear;
		const goal = userData?.readingGoal || 0;

		// If no goal set or goal is for a different year, return null goal
		if (!goal || goalYear !== currentYear) {
			return {
				goal: null,
				booksRead: 0,
				year: currentYear,
			};
		}

		// Count books read this year
		const startOfYear = new Date(currentYear, 0, 1);
		const [booksRead] = await db
			.select({
				count: sql<number>`count(*)`.as("count"),
			})
			.from(userBook)
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "Read"),
					gte(userBook.finishedAt, startOfYear),
				),
			);

		return {
			goal,
			booksRead: Number(booksRead?.count || 0),
			year: currentYear,
		};
	}),

	// Set reading goal
	setReadingGoal: protectedProcedure
		.input(
			z.object({
				goal: z.number().int().min(1).max(365),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const { user } = await import("@bookmarkd/db/schema/auth");
			const currentYear = new Date().getFullYear();

			await db
				.update(user)
				.set({
					readingGoal: input.goal,
					readingGoalYear: currentYear,
				})
				.where(eq(user.id, userId));

			return { success: true, goal: input.goal, year: currentYear };
		}),
};
