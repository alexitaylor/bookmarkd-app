import {
	pgTable,
	serial,
	varchar,
	text,
	integer,
	timestamp,
	index,
} from "drizzle-orm/pg-core";

export const book = pgTable(
	"book",
	{
		id: serial("id").primaryKey(),
		title: varchar("title", { length: 256 }).notNull(),
		subtitle: varchar("subtitle", { length: 512 }),
		isbn: varchar("isbn", { length: 13 }),
		isbn13: varchar("isbn13", { length: 13 }),
		synopsis: text("synopsis"),
		coverUrl: text("cover_url"),
		publisher: varchar("publisher", { length: 256 }),
		pageCount: integer("page_count"),
		language: varchar("language", { length: 64 }),
		datePublished: varchar("date_published", { length: 64 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("book_title_idx").on(table.title)],
);
