import z from "zod";
import { publicProcedure } from "../../index";
import { queryBookList } from "../../services/book-queries";

export const bookDiscoveryRouter = {
	// Get popular books (most added to shelves + highest rated)
	getPopular: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
					offset: z.number().int().min(0).default(0),
					genreId: z.number().int().optional(),
					query: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const {
				limit = 20,
				offset = 0,
				genreId,
				query: searchQuery,
			} = input ?? {};

			return queryBookList({
				limit,
				offset,
				genreId,
				searchQuery,
				orderBy: "popular",
			});
		}),

	// Get recently added books
	getRecent: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
					offset: z.number().int().min(0).default(0),
					genreId: z.number().int().optional(),
					query: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const {
				limit = 20,
				offset = 0,
				genreId,
				query: searchQuery,
			} = input ?? {};

			return queryBookList({
				limit,
				offset,
				genreId,
				searchQuery,
				orderBy: "recent",
			});
		}),

	// Get all books sorted alphabetically by title
	getAll: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
					offset: z.number().int().min(0).default(0),
					genreId: z.number().int().optional(),
					query: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const {
				limit = 20,
				offset = 0,
				genreId,
				query: searchQuery,
			} = input ?? {};

			return queryBookList({
				limit,
				offset,
				genreId,
				searchQuery,
				orderBy: "title",
			});
		}),

	// Get books sorted by highest rating
	getByRating: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
					offset: z.number().int().min(0).default(0),
					genreId: z.number().int().optional(),
					query: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ input }) => {
			const {
				limit = 20,
				offset = 0,
				genreId,
				query: searchQuery,
			} = input ?? {};

			return queryBookList({
				limit,
				offset,
				genreId,
				searchQuery,
				orderBy: "rating",
			});
		}),
};
