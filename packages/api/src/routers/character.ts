import { db } from "@bookmarkd/db";
import { book } from "@bookmarkd/db/schema/book";
import { character, characterAlias } from "@bookmarkd/db/schema/character";
import { eq, ilike } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../index";

// Input schemas
const createCharacterSchema = z.object({
	bookId: z.number(),
	name: z.string().min(1).max(256),
	description: z.string().optional(),
	imageUrl: z.string().url().optional(),
	aiGenerated: z.boolean().default(false),
	aliases: z.array(z.string().min(1).max(256)).optional(),
});

const updateCharacterSchema = z.object({
	id: z.number(),
	name: z.string().min(1).max(256).optional(),
	description: z.string().optional(),
	imageUrl: z.string().url().nullable().optional(),
	aiGenerated: z.boolean().optional(),
});

export const characterRouter = {
	// Get all characters for a book
	getByBookId: publicProcedure
		.input(
			z.object({
				bookId: z.number(),
				limit: z.number().int().min(1).max(100).default(50),
				offset: z.number().int().min(0).default(0),
			}),
		)
		.handler(async ({ input }) => {
			const characters = await db
				.select()
				.from(character)
				.where(eq(character.bookId, input.bookId))
				.limit(input.limit)
				.offset(input.offset)
				.orderBy(character.name);

			return characters;
		}),

	// Get character by ID with aliases
	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [foundCharacter] = await db
				.select()
				.from(character)
				.where(eq(character.id, input.id))
				.limit(1);

			if (!foundCharacter) {
				return null;
			}

			// Get book info
			const [bookInfo] = await db
				.select({
					id: book.id,
					title: book.title,
				})
				.from(book)
				.where(eq(book.id, foundCharacter.bookId))
				.limit(1);

			// Get aliases
			const aliases = await db
				.select({
					id: characterAlias.id,
					alias: characterAlias.alias,
				})
				.from(characterAlias)
				.where(eq(characterAlias.characterId, input.id));

			return {
				...foundCharacter,
				book: bookInfo || null,
				aliases,
			};
		}),

	// Search characters by name or alias
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				bookId: z.number().optional(),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.handler(async ({ input }) => {
			const searchPattern = `%${input.query}%`;

			// Search by character name
			let nameQuery = db
				.select()
				.from(character)
				.where(ilike(character.name, searchPattern))
				.limit(input.limit);

			if (input.bookId) {
				nameQuery = db
					.select()
					.from(character)
					.where(eq(character.bookId, input.bookId))
					.limit(input.limit);
			}

			const charactersByName = await nameQuery;

			// Search by alias
			const charactersByAlias = await db
				.select({
					id: character.id,
					bookId: character.bookId,
					name: character.name,
					description: character.description,
					imageUrl: character.imageUrl,
					aiGenerated: character.aiGenerated,
					createdAt: character.createdAt,
					updatedAt: character.updatedAt,
				})
				.from(character)
				.innerJoin(characterAlias, eq(characterAlias.characterId, character.id))
				.where(ilike(characterAlias.alias, searchPattern))
				.limit(input.limit);

			// Combine and deduplicate
			const allCharacters = [...charactersByName, ...charactersByAlias];
			const uniqueCharacters = Array.from(
				new Map(allCharacters.map((c) => [c.id, c])).values(),
			);

			return uniqueCharacters.slice(0, input.limit);
		}),

	// Create a new character (protected)
	create: protectedProcedure
		.input(createCharacterSchema)
		.handler(async ({ input }) => {
			const { aliases, ...characterData } = input;

			// Insert character
			const [newCharacter] = await db
				.insert(character)
				.values(characterData)
				.returning();

			if (!newCharacter) {
				throw new Error("Failed to create character");
			}

			// Insert aliases
			if (aliases && aliases.length > 0) {
				await db.insert(characterAlias).values(
					aliases.map((alias) => ({
						characterId: newCharacter.id,
						alias,
					})),
				);
			}

			return newCharacter;
		}),

	// Update a character (protected)
	update: protectedProcedure
		.input(updateCharacterSchema)
		.handler(async ({ input }) => {
			const { id, ...updateData } = input;

			const [updatedCharacter] = await db
				.update(character)
				.set(updateData)
				.where(eq(character.id, id))
				.returning();

			if (!updatedCharacter) {
				throw new Error("Character not found");
			}

			return updatedCharacter;
		}),

	// Delete a character (protected)
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			const [deletedCharacter] = await db
				.delete(character)
				.where(eq(character.id, input.id))
				.returning();

			if (!deletedCharacter) {
				throw new Error("Character not found");
			}

			return { success: true, id: input.id };
		}),

	// Add alias to character (protected)
	addAlias: protectedProcedure
		.input(
			z.object({
				characterId: z.number(),
				alias: z.string().min(1).max(256),
			}),
		)
		.handler(async ({ input }) => {
			const [newAlias] = await db
				.insert(characterAlias)
				.values({
					characterId: input.characterId,
					alias: input.alias,
				})
				.returning();

			return newAlias;
		}),

	// Remove alias from character (protected)
	removeAlias: protectedProcedure
		.input(z.object({ aliasId: z.number() }))
		.handler(async ({ input }) => {
			const [deletedAlias] = await db
				.delete(characterAlias)
				.where(eq(characterAlias.id, input.aliasId))
				.returning();

			if (!deletedAlias) {
				throw new Error("Alias not found");
			}

			return { success: true, id: input.aliasId };
		}),

	// Approve an AI-generated character (protected - moderator/admin only)
	// TODO: Add role-based authorization check for moderator/admin
	approve: protectedProcedure
		.input(z.object({ id: z.number() }))
		.handler(async ({ input }) => {
			// Verify character exists and is AI-generated
			const [existingCharacter] = await db
				.select()
				.from(character)
				.where(eq(character.id, input.id))
				.limit(1);

			if (!existingCharacter) {
				throw new Error("Character not found");
			}

			if (!existingCharacter.aiGenerated) {
				throw new Error(
					"Character is not AI-generated and does not need approval",
				);
			}

			// Mark as approved by setting aiGenerated to false
			const [approvedCharacter] = await db
				.update(character)
				.set({ aiGenerated: false })
				.where(eq(character.id, input.id))
				.returning();

			return approvedCharacter;
		}),
};
