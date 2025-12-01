import { db } from "@bookmarkd/db";
import { user } from "@bookmarkd/db/schema/auth";
import { book } from "@bookmarkd/db/schema/book";
import { review, reviewVote } from "@bookmarkd/db/schema/review";
import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../index";

// Input schemas
const createReviewSchema = z.object({
	bookId: z.number(),
	rating: z.number().int().min(1).max(5),
	content: z.string().optional(),
});

const updateReviewSchema = z.object({
	id: z.number(),
	rating: z.number().int().min(1).max(5).optional(),
	content: z.string().optional(),
});

export const reviewRouter = {
	// List reviews for a book (public)
	list: publicProcedure
		.input(
			z.object({
				bookId: z.number(),
				limit: z.number().int().min(1).max(100).default(20),
				offset: z.number().int().min(0).default(0),
			}),
		)
		.handler(async ({ input }) => {
			const reviews = await db
				.select({
					id: review.id,
					userId: review.userId,
					bookId: review.bookId,
					rating: review.rating,
					content: review.content,
					createdAt: review.createdAt,
					updatedAt: review.updatedAt,
					userName: user.name,
					userImage: user.image,
				})
				.from(review)
				.innerJoin(user, eq(user.id, review.userId))
				.where(eq(review.bookId, input.bookId))
				.limit(input.limit)
				.offset(input.offset)
				.orderBy(desc(review.createdAt));

			// Get vote counts for each review
			const reviewIds = reviews.map((r) => r.id);
			if (reviewIds.length === 0) {
				return [];
			}

			const voteCounts = await db
				.select({
					reviewId: reviewVote.reviewId,
					helpfulCount:
						sql<number>`SUM(CASE WHEN ${reviewVote.value} = 1 THEN 1 ELSE 0 END)`.as(
							"helpful_count",
						),
					notHelpfulCount:
						sql<number>`SUM(CASE WHEN ${reviewVote.value} = -1 THEN 1 ELSE 0 END)`.as(
							"not_helpful_count",
						),
				})
				.from(reviewVote)
				.groupBy(reviewVote.reviewId);

			const voteMap = new Map(
				voteCounts.map((v) => [
					v.reviewId,
					{
						helpful: Number(v.helpfulCount),
						notHelpful: Number(v.notHelpfulCount),
					},
				]),
			);

			return reviews.map((r) => ({
				...r,
				votes: voteMap.get(r.id) || { helpful: 0, notHelpful: 0 },
			}));
		}),

	// Get a single review by ID (public)
	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [foundReview] = await db
				.select({
					id: review.id,
					userId: review.userId,
					bookId: review.bookId,
					rating: review.rating,
					content: review.content,
					createdAt: review.createdAt,
					updatedAt: review.updatedAt,
					userName: user.name,
					userImage: user.image,
				})
				.from(review)
				.innerJoin(user, eq(user.id, review.userId))
				.where(eq(review.id, input.id))
				.limit(1);

			if (!foundReview) {
				return null;
			}

			// Get book info
			const [bookInfo] = await db
				.select({ id: book.id, title: book.title, coverUrl: book.coverUrl })
				.from(book)
				.where(eq(book.id, foundReview.bookId))
				.limit(1);

			// Get vote counts
			const [voteCounts] = await db
				.select({
					helpfulCount:
						sql<number>`SUM(CASE WHEN ${reviewVote.value} = 1 THEN 1 ELSE 0 END)`.as(
							"helpful_count",
						),
					notHelpfulCount:
						sql<number>`SUM(CASE WHEN ${reviewVote.value} = -1 THEN 1 ELSE 0 END)`.as(
							"not_helpful_count",
						),
				})
				.from(reviewVote)
				.where(eq(reviewVote.reviewId, input.id));

			return {
				...foundReview,
				book: bookInfo || null,
				votes: {
					helpful: Number(voteCounts?.helpfulCount || 0),
					notHelpful: Number(voteCounts?.notHelpfulCount || 0),
				},
			};
		}),

	// Get user's review for a specific book
	getUserReview: protectedProcedure
		.input(z.object({ bookId: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const [foundReview] = await db
				.select()
				.from(review)
				.where(and(eq(review.userId, userId), eq(review.bookId, input.bookId)))
				.limit(1);

			return foundReview || null;
		}),

	// Create a review
	create: protectedProcedure
		.input(createReviewSchema)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Check if user already reviewed this book
			const [existing] = await db
				.select()
				.from(review)
				.where(and(eq(review.userId, userId), eq(review.bookId, input.bookId)))
				.limit(1);

			if (existing) {
				throw new Error("You have already reviewed this book");
			}

			const [newReview] = await db
				.insert(review)
				.values({
					userId,
					bookId: input.bookId,
					rating: input.rating,
					content: input.content,
				})
				.returning();

			return newReview;
		}),

	// Update a review
	update: protectedProcedure
		.input(updateReviewSchema)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const { id, ...updateData } = input;

			// Verify ownership
			const [existingReview] = await db
				.select()
				.from(review)
				.where(and(eq(review.id, id), eq(review.userId, userId)))
				.limit(1);

			if (!existingReview) {
				throw new Error("Review not found or not authorized");
			}

			const [updatedReview] = await db
				.update(review)
				.set(updateData)
				.where(eq(review.id, id))
				.returning();

			return updatedReview;
		}),

	// Delete a review
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Verify ownership
			const [existingReview] = await db
				.select()
				.from(review)
				.where(and(eq(review.id, input.id), eq(review.userId, userId)))
				.limit(1);

			if (!existingReview) {
				throw new Error("Review not found or not authorized");
			}

			await db.delete(review).where(eq(review.id, input.id));

			return { success: true, id: input.id };
		}),

	// Vote on a review (helpful/not helpful)
	vote: protectedProcedure
		.input(
			z.object({
				reviewId: z.number(),
				value: z.number().refine((v) => v === 1 || v === -1, {
					message: "Value must be 1 (helpful) or -1 (not helpful)",
				}),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Check if user owns the review
			const [reviewOwner] = await db
				.select()
				.from(review)
				.where(eq(review.id, input.reviewId))
				.limit(1);

			if (!reviewOwner) {
				throw new Error("Review not found");
			}

			if (reviewOwner.userId === userId) {
				throw new Error("You cannot vote on your own review");
			}

			// Check if user already voted
			const [existingVote] = await db
				.select()
				.from(reviewVote)
				.where(
					and(
						eq(reviewVote.reviewId, input.reviewId),
						eq(reviewVote.userId, userId),
					),
				)
				.limit(1);

			if (existingVote) {
				if (existingVote.value === input.value) {
					// Remove vote if same value
					await db.delete(reviewVote).where(eq(reviewVote.id, existingVote.id));
					return { success: true, action: "removed" };
				}
				// Update vote if different value
				const [updatedVote] = await db
					.update(reviewVote)
					.set({ value: input.value })
					.where(eq(reviewVote.id, existingVote.id))
					.returning();
				return { success: true, action: "updated", vote: updatedVote };
			}

			// Create new vote
			const [newVote] = await db
				.insert(reviewVote)
				.values({
					reviewId: input.reviewId,
					userId,
					value: input.value,
				})
				.returning();

			return { success: true, action: "created", vote: newVote };
		}),
};
