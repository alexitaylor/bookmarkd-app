import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre, genre } from "@bookmarkd/db/schema/genre";
import { review } from "@bookmarkd/db/schema/review";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../../index";
import { getAuthorsForBooks } from "../../services/book-queries";

export const bookRecommendationsRouter = {
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
			const authorsByBook = await getAuthorsForBooks(bookIds);

			return uniqueBooks.map((b) => ({
				id: b.id,
				title: b.title,
				subtitle: b.subtitle,
				coverUrl: b.coverUrl,
				pageCount: b.pageCount,
				authors: authorsByBook.get(b.id) || [],
			}));
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
