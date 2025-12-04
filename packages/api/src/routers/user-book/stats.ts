import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre, genre } from "@bookmarkd/db/schema/genre";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure } from "../../index";

export const userBookStatsRouter = {
	// Get user's reading stats
	getStats: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session?.user?.id;
		if (!userId) {
			throw new Error("User not authenticated");
		}

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

		// Reading streak - count consecutive days with activity
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
		const activityDates = new Set(recentActivity.map((a) => a.activityDate));

		for (let i = 0; i < 30; i++) {
			const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0];
			if (checkDate && activityDates.has(checkDate)) {
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
};
