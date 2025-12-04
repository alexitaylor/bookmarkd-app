import z from "zod";
import { publicProcedure } from "../../index";
import { upsertExternalBook } from "../../services/book-ingestion";
import { searchLocalBooks } from "../../services/book-search";
import {
	fetchBookByISBN,
	searchBooksFromISBNdb,
} from "../../services/isbndb-client";

export const bookSearchRouter = {
	// Search books by title, author name, or ISBN using trigram similarity
	// Only searches local DB - use searchExternal for ISBNdb
	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.handler(async ({ input }) => {
			const searchQuery = input.query.trim();

			// Search local DB only
			const localResults = await searchLocalBooks(searchQuery, input.limit);

			return {
				local: localResults,
				hasExternalResults: localResults.length === 0,
			};
		}),

	// Add a book by ISBN from ISBNdb
	addFromISBN: publicProcedure
		.input(z.object({ isbn: z.string().min(10).max(17) }))
		.handler(async ({ input }) => {
			const externalBook = await fetchBookByISBN(input.isbn);
			if (!externalBook) {
				throw new Error(`Book with ISBN ${input.isbn} not found`);
			}

			const upsertedBook = await upsertExternalBook(externalBook);
			return upsertedBook;
		}),

	// Search external ISBNdb API without storing results
	// User must explicitly call addFromISBN to import a book
	searchExternal: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.handler(async ({ input }) => {
			const results = await searchBooksFromISBNdb(input.query, input.limit);
			return { external: results };
		}),
};
