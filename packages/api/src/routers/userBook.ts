import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre, genre } from "@bookmarkd/db/schema/genre";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
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
	// Get shelf counts for all statuses (lightweight query for tab badges)
	getShelfCounts: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session?.user?.id;
		if (!userId) {
			throw new Error("User not authenticated");
		}

		const counts = await db
			.select({
				status: userBook.status,
				count: sql<number>`count(*)`.as("count"),
			})
			.from(userBook)
			.where(eq(userBook.userId, userId))
			.groupBy(userBook.status);

		// Convert to object format
		const countMap: Record<string, number> = {};
		for (const c of counts) {
			countMap[c.status] = Number(c.count);
		}

		return {
			wantToRead: countMap.WantToRead || 0,
			currentlyReading: countMap.CurrentlyReading || 0,
			read: countMap.Read || 0,
			dnf: countMap.DNF || 0,
		};
	}),

	// Get books for a specific shelf status
	getShelfBooks: protectedProcedure
		.input(
			z.object({
				status: bookStatusSchema,
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Get user books with book info for the specified status
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
					bookDatePublished: book.datePublished,
				})
				.from(userBook)
				.innerJoin(book, eq(book.id, userBook.bookId))
				.where(
					and(eq(userBook.userId, userId), eq(userBook.status, input.status)),
				)
				.orderBy(userBook.updatedAt);

			// Get authors for all books in one query
			const bookIds = userBooks.map((ub) => ub.bookId);
			const { inArray } = await import("drizzle-orm");

			const bookAuthors =
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

			// Group authors by book
			const authorsByBook: Record<number, string[]> = {};
			for (const ba of bookAuthors) {
				if (!authorsByBook[ba.bookId]) {
					authorsByBook[ba.bookId] = [];
				}
				authorsByBook?.[ba.bookId]?.push(ba.authorName);
			}

			// Add authors to user books
			return userBooks.map((ub) => ({
				...ub,
				bookAuthors: authorsByBook[ub.bookId]?.join(", ") || null,
			}));
		}),

	// Get user's book shelves (grouped by status) - kept for backwards compatibility
	getShelves: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session?.user?.id;
		if (!userId) {
			throw new Error("User not authenticated");
		}

		// First get all user books with book info
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
				bookDatePublished: book.datePublished,
			})
			.from(userBook)
			.innerJoin(book, eq(book.id, userBook.bookId))
			.where(eq(userBook.userId, userId))
			.orderBy(userBook.updatedAt);

		// Get authors for all books in one query
		const bookIds = userBooks.map((ub) => ub.bookId);
		const { inArray } = await import("drizzle-orm");

		const bookAuthors =
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

		// Group authors by book
		const authorsByBook: Record<number, string[]> = {};
		for (const ba of bookAuthors) {
			if (!authorsByBook[ba.bookId]) {
				authorsByBook[ba.bookId] = [];
			}
			authorsByBook?.[ba.bookId]?.push(ba.authorName);
		}

		// Add authors to user books
		const userBooksWithAuthors = userBooks.map((ub) => ({
			...ub,
			bookAuthors: authorsByBook[ub.bookId]?.join(", ") || null,
		}));

		// Group by status
		const shelves = {
			wantToRead: userBooksWithAuthors.filter(
				(ub) => ub.status === "WantToRead",
			),
			currentlyReading: userBooksWithAuthors.filter(
				(ub) => ub.status === "CurrentlyReading",
			),
			read: userBooksWithAuthors.filter((ub) => ub.status === "Read"),
			dnf: userBooksWithAuthors.filter((ub) => ub.status === "DNF"),
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

			const { inArray } = await import("drizzle-orm");

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

		const { inArray } = await import("drizzle-orm");

		// Get start of current year and month
		const now = new Date();
		const currentYear = now.getFullYear();
		const startOfYear = new Date(currentYear, 0, 1);
		const startOfMonth = new Date(currentYear, now.getMonth(), 1);

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

		// Books completed this month
		const [booksThisMonth] = await db
			.select({
				count: sql<number>`count(*)`.as("count"),
			})
			.from(userBook)
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "Read"),
					gte(userBook.finishedAt, startOfMonth),
				),
			);

		// Average pages per day (pages read this year / days elapsed in year)
		const daysElapsed = Math.max(
			1,
			Math.ceil(
				(now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
			),
		);
		const avgPagesPerDay = Math.round(
			Number(pagesReadThisYear?.total || 0) / daysElapsed,
		);

		// Reading streak - count consecutive days with activity (using updatedAt on currently reading books)
		// For simplicity, we'll check how many unique days in the last 30 days had reading activity
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const recentActivity = await db
			.select({
				activityDate: sql<string>`DATE(${userBook.updatedAt})`.as(
					"activity_date",
				),
			})
			.from(userBook)
			.where(
				and(
					eq(userBook.userId, userId),
					gte(userBook.updatedAt, thirtyDaysAgo),
				),
			)
			.groupBy(sql`DATE(${userBook.updatedAt})`)
			.orderBy(desc(sql`DATE(${userBook.updatedAt})`));

		// Calculate streak from today backwards
		let readingStreak = 0;
		const today = new Date().toISOString().split("T")[0];
		const activityDates = new Set(recentActivity.map((a) => a.activityDate));

		for (let i = 0; i < 30; i++) {
			const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0];
			if (activityDates.has(checkDate)) {
				readingStreak++;
			} else if (i > 0) {
				// Allow skipping today if no activity yet
				break;
			}
		}

		// Longest book read (all time)
		const [longestBook] = await db
			.select({
				pageCount: book.pageCount,
				title: book.title,
			})
			.from(userBook)
			.innerJoin(book, eq(book.id, userBook.bookId))
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "Read"),
					isNotNull(book.pageCount),
				),
			)
			.orderBy(desc(book.pageCount))
			.limit(1);

		// Average book length (all time for read books)
		const [avgBookLength] = await db
			.select({
				avg: sql<number>`coalesce(avg(${book.pageCount}), 0)`.as("avg"),
			})
			.from(userBook)
			.innerJoin(book, eq(book.id, userBook.bookId))
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "Read"),
					isNotNull(book.pageCount),
				),
			);

		// Favorite genre (most read genre)
		const genreCounts = await db
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
			.limit(1);

		const favoriteGenre = genreCounts[0]?.genreName || null;

		// Unique authors read (all time)
		const [uniqueAuthors] = await db
			.select({
				count: sql<number>`count(distinct ${author.id})`.as("count"),
			})
			.from(userBook)
			.innerJoin(bookAuthor, eq(bookAuthor.bookId, userBook.bookId))
			.innerJoin(author, eq(author.id, bookAuthor.authorId))
			.where(and(eq(userBook.userId, userId), eq(userBook.status, "Read")));

		// Average days to finish a book
		const [avgDaysToFinish] = await db
			.select({
				avg: sql<number>`coalesce(avg(extract(epoch from (${userBook.finishedAt} - ${userBook.startedAt})) / 86400), 0)`.as(
					"avg",
				),
			})
			.from(userBook)
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "Read"),
					isNotNull(userBook.startedAt),
					isNotNull(userBook.finishedAt),
				),
			);

		// Fastest read (shortest time to finish a book)
		const [fastestRead] = await db
			.select({
				days: sql<number>`extract(epoch from (${userBook.finishedAt} - ${userBook.startedAt})) / 86400`.as(
					"days",
				),
				title: book.title,
			})
			.from(userBook)
			.innerJoin(book, eq(book.id, userBook.bookId))
			.where(
				and(
					eq(userBook.userId, userId),
					eq(userBook.status, "Read"),
					isNotNull(userBook.startedAt),
					isNotNull(userBook.finishedAt),
				),
			)
			.orderBy(
				sql`extract(epoch from (${userBook.finishedAt} - ${userBook.startedAt}))`,
			)
			.limit(1);

		return {
			// Original stats
			booksReadThisYear: Number(booksReadThisYear?.count || 0),
			pagesReadThisYear: Number(pagesReadThisYear?.total || 0),
			currentlyReading: Number(currentlyReading?.count || 0),

			// Reading Activity Stats
			avgPagesPerDay,
			readingStreak,
			booksThisMonth: Number(booksThisMonth?.count || 0),

			// Achievement Stats
			longestBookRead: longestBook?.pageCount
				? {
						pages: longestBook.pageCount,
						title: longestBook.title,
					}
				: null,
			favoriteGenre,
			uniqueAuthorsRead: Number(uniqueAuthors?.count || 0),

			// Progress Stats
			avgBookLength: Math.round(Number(avgBookLength?.avg || 0)),

			// Time-based Stats
			avgDaysToFinish: Math.round(Number(avgDaysToFinish?.avg || 0)),
			fastestRead: fastestRead?.days
				? {
						days: Math.round(Number(fastestRead.days)),
						title: fastestRead.title,
					}
				: null,
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
