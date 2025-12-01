import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { chapter } from "../schema/chapter";

const chapterData: Record<
	string,
	Array<{ number: number; title: string; startPage?: number; endPage?: number }>
> = {
	"The Fellowship of the Ring": [
		{ number: 1, title: "A Long-expected Party", startPage: 21, endPage: 42 },
		{ number: 2, title: "The Shadow of the Past", startPage: 43, endPage: 70 },
		{ number: 3, title: "Three is Company", startPage: 71, endPage: 95 },
		{ number: 4, title: "A Short Cut to Mushrooms", startPage: 96, endPage: 109 },
		{ number: 5, title: "A Conspiracy Unmasked", startPage: 110, endPage: 122 },
		{ number: 6, title: "The Old Forest", startPage: 123, endPage: 138 },
		{ number: 7, title: "In the House of Tom Bombadil", startPage: 139, endPage: 153 },
		{ number: 8, title: "Fog on the Barrow-Downs", startPage: 154, endPage: 169 },
		{ number: 9, title: "At the Sign of The Prancing Pony", startPage: 170, endPage: 185 },
		{ number: 10, title: "Strider", startPage: 186, endPage: 201 },
	],
	"A Game of Thrones": [
		{ number: 1, title: "Bran I", startPage: 1, endPage: 15 },
		{ number: 2, title: "Catelyn I", startPage: 16, endPage: 28 },
		{ number: 3, title: "Daenerys I", startPage: 29, endPage: 42 },
		{ number: 4, title: "Eddard I", startPage: 43, endPage: 58 },
		{ number: 5, title: "Jon I", startPage: 59, endPage: 72 },
		{ number: 6, title: "Catelyn II", startPage: 73, endPage: 86 },
		{ number: 7, title: "Arya I", startPage: 87, endPage: 98 },
		{ number: 8, title: "Bran II", startPage: 99, endPage: 112 },
		{ number: 9, title: "Tyrion I", startPage: 113, endPage: 126 },
		{ number: 10, title: "Jon II", startPage: 127, endPage: 140 },
	],
	"The Name of the Wind": [
		{ number: 1, title: "A Place for Demons", startPage: 1, endPage: 8 },
		{ number: 2, title: "A Beautiful Day", startPage: 9, endPage: 18 },
		{ number: 3, title: "Wood and Word", startPage: 19, endPage: 28 },
		{ number: 4, title: "Lanre Turned", startPage: 29, endPage: 42 },
		{ number: 5, title: "Notes", startPage: 43, endPage: 52 },
		{ number: 6, title: "The Price of Remembering", startPage: 53, endPage: 68 },
		{ number: 7, title: "Of Beginnings and the Names of Things", startPage: 69, endPage: 84 },
		{ number: 8, title: "Thieves, Heretics, and Whores", startPage: 85, endPage: 98 },
		{ number: 9, title: "Riding in the Wagon with Ben", startPage: 99, endPage: 114 },
		{ number: 10, title: "Alar and Several Stones", startPage: 115, endPage: 130 },
	],
	Dune: [
		{ number: 1, title: "Book One: Dune", startPage: 1, endPage: 50 },
		{ number: 2, title: "The Gom Jabbar", startPage: 51, endPage: 75 },
		{ number: 3, title: "Leaving Caladan", startPage: 76, endPage: 100 },
		{ number: 4, title: "Arrival on Arrakis", startPage: 101, endPage: 150 },
		{ number: 5, title: "The Spice", startPage: 151, endPage: 200 },
		{ number: 6, title: "Book Two: Muad'Dib", startPage: 201, endPage: 280 },
		{ number: 7, title: "The Desert", startPage: 281, endPage: 350 },
		{ number: 8, title: "Stilgar", startPage: 351, endPage: 420 },
		{ number: 9, title: "Book Three: The Prophet", startPage: 421, endPage: 550 },
		{ number: 10, title: "The War", startPage: 551, endPage: 688 },
	],
	"1984": [
		{ number: 1, title: "Part One, Chapter 1", startPage: 1, endPage: 22 },
		{ number: 2, title: "Part One, Chapter 2", startPage: 23, endPage: 35 },
		{ number: 3, title: "Part One, Chapter 3", startPage: 36, endPage: 48 },
		{ number: 4, title: "Part One, Chapter 4", startPage: 49, endPage: 65 },
		{ number: 5, title: "Part One, Chapter 5", startPage: 66, endPage: 82 },
		{ number: 6, title: "Part Two, Chapter 1", startPage: 83, endPage: 110 },
		{ number: 7, title: "Part Two, Chapter 2", startPage: 111, endPage: 145 },
		{ number: 8, title: "Part Two, Chapter 3", startPage: 146, endPage: 180 },
		{ number: 9, title: "Part Three, Chapter 1", startPage: 181, endPage: 250 },
		{ number: 10, title: "Part Three, Chapter 2", startPage: 251, endPage: 328 },
	],
};

export async function seedChapters(
	db: NodePgDatabase,
	bookIds: Record<string, number>,
) {
	// Clear existing chapters
	await db.delete(chapter);

	let totalChapters = 0;

	for (const [bookTitle, chapters] of Object.entries(chapterData)) {
		const bookId = bookIds[bookTitle];
		if (!bookId) continue;

		for (const ch of chapters) {
			await db.insert(chapter).values({
				bookId,
				number: ch.number,
				title: ch.title,
				startPage: ch.startPage,
				endPage: ch.endPage,
			});
			totalChapters++;
		}
	}

	console.log(`   Inserted ${totalChapters} chapters`);
}
