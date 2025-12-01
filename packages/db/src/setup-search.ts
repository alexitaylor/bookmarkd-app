import dotenv from "dotenv";
import { Client } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

dotenv.config({
	path: "../../apps/server/.env",
});

async function setupSearch() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		await client.connect();
		console.log("Connected to database");

		const sql = readFileSync(join(import.meta.dir, "setup-search.sql"), "utf-8");

		await client.query(sql);
		console.log("✓ pg_trgm extension enabled");
		console.log("✓ Trigram indexes created on book.title and author.name");
		console.log("✓ ISBN indexes created");
		console.log("\nSearch setup complete!");
	} catch (error) {
		console.error("Error setting up search:", error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

setupSearch();
