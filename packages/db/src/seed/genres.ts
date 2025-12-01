import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { genre } from "../schema/genre";

const genreData = [
	// Parent genres
	{ name: "Fiction" },
	{ name: "Non-Fiction" },
	{ name: "Poetry" },

	// Fiction subgenres (will get parentId after insert)
	{ name: "Fantasy", parent: "Fiction" },
	{ name: "Science Fiction", parent: "Fiction" },
	{ name: "Mystery", parent: "Fiction" },
	{ name: "Thriller", parent: "Fiction" },
	{ name: "Romance", parent: "Fiction" },
	{ name: "Horror", parent: "Fiction" },
	{ name: "Literary Fiction", parent: "Fiction" },
	{ name: "Historical Fiction", parent: "Fiction" },
	{ name: "Young Adult", parent: "Fiction" },

	// Fantasy subgenres
	{ name: "Epic Fantasy", parent: "Fantasy" },
	{ name: "Urban Fantasy", parent: "Fantasy" },
	{ name: "Dark Fantasy", parent: "Fantasy" },

	// Science Fiction subgenres
	{ name: "Space Opera", parent: "Science Fiction" },
	{ name: "Cyberpunk", parent: "Science Fiction" },
	{ name: "Dystopian", parent: "Science Fiction" },

	// Non-Fiction subgenres
	{ name: "Biography", parent: "Non-Fiction" },
	{ name: "Memoir", parent: "Non-Fiction" },
	{ name: "Self-Help", parent: "Non-Fiction" },
	{ name: "History", parent: "Non-Fiction" },
	{ name: "Science", parent: "Non-Fiction" },
	{ name: "Philosophy", parent: "Non-Fiction" },
	{ name: "True Crime", parent: "Non-Fiction" },
];

export async function seedGenres(db: NodePgDatabase) {
	// Clear existing genres
	await db.delete(genre);

	// First, insert parent genres (no parentId)
	const parentGenres = genreData.filter((g) => !g.parent);
	const insertedParents = (await db
		.insert(genre)
		.values(parentGenres.map((g) => ({ name: g.name })))
		.returning()) as { id: number; name: string }[];

	// Create a map of genre name to id
	const genreMap = new Map<string, number>();
	for (const g of insertedParents) {
		genreMap.set(g.name, g.id);
	}

	// Insert child genres with parentId
	const childGenres = genreData.filter((g) => g.parent);
	for (const g of childGenres) {
		const parentId = genreMap.get(g.parent!);
		if (parentId) {
			const [inserted] = (await db
				.insert(genre)
				.values({ name: g.name, parentId })
				.returning()) as { id: number; name: string }[];
			if (inserted) {
				genreMap.set(g.name, inserted.id);
			}
		}
	}

	console.log(`   Inserted ${genreMap.size} genres`);
	return genreMap;
}
