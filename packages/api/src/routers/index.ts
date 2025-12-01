import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { todoRouter } from "./todo";
import { bookRouter } from "./book";
import { authorRouter } from "./author";
import { genreRouter } from "./genre";
import { characterRouter } from "./character";
import { noteRouter } from "./note";
import { vocabularyRouter } from "./vocabulary";
import { userBookRouter } from "./userBook";
import { reviewRouter } from "./review";

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
