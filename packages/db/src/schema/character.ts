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
import { book } from "./book";

export const character = pgTable(
	"character",
	{
		id: serial("id").primaryKey(),
		bookId: integer("book_id")
			.notNull()
			.references(() => book.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 256 }).notNull(),
		description: text("description"),
		imageUrl: text("image_url"),
		aiGenerated: boolean("ai_generated").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("character_name_idx").on(table.name)],
);

export const characterAlias = pgTable("character_alias", {
	id: serial("id").primaryKey(),
	characterId: integer("character_id")
		.notNull()
		.references(() => character.id, { onDelete: "cascade" }),
	alias: varchar("alias", { length: 256 }).notNull(),
});
