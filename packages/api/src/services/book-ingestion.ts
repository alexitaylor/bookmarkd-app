import { db } from "@bookmarkd/db";
import { author, bookAuthor } from "@bookmarkd/db/schema/author";
import { book } from "@bookmarkd/db/schema/book";
import { bookGenre, genre } from "@bookmarkd/db/schema/genre";
import { eq } from "drizzle-orm";
import type { NormalizedExternalBook } from "./isbndb-client";

// Result type for upserted book with relations
export interface UpsertedBook {
	id: number;
	title: string;
	titleLong: string | null;
	subtitle: string | null;
	isbn: string | null;
	isbn13: string | null;
	synopsis: string | null;
	overview: string | null;
	excerpt: string | null;
	coverUrl: string | null;
	imageOriginal: string | null;
	publisher: string | null;
	pageCount: number | null;
	language: string | null;
	datePublished: string | null;
	binding: string | null;
	edition: string | null;
	msrp: string | null;
	dimensions: string | null;
	createdAt: Date;
	updatedAt: Date;
	authors: { id: number; name: string }[];
	genres: { id: number; name: string }[];
}

// Upsert an author by name (case-insensitive match)
async function upsertAuthor(
	name: string,
): Promise<{ id: number; name: string }> {
	const trimmedName = name.trim();

	// Try to find existing author (case-insensitive)
	const [existing] = await db
		.select()
		.from(author)
		.where(eq(author.name, trimmedName))
		.limit(1);

	if (existing) {
		return { id: existing.id, name: existing.name };
	}

	// Create new author
	const [created] = await db
		.insert(author)
		.values({ name: trimmedName })
		.returning();

	if (!created) {
		throw new Error(`Failed to create author: ${trimmedName}`);
	}

	return { id: created.id, name: created.name };
}

// Upsert a genre by name (case-insensitive match)
async function upsertGenre(
	name: string,
): Promise<{ id: number; name: string }> {
	const trimmedName = name.trim();

	// Try to find existing genre (case-insensitive)
	const [existing] = await db
		.select()
		.from(genre)
		.where(eq(genre.name, trimmedName))
		.limit(1);

	if (existing) {
		return { id: existing.id, name: existing.name };
	}

	// Create new genre
	const [created] = await db
		.insert(genre)
		.values({ name: trimmedName })
		.returning();

	if (!created) {
		throw new Error(`Failed to create genre: ${trimmedName}`);
	}

	return { id: created.id, name: created.name };
}

// Check if a book already exists by ISBN13 or ISBN
async function findExistingBook(
	isbn13: string | null,
	isbn: string | null,
): Promise<typeof book.$inferSelect | null> {
	if (isbn13) {
		const [existing] = await db
			.select()
			.from(book)
			.where(eq(book.isbn13, isbn13))
			.limit(1);
		if (existing) return existing;
	}

	if (isbn) {
		const [existing] = await db
			.select()
			.from(book)
			.where(eq(book.isbn, isbn))
			.limit(1);
		if (existing) return existing;
	}

	return null;
}

// Get authors for a book
async function getBookAuthors(
	bookId: number,
): Promise<{ id: number; name: string }[]> {
	const results = await db
		.select({
			id: author.id,
			name: author.name,
		})
		.from(author)
		.innerJoin(bookAuthor, eq(bookAuthor.authorId, author.id))
		.where(eq(bookAuthor.bookId, bookId));

	return results;
}

// Get genres for a book
async function getBookGenres(
	bookId: number,
): Promise<{ id: number; name: string }[]> {
	const results = await db
		.select({
			id: genre.id,
			name: genre.name,
		})
		.from(genre)
		.innerJoin(bookGenre, eq(bookGenre.genreId, genre.id))
		.where(eq(bookGenre.bookId, bookId));

	return results;
}

// Upsert an external book into the database (idempotent)
export async function upsertExternalBook(
	externalBook: NormalizedExternalBook,
): Promise<UpsertedBook> {
	// Check if book already exists
	const existingBook = await findExistingBook(
		externalBook.isbn13,
		externalBook.isbn,
	);

	if (existingBook) {
		// Return existing book with its relations
		const authors = await getBookAuthors(existingBook.id);
		const genres = await getBookGenres(existingBook.id);

		return {
			...existingBook,
			authors,
			genres,
		};
	}

	// Insert new book
	const [newBook] = await db
		.insert(book)
		.values({
			title: externalBook.title,
			titleLong: externalBook.titleLong,
			subtitle: externalBook.subtitle,
			isbn: externalBook.isbn,
			isbn13: externalBook.isbn13,
			synopsis: externalBook.synopsis,
			overview: externalBook.overview,
			excerpt: externalBook.excerpt,
			coverUrl: externalBook.coverUrl,
			imageOriginal: externalBook.imageOriginal,
			publisher: externalBook.publisher,
			pageCount: externalBook.pageCount,
			language: externalBook.language,
			datePublished: externalBook.datePublished,
			binding: externalBook.binding,
			edition: externalBook.edition,
			msrp: externalBook.msrp?.toString() ?? null,
			dimensions: externalBook.dimensions,
		})
		.returning();

	if (!newBook) {
		throw new Error(`Failed to create book: ${externalBook.title}`);
	}

	// Upsert and link authors
	const authorRecords: { id: number; name: string }[] = [];
	for (const authorName of externalBook.authors) {
		if (authorName.trim()) {
			const authorRecord = await upsertAuthor(authorName);
			authorRecords.push(authorRecord);

			// Link author to book (ignore if already exists)
			try {
				await db.insert(bookAuthor).values({
					bookId: newBook.id,
					authorId: authorRecord.id,
				});
			} catch (error) {
				// Ignore unique constraint violations
			}
		}
	}

	// Upsert and link genres (limit to first 5 to avoid too many)
	const genreRecords: { id: number; name: string }[] = [];
	const genresToProcess = externalBook.genres.slice(0, 5);
	for (const genreName of genresToProcess) {
		if (genreName.trim()) {
			const genreRecord = await upsertGenre(genreName);
			genreRecords.push(genreRecord);

			// Link genre to book (ignore if already exists)
			try {
				await db.insert(bookGenre).values({
					bookId: newBook.id,
					genreId: genreRecord.id,
				});
			} catch (error) {
				// Ignore unique constraint violations
			}
		}
	}

	return {
		...newBook,
		authors: authorRecords,
		genres: genreRecords,
	};
}

// Batch upsert multiple books
export async function upsertExternalBooks(
	externalBooks: NormalizedExternalBook[],
): Promise<UpsertedBook[]> {
	const results: UpsertedBook[] = [];

	for (const externalBook of externalBooks) {
		try {
			const upsertedBook = await upsertExternalBook(externalBook);
			results.push(upsertedBook);
		} catch (error) {
			console.error(`Failed to upsert book "${externalBook.title}":`, error);
			// Continue with other books
		}
	}

	return results;
}
