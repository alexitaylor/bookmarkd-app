import { db } from "@bookmarkd/db";
import { book } from "@bookmarkd/db/schema/book";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure } from "../../index";

export const userBookGoalsRouter = {
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

	// Get reading calendar data for a specific year/month
	getReadingCalendar: protectedProcedure
		.input(
			z.object({
				year: z.number().int(),
				month: z.number().int().min(1).max(12),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Get start and end of month
			const startOfMonth = new Date(input.year, input.month - 1, 1);
			const endOfMonth = new Date(input.year, input.month, 0, 23, 59, 59, 999);

			// Get all books finished in this month
			const finishedBooks = await db
				.select({
					id: userBook.id,
					bookId: userBook.bookId,
					finishedAt: userBook.finishedAt,
					rating: userBook.rating,
					bookTitle: book.title,
					bookCoverUrl: book.coverUrl,
					bookPageCount: book.pageCount,
				})
				.from(userBook)
				.innerJoin(book, eq(book.id, userBook.bookId))
				.where(
					and(
						eq(userBook.userId, userId),
						eq(userBook.status, "Read"),
						gte(userBook.finishedAt, startOfMonth),
						lte(userBook.finishedAt, endOfMonth),
					),
				)
				.orderBy(userBook.finishedAt);

			// Group books by day
			const booksByDay: Record<
				string,
				Array<{
					id: number;
					bookId: number;
					title: string;
					coverUrl: string | null;
					pageCount: number | null;
					rating: number | null;
				}>
			> = {};

			for (const fb of finishedBooks) {
				if (!fb.finishedAt) continue;
				const day = fb.finishedAt.toISOString().split("T")[0];
				if (!day) continue;
				if (!booksByDay[day]) {
					booksByDay[day] = [];
				}
				booksByDay[day].push({
					id: fb.id,
					bookId: fb.bookId,
					title: fb.bookTitle,
					coverUrl: fb.bookCoverUrl,
					pageCount: fb.bookPageCount,
					rating: fb.rating,
				});
			}

			return {
				year: input.year,
				month: input.month,
				booksByDay,
				totalBooks: finishedBooks.length,
			};
		}),
};
