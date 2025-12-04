import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
	integer,
	pgTable,
	serial,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { book } from "./book";

export const genre = pgTable("genre", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 256 }).notNull(),
	parentId: integer("parent_id").references((): AnyPgColumn => genre.id),
});

export const bookGenre = pgTable(
	"book_genre",
	{
		id: serial("id").primaryKey(),
		bookId: integer("book_id")
			.notNull()
			.references(() => book.id, { onDelete: "cascade" }),
		genreId: integer("genre_id")
			.notNull()
			.references(() => genre.id, { onDelete: "cascade" }),
	},
	(table) => [uniqueIndex("book_genre_unique").on(table.bookId, table.genreId)],
);
