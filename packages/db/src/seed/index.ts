import { db } from "../index";
import { seedAuthors } from "./authors";
import { seedBooks } from "./books";
import { seedChapters } from "./chapters";
import { seedCharacters } from "./characters";
import { seedGenres } from "./genres";
import { seedUserBooks } from "./user-books";

async function main() {
	console.log("🌱 Starting database seed...\n");

	try {
		// Seed in order of dependencies
		console.log("📚 Seeding genres...");
		await seedGenres(db);

		console.log("✍️  Seeding authors...");
		await seedAuthors(db);

		console.log("📖 Seeding books...");
		const bookIds = await seedBooks(db);

		console.log("📑 Seeding chapters...");
		await seedChapters(db, bookIds);

		console.log("🧑 Seeding characters...");
		await seedCharacters(db, bookIds);

		console.log("📚 Seeding user books...");
		await seedUserBooks(db, bookIds);

		console.log("\n✅ Database seeded successfully!");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		process.exit(1);
	}

	process.exit(0);
}

main();
