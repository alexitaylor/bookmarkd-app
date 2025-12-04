import {
	integer,
	pgTable,
	serial,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { book } from "./book";

export const chapter = pgTable(
	"chapter",
	{
		id: serial("id").primaryKey(),
		bookId: integer("book_id")
			.notNull()
			.references(() => book.id, { onDelete: "cascade" }),
		number: integer("number").notNull(),
		title: varchar("title", { length: 256 }),
		startPage: integer("start_page"),
		endPage: integer("end_page"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("chapter_number_unique").on(table.bookId, table.number),
	],
);
