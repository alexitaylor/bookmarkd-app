import { db } from "@bookmarkd/db";
import { book } from "@bookmarkd/db/schema/book";
import { chapter } from "@bookmarkd/db/schema/chapter";
import { vocabulary } from "@bookmarkd/db/schema/vocabulary";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { protectedProcedure } from "../index";

// Input schemas
const addVocabularySchema = z.object({
	bookId: z.number(),
	chapterId: z.number().optional(),
	word: z.string().min(1).max(256),
	definition: z.string().optional(),
	contextSentence: z.string().optional(),
	pageNumber: z.number().int().positive().optional(),
});

const updateVocabularySchema = z.object({
	id: z.number(),
	definition: z.string().optional(),
	contextSentence: z.string().optional(),
	pageNumber: z.number().int().positive().nullable().optional(),
});

export const vocabularyRouter = {
	// List vocabulary for a book
	list: protectedProcedure
		.input(
			z.object({
				bookId: z.number(),
				chapterId: z.number().optional(),
				learnedOnly: z.boolean().optional(),
				limit: z.number().int().min(1).max(100).default(50),
				offset: z.number().int().min(0).default(0),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const conditions = [
				eq(vocabulary.userId, userId),
				eq(vocabulary.bookId, input.bookId),
			];

			if (input.chapterId) {
				conditions.push(eq(vocabulary.chapterId, input.chapterId));
			}

			if (input.learnedOnly !== undefined) {
				conditions.push(eq(vocabulary.learned, input.learnedOnly));
			}

			const words = await db
				.select()
				.from(vocabulary)
				.where(and(...conditions))
				.limit(input.limit)
				.offset(input.offset)
				.orderBy(vocabulary.createdAt);

			return words;
		}),

	// Get a single vocabulary entry by ID
	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const [foundWord] = await db
				.select()
				.from(vocabulary)
				.where(and(eq(vocabulary.id, input.id), eq(vocabulary.userId, userId)))
				.limit(1);

			if (!foundWord) {
				return null;
			}

			// Get book info
			const [bookInfo] = await db
				.select({ id: book.id, title: book.title })
				.from(book)
				.where(eq(book.id, foundWord.bookId))
				.limit(1);

			// Get chapter info if exists
			let chapterInfo = null;
			if (foundWord.chapterId) {
				const [ch] = await db
					.select({
						id: chapter.id,
						title: chapter.title,
						number: chapter.number,
					})
					.from(chapter)
					.where(eq(chapter.id, foundWord.chapterId))
					.limit(1);
				chapterInfo = ch || null;
			}

			return {
				...foundWord,
				book: bookInfo || null,
				chapter: chapterInfo,
			};
		}),

	// Add a new vocabulary word
	add: protectedProcedure
		.input(addVocabularySchema)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const [newWord] = await db
				.insert(vocabulary)
				.values({
					userId,
					bookId: input.bookId,
					chapterId: input.chapterId,
					word: input.word,
					definition: input.definition,
					contextSentence: input.contextSentence,
					pageNumber: input.pageNumber,
				})
				.returning();

			return newWord;
		}),

	// Update a vocabulary entry
	update: protectedProcedure
		.input(updateVocabularySchema)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const { id, ...updateData } = input;

			// Verify ownership
			const [existingWord] = await db
				.select()
				.from(vocabulary)
				.where(and(eq(vocabulary.id, id), eq(vocabulary.userId, userId)))
				.limit(1);

			if (!existingWord) {
				throw new Error("Vocabulary entry not found or not authorized");
			}

			const [updatedWord] = await db
				.update(vocabulary)
				.set(updateData)
				.where(eq(vocabulary.id, id))
				.returning();

			return updatedWord;
		}),

	// Mark a word as learned
	markLearned: protectedProcedure
		.input(z.object({ id: z.number(), learned: z.boolean().default(true) }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Verify ownership
			const [existingWord] = await db
				.select()
				.from(vocabulary)
				.where(and(eq(vocabulary.id, input.id), eq(vocabulary.userId, userId)))
				.limit(1);

			if (!existingWord) {
				throw new Error("Vocabulary entry not found or not authorized");
			}

			const [updatedWord] = await db
				.update(vocabulary)
				.set({ learned: input.learned })
				.where(eq(vocabulary.id, input.id))
				.returning();

			return updatedWord;
		}),

	// Delete a vocabulary entry
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Verify ownership before delete
			const [existingWord] = await db
				.select()
				.from(vocabulary)
				.where(and(eq(vocabulary.id, input.id), eq(vocabulary.userId, userId)))
				.limit(1);

			if (!existingWord) {
				throw new Error("Vocabulary entry not found or not authorized");
			}

			await db.delete(vocabulary).where(eq(vocabulary.id, input.id));

			return { success: true, id: input.id };
		}),
};
