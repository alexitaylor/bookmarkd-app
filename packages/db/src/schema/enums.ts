import { pgEnum } from "drizzle-orm/pg-core";

// User role enum
export const roleEnum = pgEnum("role", ["ADMIN", "MODERATOR", "USER"]);

// Book reading status enum
export const bookStatusEnum = pgEnum("book_status", [
	"WantToRead",
	"CurrentlyReading",
	"Read",
	"DNF",
	"None",
]);

// Reaction type enum (for social features)
export const reactionEnum = pgEnum("reaction_type", [
	"Like",
	"Love",
	"Laugh",
	"Surprised",
	"Sad",
	"Angry",
]);
