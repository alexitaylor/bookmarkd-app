import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { authorRouter } from "./author";
import { bookRouter } from "./book";
import { characterRouter } from "./character";
import { genreRouter } from "./genre";
import { noteRouter } from "./note";
import { reviewRouter } from "./review";
import { todoRouter } from "./todo";
import { userBookRouter } from "./user-book";
import { vocabularyRouter } from "./vocabulary";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	todo: todoRouter,
	book: bookRouter,
	author: authorRouter,
	genre: genreRouter,
	character: characterRouter,
	note: noteRouter,
	vocabulary: vocabularyRouter,
	userBook: userBookRouter,
	review: reviewRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
