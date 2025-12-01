import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { book } from "./book";
import { note } from "./note";
import { review } from "./review";

export const comment = pgTable(
	"comment",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// Polymorphic: comment can be on a book, review, note, or as a reply to another comment
		bookId: integer("book_id").references(() => book.id, {
			onDelete: "cascade",
		}),
		reviewId: integer("review_id").references(() => review.id, {
			onDelete: "cascade",
		}),
		noteId: integer("note_id").references(() => note.id, {
			onDelete: "cascade",
		}),
		parentId: integer("parent_id").references((): AnyPgColumn => comment.id, {
			onDelete: "cascade",
		}),
		content: text("content").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("comment_user_idx").on(table.userId),
		index("comment_book_idx").on(table.bookId),
		index("comment_review_idx").on(table.reviewId),
		index("comment_note_idx").on(table.noteId),
		index("comment_parent_idx").on(table.parentId),
	],
);
