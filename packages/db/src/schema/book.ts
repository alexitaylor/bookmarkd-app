import {
	decimal,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const book = pgTable(
	"book",
	{
		id: serial("id").primaryKey(),
		title: varchar("title", { length: 256 }).notNull(),
		titleLong: varchar("title_long", { length: 512 }),
		subtitle: varchar("subtitle", { length: 512 }),
		isbn: varchar("isbn", { length: 13 }),
		isbn13: varchar("isbn13", { length: 13 }),
		synopsis: text("synopsis"),
		overview: text("overview"),
		excerpt: text("excerpt"),
		coverUrl: text("cover_url"),
		imageOriginal: text("image_original"),
		publisher: varchar("publisher", { length: 256 }),
		pageCount: integer("page_count"),
		language: varchar("language", { length: 64 }),
		datePublished: varchar("date_published", { length: 64 }),
		binding: varchar("binding", { length: 64 }),
		edition: varchar("edition", { length: 64 }),
		msrp: decimal("msrp", { precision: 10, scale: 2 }),
		dimensions: varchar("dimensions", { length: 256 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("book_title_idx").on(table.title)],
);
