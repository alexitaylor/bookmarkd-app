import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { author, bookAuthor } from "../schema/author";
import { book } from "../schema/book";
import { bookGenre, genre } from "../schema/genre";

const bookData = [
	{
		title: "The Fellowship of the Ring",
		titleLong: "The Fellowship of the Ring: The Lord of the Rings, Part 1",
		subtitle: "The Lord of the Rings, Part 1",
		isbn: "0547928211",
		isbn13: "9780547928210",
		synopsis:
			"In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, the Dark Lord, forged the One Ring, filling it with his own power so that he could rule all others. But the One Ring was taken from him, and though he sought it throughout Middle-earth, it remained lost to him. After many ages it fell by chance into the hands of the hobbit Bilbo Baggins.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780547928210-L.jpg",
		publisher: "Houghton Mifflin Harcourt",
		pageCount: 423,
		language: "English",
		datePublished: "1954-07-29",
		binding: "Paperback",
		edition: "50th Anniversary Edition",
		msrp: "18.99",
		authors: ["J.R.R. Tolkien"],
		genres: ["Fantasy", "Epic Fantasy"],
	},
	{
		title: "The Two Towers",
		titleLong: "The Two Towers: The Lord of the Rings, Part 2",
		subtitle: "The Lord of the Rings, Part 2",
		isbn: "0547928203",
		isbn13: "9780547928203",
		synopsis:
			"Frodo and his Companions of the Ring have been beset by danger during their quest to prevent the Ruling Ring from falling into the hands of the Dark Lord by destroying it in the Cracks of Doom.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780547928203-L.jpg",
		publisher: "Houghton Mifflin Harcourt",
		pageCount: 352,
		language: "English",
		datePublished: "1954-11-11",
		binding: "Paperback",
		edition: "50th Anniversary Edition",
		msrp: "18.99",
		authors: ["J.R.R. Tolkien"],
		genres: ["Fantasy", "Epic Fantasy"],
	},
	{
		title: "A Game of Thrones",
		titleLong: "A Game of Thrones: A Song of Ice and Fire, Book 1",
		subtitle: "A Song of Ice and Fire, Book 1",
		isbn: "0553593714",
		isbn13: "9780553593716",
		synopsis:
			"Long ago, in a time forgotten, a preternatural event threw the seasons out of balance. In a land where summers can last decades and winters a lifetime, trouble is brewing. The cold is returning, and in the frozen wastes to the north of Winterfell, sinister forces are massing beyond the kingdom's protective Wall.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780553593716-L.jpg",
		publisher: "Bantam Books",
		pageCount: 835,
		language: "English",
		datePublished: "1996-08-01",
		binding: "Mass Market Paperback",
		edition: "1",
		msrp: "9.99",
		authors: ["George R.R. Martin"],
		genres: ["Fantasy", "Epic Fantasy"],
	},
	{
		title: "The Name of the Wind",
		subtitle: "The Kingkiller Chronicle, Day One",
		isbn: "9780756404741",
		synopsis:
			"Told in Kvothe's own voice, this is the tale of the magically gifted young man who grows to be the most notorious wizard his world has ever seen. A high-action story written with a survey of the literary form and target audience.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780756404741-L.jpg",
		publisher: "DAW Books",
		pageCount: 662,
		language: "English",
		datePublished: "2007-03-27",
		authors: ["Patrick Rothfuss"],
		genres: ["Fantasy", "Epic Fantasy"],
	},
	{
		title: "Dune",
		isbn: "9780441013593",
		synopsis:
			"Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange, a drug capable of extending life and expanding consciousness.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg",
		publisher: "Ace Books",
		pageCount: 688,
		language: "English",
		datePublished: "1965-08-01",
		authors: ["Frank Herbert"],
		genres: ["Science Fiction", "Space Opera"],
	},
	{
		title: "Foundation",
		isbn: "9780553293357",
		synopsis:
			"For twelve thousand years the Galactic Empire has ruled supreme. Now it is dying. But only Hari Seldon, creator of the revolutionary science of psychohistory, can see into the future—to a dark age of ignorance, barbarism, and warfare that will last thirty thousand years.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg",
		publisher: "Bantam Spectra",
		pageCount: 244,
		language: "English",
		datePublished: "1951-05-01",
		authors: ["Isaac Asimov"],
		genres: ["Science Fiction", "Space Opera"],
	},
	{
		title: "1984",
		isbn: "9780451524935",
		synopsis:
			"Winston Smith toes the Party line, rewriting history to satisfy the demands of the Ministry of Truth. With each lie he writes, Winston grows to hate the Party that seeks power for its own sake and persecutes those who dare to commit thoughtcrimes.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
		publisher: "Signet Classics",
		pageCount: 328,
		language: "English",
		datePublished: "1949-06-08",
		authors: ["George Orwell"],
		genres: ["Science Fiction", "Dystopian"],
	},
	{
		title: "Good Omens",
		subtitle: "The Nice and Accurate Prophecies of Agnes Nutter, Witch",
		isbn: "9780060853983",
		synopsis:
			"According to The Nice and Accurate Prophecies of Agnes Nutter, Witch, the world will end on a Saturday. Next Saturday, in fact. Just before dinner. So the armies of Good and Evil are amassing, and everything appears to be going according to Divine Plan. Except a somewhat fussy angel and a fast-living demon are not actually looking forward to the coming Rapture.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780060853983-L.jpg",
		publisher: "William Morrow",
		pageCount: 400,
		language: "English",
		datePublished: "1990-05-01",
		authors: ["Terry Pratchett", "Neil Gaiman"],
		genres: ["Fantasy", "Urban Fantasy"],
	},
	{
		title: "The Shining",
		isbn: "9780307743657",
		synopsis:
			"Jack Torrance's new job at the Overlook Hotel is the perfect chance for a fresh start. As the off-season caretaker at the atmospheric old hotel, he'll have plenty of time to spend reconnecting with his family and working on his writing. But as the harsh winter weather sets in, the idyllic location feels ever more remote...and more sinister.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780307743657-L.jpg",
		publisher: "Anchor",
		pageCount: 447,
		language: "English",
		datePublished: "1977-01-28",
		authors: ["Stephen King"],
		genres: ["Horror", "Thriller"],
	},
	{
		title: "Pride and Prejudice",
		isbn: "9780141439518",
		synopsis:
			"When Elizabeth Bennet first meets eligible bachelor Fitzwilliam Darcy, she thinks him arrogant and conceited; he is indifferent to her good looks and lively mind. When she later discovers that Darcy has involved himself in the troubled relationship between his friend Bingley and her beloved sister Jane, she is determined to dislike him more than ever.",
		coverUrl: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
		publisher: "Penguin Classics",
		pageCount: 432,
		language: "English",
		datePublished: "1813-01-28",
		authors: ["Jane Austen"],
		genres: ["Romance", "Literary Fiction"],
	},
];

