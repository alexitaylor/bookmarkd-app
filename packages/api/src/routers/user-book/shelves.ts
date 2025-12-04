import { db } from "@bookmarkd/db";
import { userBook } from "@bookmarkd/db/schema/user-book";
import { eq, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure } from "../../index";
import { getUserBooksWithDetails } from "../../services/user-book-queries";

// Book status enum matching the database
const bookStatusSchema = z.enum([
	"WantToRead",
	"CurrentlyReading",
	"Read",
	"DNF",
	"None",
]);

export const userBookShelvesRouter = {
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

			return getUserBooksWithDetails(userId, input.status);
		}),

	// Get user's book shelves (grouped by status) - kept for backwards compatibility
	getShelves: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session?.user?.id;
		if (!userId) {
			throw new Error("User not authenticated");
		}

		const userBooksWithAuthors = await getUserBooksWithDetails(userId);

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
};
