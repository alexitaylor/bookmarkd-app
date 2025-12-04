import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { book } from "./book";

export const review = pgTable(
	"review",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		bookId: integer("book_id")
			.notNull()
			.references(() => book.id, { onDelete: "cascade" }),
		rating: integer("rating").notNull(), // 1-5 stars
		content: text("content"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("review_user_book_unique").on(table.userId, table.bookId),
		index("review_book_idx").on(table.bookId),
	],
);

export const reviewVote = pgTable(
	"review_vote",
	{
		id: serial("id").primaryKey(),
		reviewId: integer("review_id")
			.notNull()
			.references(() => review.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		value: integer("value").notNull(), // +1 (helpful) or -1 (not helpful)
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("review_vote_unique").on(table.reviewId, table.userId),
	],
);
