import {
	integer,
	pgTable,
	serial,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { book } from "./book";

export const author = pgTable("author", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 256 }).notNull(),
});

export const bookAuthor = pgTable(
	"book_author",
	{
		id: serial("id").primaryKey(),
		bookId: integer("book_id")
			.notNull()
			.references(() => book.id, { onDelete: "cascade" }),
		authorId: integer("author_id")
			.notNull()
			.references(() => author.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("book_author_unique").on(table.bookId, table.authorId),
	],
);
