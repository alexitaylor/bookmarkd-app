import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { book } from "./book";
import { bookStatusEnum } from "./enums";

export const userBook = pgTable(
	"user_book",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		bookId: integer("book_id")
			.notNull()
			.references(() => book.id, { onDelete: "cascade" }),
		status: bookStatusEnum("status").default("None").notNull(),
		currentPage: integer("current_page").default(0).notNull(),
		rating: integer("rating"), // 1-5 star rating
		startedAt: timestamp("started_at"),
		finishedAt: timestamp("finished_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [uniqueIndex("user_book_unique").on(table.userId, table.bookId)],
);
