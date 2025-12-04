import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { book } from "./book";
import { chapter } from "./chapter";

export const note = pgTable(
	"note",
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
		content: text("content").notNull(),
		pageNumber: integer("page_number"),
		isPublic: boolean("is_public").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("note_user_book_idx").on(table.userId, table.bookId),
		index("note_chapter_idx").on(table.chapterId),
	],
);
