import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { character, characterAlias } from "../schema/character";

interface CharacterData {
	name: string;
	description: string;
	aliases?: string[];
	imageUrl?: string;
}

const characterData: Record<string, CharacterData[]> = {
	"The Fellowship of the Ring": [
		{
			name: "Frodo Baggins",
			description:
				"A young hobbit from the Shire who inherits the One Ring from his uncle Bilbo. He is tasked with the burden of destroying it in the fires of Mount Doom.",
			aliases: ["Mr. Underhill", "Ring-bearer"],
		},
		{
			name: "Gandalf",
			description:
				"A wise and powerful wizard, one of the Istari sent to Middle-earth. He guides and protects Frodo on his quest.",
			aliases: ["Gandalf the Grey", "Mithrandir", "The Grey Pilgrim"],
		},
		{
			name: "Samwise Gamgee",
			description:
				"Frodo's loyal gardener and closest friend. He accompanies Frodo throughout the quest, providing unwavering support and friendship.",
			aliases: ["Sam", "Samwise the Brave"],
		},
		{
			name: "Aragorn",
			description:
				"The heir of Isildur and rightful king of Gondor. A skilled ranger who joins the Fellowship to protect Frodo.",
			aliases: ["Strider", "Elessar", "Dunadan"],
		},
		{
			name: "Legolas",
			description:
				"An Elf prince of the Woodland Realm and skilled archer. He represents the Elves in the Fellowship.",
		},
		{
			name: "Gimli",
			description:
				"A Dwarf warrior and son of Glóin. He represents the Dwarves in the Fellowship and forms an unlikely friendship with Legolas.",
		},
	],
	"A Game of Thrones": [
		{
			name: "Eddard Stark",
			description:
				"Lord of Winterfell and Warden of the North. An honorable man who becomes Hand of the King to Robert Baratheon.",
			aliases: ["Ned", "The Quiet Wolf"],
		},
		{
			name: "Jon Snow",
			description:
				"The bastard son of Eddard Stark, raised at Winterfell. He joins the Night's Watch to find his purpose.",
			aliases: ["Lord Snow", "The Bastard of Winterfell"],
		},
		{
			name: "Daenerys Targaryen",
			description:
				"The exiled princess of House Targaryen, sold into marriage to Khal Drogo. She dreams of reclaiming the Iron Throne.",
			aliases: ["Dany", "Khaleesi", "Mother of Dragons", "The Unburnt"],
		},
		{
			name: "Tyrion Lannister",
			description:
				"The dwarf son of Tywin Lannister. Despite his family's disdain, he is clever, witty, and one of the most intelligent characters in the realm.",
			aliases: ["The Imp", "Halfman"],
		},
		{
			name: "Arya Stark",
			description:
				"The youngest daughter of Eddard Stark. A tomboy who rejects traditional feminine roles and dreams of becoming a warrior.",
			aliases: ["Arya Underfoot", "Arya Horseface"],
		},
		{
			name: "Bran Stark",
			description:
				"The second son of Eddard Stark. After a fall leaves him crippled, he discovers he has mysterious powers.",
			aliases: ["Bran the Broken"],
		},
	],
	"The Name of the Wind": [
		{
			name: "Kvothe",
			description:
				"The protagonist and narrator of the story. A legendary figure known for his many talents and exploits, now living as an innkeeper named Kote.",
			aliases: ["Kote", "Reshi", "The Kingkiller", "Bloodless"],
		},
		{
			name: "Denna",
			description:
				"A beautiful and mysterious woman who captures Kvothe's heart. She appears and disappears throughout his life.",
			aliases: ["Dianne", "Dinnah", "Donna"],
		},
		{
			name: "Bast",
			description:
				"Kvothe's student and assistant at the Waystone Inn. He is secretly a Fae creature deeply devoted to his master.",
			aliases: ["Bastas"],
		},
		{
			name: "Chronicler",
			description:
				"A scribe who seeks out Kvothe to record his true story. He serves as the frame narrator.",
			aliases: ["Devan Lochees"],
		},
		{
			name: "Ambrose Jakis",
			description:
				"A wealthy noble student at the University and Kvothe's bitter rival. Arrogant and vindictive.",
		},
	],
	Dune: [
		{
			name: "Paul Atreides",
			description:
				"The protagonist, son of Duke Leto Atreides. He becomes the prophesied messiah of the Fremen people.",
			aliases: ["Muad'Dib", "Usul", "The Kwisatz Haderach", "Lisan al-Gaib"],
		},
		{
			name: "Duke Leto Atreides",
			description:
				"Paul's father and ruler of House Atreides. A noble and beloved leader who is given control of Arrakis.",
			aliases: ["The Red Duke"],
		},
		{
			name: "Lady Jessica",
			description:
				"Paul's mother and a Bene Gesserit. She defied her order by bearing a son instead of a daughter for Duke Leto.",
		},
		{
			name: "Baron Vladimir Harkonnen",
			description:
				"The grotesquely obese and cruel ruler of House Harkonnen. The primary antagonist plotting against House Atreides.",
			aliases: ["The Baron"],
		},
		{
			name: "Stilgar",
			description:
				"The leader of Sietch Tabr, a Fremen community. He becomes an ally and mentor to Paul.",
		},
		{
			name: "Chani",
			description:
				"A young Fremen woman who becomes Paul's lover and the mother of his children.",
		},
	],
	"1984": [
		{
			name: "Winston Smith",
			description:
				"The protagonist, a low-ranking member of the Party who secretly harbors rebellious thoughts against Big Brother.",
		},
		{
			name: "Julia",
			description:
				"A dark-haired woman who works in the Fiction Department. She becomes Winston's lover and fellow rebel.",
		},
		{
			name: "O'Brien",
			description:
				"A mysterious Inner Party member whom Winston believes to be a secret revolutionary. His true nature is revealed later.",
		},
		{
			name: "Big Brother",
			description:
				"The seemingly omniscient leader of the Party. His face appears on posters everywhere with the caption 'Big Brother is Watching You.'",
		},
	],
};

export async function seedCharacters(
	db: NodePgDatabase,
	bookIds: Record<string, number>,
) {
	// Clear existing characters
	await db.delete(character);

	let totalCharacters = 0;
	let totalAliases = 0;

	for (const [bookTitle, characters] of Object.entries(characterData)) {
		const bookId = bookIds[bookTitle];
		if (!bookId) continue;

		// Insert characters
		for (const char of characters) {
			const [insertedChar] = await db
				.insert(character)
				.values({
					bookId,
					name: char.name,
					description: char.description,
					imageUrl: char.imageUrl,
					aiGenerated: false,
				})
				.returning();

			if (!insertedChar) continue;

			totalCharacters++;

			// Insert aliases
			if (char.aliases) {
				for (const alias of char.aliases) {
					await db.insert(characterAlias).values({
						characterId: insertedChar.id,
						alias,
					});
					totalAliases++;
				}
			}
		}
	}

	console.log(`   Inserted ${totalCharacters} characters`);
	console.log(`   Inserted ${totalAliases} character aliases`);
}
