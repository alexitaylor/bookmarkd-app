import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { author } from "../schema/author";

const authorData = [
	{ name: "J.R.R. Tolkien" },
	{ name: "George R.R. Martin" },
	{ name: "Brandon Sanderson" },
	{ name: "Patrick Rothfuss" },
	{ name: "Frank Herbert" },
	{ name: "Isaac Asimov" },
	{ name: "Ursula K. Le Guin" },
	{ name: "Terry Pratchett" },
	{ name: "Neil Gaiman" },
	{ name: "Stephen King" },
	{ name: "Agatha Christie" },
	{ name: "Jane Austen" },
	{ name: "F. Scott Fitzgerald" },
	{ name: "Harper Lee" },
	{ name: "George Orwell" },
	{ name: "Aldous Huxley" },
	{ name: "Margaret Atwood" },
	{ name: "Cormac McCarthy" },
	{ name: "Toni Morrison" },
	{ name: "Gabriel García Márquez" },
];

export async function seedAuthors(db: NodePgDatabase) {
	// Clear existing authors
	await db.delete(author);

	const insertedAuthors = await db
		.insert(author)
		.values(authorData)
		.returning();

	// Create a map of author name to id
	const authorMap = new Map<string, number>();
	for (const a of insertedAuthors) {
		authorMap.set(a.name, a.id);
	}

	console.log(`   Inserted ${authorMap.size} authors`);
	return authorMap;
}
