import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { book } from "./book";
import { chapter } from "./chapter";

export const vocabulary = pgTable(
	"vocabulary",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		bookId: integer("book_id")
			.notNull()
			.references(() => book.id, { onDelete: "cascade" }),
		chapterId: integer("chapter_id").references(() => chapter.id, {
			onDelete: "set null",
		}),
		word: varchar("word", { length: 256 }).notNull(),
		definition: text("definition"),
		contextSentence: text("context_sentence"),
		pageNumber: integer("page_number"),
		learned: boolean("learned").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("vocabulary_user_book_idx").on(table.userId, table.bookId),
		index("vocabulary_word_idx").on(table.word),
	],
);
