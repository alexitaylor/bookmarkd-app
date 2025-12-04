import { relations } from "drizzle-orm";

// Import all tables
import { account, session, user, userRole } from "./auth";
import { author, bookAuthor } from "./author";
import { book } from "./book";
import { chapter } from "./chapter";
import { character, characterAlias } from "./character";
import { comment } from "./comment";
import { bookGenre, genre } from "./genre";
import { note } from "./note";
import { reaction } from "./reaction";
import { review, reviewVote } from "./review";
import { userBook } from "./user-book";
import { vocabulary } from "./vocabulary";

// -------------------------
// AUTH RELATIONS
// -------------------------

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	roles: many(userRole),
	userBooks: many(userBook),
	notes: many(note),
	vocabulary: many(vocabulary),
	reviews: many(review),
	reviewVotes: many(reviewVote),
	comments: many(comment),
	reactions: many(reaction),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

// -------------------------
// BOOK RELATIONS
// -------------------------

export const bookRelations = relations(book, ({ many }) => ({
	bookAuthors: many(bookAuthor),
	bookGenres: many(bookGenre),
	chapters: many(chapter),
	characters: many(character),
	userBooks: many(userBook),
	notes: many(note),
	vocabulary: many(vocabulary),
	reviews: many(review),
	comments: many(comment),
}));

// -------------------------
// AUTHOR RELATIONS
// -------------------------

export const authorRelations = relations(author, ({ many }) => ({
	bookAuthors: many(bookAuthor),
}));

export const bookAuthorRelations = relations(bookAuthor, ({ one }) => ({
	book: one(book, {
		fields: [bookAuthor.bookId],
		references: [book.id],
	}),
	author: one(author, {
		fields: [bookAuthor.authorId],
		references: [author.id],
	}),
}));

// -------------------------
// GENRE RELATIONS
// -------------------------

export const genreRelations = relations(genre, ({ one, many }) => ({
	parent: one(genre, {
		fields: [genre.parentId],
		references: [genre.id],
		relationName: "genreHierarchy",
	}),
	children: many(genre, { relationName: "genreHierarchy" }),
	bookGenres: many(bookGenre),
}));

export const bookGenreRelations = relations(bookGenre, ({ one }) => ({
	book: one(book, {
		fields: [bookGenre.bookId],
		references: [book.id],
	}),
	genre: one(genre, {
		fields: [bookGenre.genreId],
		references: [genre.id],
	}),
}));

// -------------------------
// CHAPTER RELATIONS
// -------------------------

export const chapterRelations = relations(chapter, ({ one, many }) => ({
	book: one(book, {
		fields: [chapter.bookId],
		references: [book.id],
	}),
	notes: many(note),
	vocabulary: many(vocabulary),
}));

// -------------------------
// CHARACTER RELATIONS
// -------------------------

export const characterRelations = relations(character, ({ one, many }) => ({
	book: one(book, {
		fields: [character.bookId],
		references: [book.id],
	}),
	aliases: many(characterAlias),
}));

export const characterAliasRelations = relations(characterAlias, ({ one }) => ({
	character: one(character, {
		fields: [characterAlias.characterId],
		references: [character.id],
	}),
}));

// -------------------------
// USER ROLE RELATIONS
// -------------------------

export const userRoleRelations = relations(userRole, ({ one }) => ({
	user: one(user, {
		fields: [userRole.userId],
		references: [user.id],
	}),
}));

// -------------------------
// USER BOOK RELATIONS
// -------------------------

export const userBookRelations = relations(userBook, ({ one }) => ({
	user: one(user, {
		fields: [userBook.userId],
		references: [user.id],
	}),
	book: one(book, {
		fields: [userBook.bookId],
		references: [book.id],
	}),
}));

// -------------------------
// NOTE RELATIONS
// -------------------------

export const noteRelations = relations(note, ({ one, many }) => ({
	user: one(user, {
		fields: [note.userId],
		references: [user.id],
	}),
	book: one(book, {
		fields: [note.bookId],
		references: [book.id],
	}),
	chapter: one(chapter, {
		fields: [note.chapterId],
		references: [chapter.id],
	}),
	comments: many(comment),
	reactions: many(reaction),
}));

// -------------------------
// VOCABULARY RELATIONS
// -------------------------

export const vocabularyRelations = relations(vocabulary, ({ one }) => ({
	user: one(user, {
		fields: [vocabulary.userId],
		references: [user.id],
	}),
	book: one(book, {
		fields: [vocabulary.bookId],
		references: [book.id],
	}),
	chapter: one(chapter, {
		fields: [vocabulary.chapterId],
		references: [chapter.id],
	}),
}));

// -------------------------
// REVIEW RELATIONS
// -------------------------

export const reviewRelations = relations(review, ({ one, many }) => ({
	user: one(user, {
		fields: [review.userId],
		references: [user.id],
	}),
	book: one(book, {
		fields: [review.bookId],
		references: [book.id],
	}),
	votes: many(reviewVote),
	comments: many(comment),
	reactions: many(reaction),
}));

export const reviewVoteRelations = relations(reviewVote, ({ one }) => ({
	review: one(review, {
		fields: [reviewVote.reviewId],
		references: [review.id],
	}),
	user: one(user, {
		fields: [reviewVote.userId],
		references: [user.id],
	}),
}));

// -------------------------
// COMMENT RELATIONS
// -------------------------

export const commentRelations = relations(comment, ({ one, many }) => ({
	user: one(user, {
		fields: [comment.userId],
		references: [user.id],
	}),
	book: one(book, {
		fields: [comment.bookId],
		references: [book.id],
	}),
	review: one(review, {
		fields: [comment.reviewId],
		references: [review.id],
	}),
	note: one(note, {
		fields: [comment.noteId],
		references: [note.id],
	}),
	parent: one(comment, {
		fields: [comment.parentId],
		references: [comment.id],
		relationName: "commentReplies",
	}),
	replies: many(comment, { relationName: "commentReplies" }),
	reactions: many(reaction),
}));

// -------------------------
// REACTION RELATIONS
// -------------------------

export const reactionRelations = relations(reaction, ({ one }) => ({
	user: one(user, {
		fields: [reaction.userId],
		references: [user.id],
	}),
	comment: one(comment, {
		fields: [reaction.commentId],
		references: [comment.id],
	}),
	review: one(review, {
		fields: [reaction.reviewId],
		references: [review.id],
	}),
	note: one(note, {
		fields: [reaction.noteId],
		references: [note.id],
	}),
}));
