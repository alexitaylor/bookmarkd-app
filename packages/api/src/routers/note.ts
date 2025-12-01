import { db } from "@bookmarkd/db";
import { book } from "@bookmarkd/db/schema/book";
import { chapter } from "@bookmarkd/db/schema/chapter";
import { note } from "@bookmarkd/db/schema/note";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { protectedProcedure } from "../index";

// Input schemas
const createNoteSchema = z.object({
	bookId: z.number(),
	chapterId: z.number().optional(),
	content: z.string().min(1),
	pageNumber: z.number().int().positive().optional(),
	isPublic: z.boolean().default(false),
});

const updateNoteSchema = z.object({
	id: z.number(),
	content: z.string().min(1).optional(),
	pageNumber: z.number().int().positive().nullable().optional(),
	isPublic: z.boolean().optional(),
});

export const noteRouter = {
	// List notes for a book (optionally filtered by chapter)
	list: protectedProcedure
		.input(
			z.object({
				bookId: z.number(),
				chapterId: z.number().optional(),
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
				eq(note.userId, userId),
				eq(note.bookId, input.bookId),
			];

			if (input.chapterId) {
				conditions.push(eq(note.chapterId, input.chapterId));
			}

			const notes = await db
				.select()
				.from(note)
				.where(and(...conditions))
				.limit(input.limit)
				.offset(input.offset)
				.orderBy(note.createdAt);

			return notes;
		}),

	// Get a single note by ID
	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const [foundNote] = await db
				.select()
				.from(note)
				.where(and(eq(note.id, input.id), eq(note.userId, userId)))
				.limit(1);

			if (!foundNote) {
				return null;
			}

			// Get book info
			const [bookInfo] = await db
				.select({ id: book.id, title: book.title })
				.from(book)
				.where(eq(book.id, foundNote.bookId))
				.limit(1);

			// Get chapter info if exists
			let chapterInfo = null;
			if (foundNote.chapterId) {
				const [ch] = await db
					.select({
						id: chapter.id,
						title: chapter.title,
						number: chapter.number,
					})
					.from(chapter)
					.where(eq(chapter.id, foundNote.chapterId))
					.limit(1);
				chapterInfo = ch || null;
			}

			return {
				...foundNote,
				book: bookInfo || null,
				chapter: chapterInfo,
			};
		}),

	// Create a new note
	create: protectedProcedure
		.input(createNoteSchema)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const [newNote] = await db
				.insert(note)
				.values({
					userId,
					bookId: input.bookId,
					chapterId: input.chapterId,
					content: input.content,
					pageNumber: input.pageNumber,
					isPublic: input.isPublic,
				})
				.returning();

			return newNote;
		}),

	// Update a note
	update: protectedProcedure
		.input(updateNoteSchema)
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const { id, ...updateData } = input;

			// Verify ownership
			const [existingNote] = await db
				.select()
				.from(note)
				.where(and(eq(note.id, id), eq(note.userId, userId)))
				.limit(1);

			if (!existingNote) {
				throw new Error("Note not found or not authorized");
			}

			const [updatedNote] = await db
				.update(note)
				.set(updateData)
				.where(eq(note.id, id))
				.returning();

			return updatedNote;
		}),

	// Delete a note
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input, context }) => {
			const userId = context.session?.user?.id;
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Verify ownership before delete
			const [existingNote] = await db
				.select()
				.from(note)
				.where(and(eq(note.id, input.id), eq(note.userId, userId)))
				.limit(1);

			if (!existingNote) {
				throw new Error("Note not found or not authorized");
			}

			await db.delete(note).where(eq(note.id, input.id));

			return { success: true, id: input.id };
		}),
};
