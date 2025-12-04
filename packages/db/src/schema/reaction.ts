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
import { comment } from "./comment";
import { reactionEnum } from "./enums";
import { note } from "./note";
import { review } from "./review";

export const reaction = pgTable(
	"reaction",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: reactionEnum("type").notNull(),
		// Polymorphic: reaction can be on a comment, review, or note
		commentId: integer("comment_id").references(() => comment.id, {
			onDelete: "cascade",
		}),
		reviewId: integer("review_id").references(() => review.id, {
			onDelete: "cascade",
		}),
		noteId: integer("note_id").references(() => note.id, {
			onDelete: "cascade",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// Ensure a user can only react once per item per type
		uniqueIndex("reaction_user_comment_unique").on(
			table.userId,
			table.commentId,
		),
		uniqueIndex("reaction_user_review_unique").on(table.userId, table.reviewId),
		uniqueIndex("reaction_user_note_unique").on(table.userId, table.noteId),
		index("reaction_comment_idx").on(table.commentId),
		index("reaction_review_idx").on(table.reviewId),
		index("reaction_note_idx").on(table.noteId),
	],
);