export async function seedBooks(db: NodePgDatabase) {
	// Clear existing books (cascade will handle related tables)
	await db.delete(book);

	// Get author and genre maps
	const authors = await db.select().from(author);
	const authorMap = new Map(authors.map((a) => [a.name, a.id]));

	const genres = await db.select().from(genre);
	const genreMap = new Map(genres.map((g) => [g.name, g.id]));

	const bookIds: Record<string, number> = {};

	for (const b of bookData) {
		// Insert book
		const [insertedBook] = await db
			.insert(book)
			.values({
				title: b.title,
				titleLong: "titleLong" in b ? b.titleLong : undefined,
				subtitle: b.subtitle,
				isbn: b.isbn,
				isbn13: "isbn13" in b ? b.isbn13 : undefined,
				synopsis: b.synopsis,
				coverUrl: b.coverUrl,
				publisher: b.publisher,
				pageCount: b.pageCount,
				language: b.language,
				datePublished: b.datePublished,
				binding: "binding" in b ? b.binding : undefined,
				edition: "edition" in b ? b.edition : undefined,
				msrp: "msrp" in b ? b.msrp : undefined,
			})
			.returning();

		if (!insertedBook) continue;

		bookIds[b.title] = insertedBook.id;

		// Link authors
		for (const authorName of b.authors) {
			const authorId = authorMap.get(authorName);
			if (authorId) {
				await db.insert(bookAuthor).values({
					bookId: insertedBook.id,
					authorId,
				});
			}
		}

		// Link genres
		for (const genreName of b.genres) {
			const genreId = genreMap.get(genreName);
			if (genreId) {
				await db.insert(bookGenre).values({
					bookId: insertedBook.id,
					genreId,
				});
			}
		}
	}

	console.log(`   Inserted ${Object.keys(bookIds).length} books`);
	return bookIds;
}
