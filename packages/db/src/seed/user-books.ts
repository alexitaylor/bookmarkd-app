import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { user } from "../schema/auth";
import { userBook } from "../schema/user-book";

// Your user ID
const TEST_USER_ID = "zM6Xs57VpVXJUoVF5hy2puZSpvbOxGjm";

export async function seedUserBooks(
	db: NodePgDatabase,
	bookIds: Record<string, number>,
) {
	// Clear existing user books for this user
	await db.delete(userBook);

	// Set reading goal for the test user
	const currentYear = new Date().getFullYear();
	await db
		.update(user)
		.set({
			readingGoal: 24, // Goal of 24 books this year
			readingGoalYear: currentYear,
		})
		.where(eq(user.id, TEST_USER_ID));

	console.log(`   Set reading goal: 24 books for ${currentYear}`);

	const now = new Date();
	const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
	const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

	const userBooksData = [
		// Currently Reading
		{
			bookTitle: "The Fellowship of the Ring",
			status: "CurrentlyReading" as const,
			currentPage: 156,
			startedAt: oneWeekAgo,
		},
		{
			bookTitle: "Dune",
			status: "CurrentlyReading" as const,
			currentPage: 342,
			startedAt: twoWeeksAgo,
		},
		// Read (finished)
		{
			bookTitle: "1984",
			status: "Read" as const,
			currentPage: 328, // Full book
			rating: 5,
			startedAt: twoMonthsAgo,
			finishedAt: oneMonthAgo,
		},
		{
			bookTitle: "The Name of the Wind",
			status: "Read" as const,
			currentPage: 662, // Full book
			rating: 5,
			startedAt: twoMonthsAgo,
			finishedAt: oneWeekAgo,
		},
		{
			bookTitle: "Good Omens",
			status: "Read" as const,
			currentPage: 400, // Full book
			rating: 4,
			startedAt: oneMonthAgo,
			finishedAt: twoWeeksAgo,
		},
		// Want to Read
		{
			bookTitle: "The Two Towers",
			status: "WantToRead" as const,
			currentPage: 0,
		},
		{
			bookTitle: "A Game of Thrones",
			status: "WantToRead" as const,
			currentPage: 0,
		},
		{
			bookTitle: "Foundation",
			status: "WantToRead" as const,
			currentPage: 0,
		},
		// Did Not Finish
		{
			bookTitle: "The Shining",
			status: "DNF" as const,
			currentPage: 89,
			startedAt: oneMonthAgo,
		},
	];

	let insertedCount = 0;

	for (const ub of userBooksData) {
		const bookId = bookIds[ub.bookTitle];
		if (!bookId) {
			console.log(`   ⚠️ Book not found: ${ub.bookTitle}`);
			continue;
		}

		await db.insert(userBook).values({
			userId: TEST_USER_ID,
			bookId,
			status: ub.status,
			currentPage: ub.currentPage,
			rating: ub.rating,
			startedAt: ub.startedAt,
			finishedAt: ub.finishedAt,
		});

		insertedCount++;
	}

	console.log(`   Inserted ${insertedCount} user books for test user`);
}
