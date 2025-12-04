import { userBookGoalsRouter } from "./goals";
import { userBookShelvesRouter } from "./shelves";
import { userBookStatsRouter } from "./stats";
import { userBookStatusRouter } from "./status";

// Combine all user book routers into a single router
export const userBookRouter = {
	// Shelf operations
	getShelfCounts: userBookShelvesRouter.getShelfCounts,
	getShelfBooks: userBookShelvesRouter.getShelfBooks,
	getShelves: userBookShelvesRouter.getShelves,

	// Status operations
	getByBookId: userBookStatusRouter.getByBookId,
	getStatusForBooks: userBookStatusRouter.getStatusForBooks,
	updateStatus: userBookStatusRouter.updateStatus,
	updateProgress: userBookStatusRouter.updateProgress,
	updateRating: userBookStatusRouter.updateRating,
	remove: userBookStatusRouter.remove,

	// Stats operations
	getStats: userBookStatsRouter.getStats,
	getCurrentlyReading: userBookStatsRouter.getCurrentlyReading,

	// Goal operations
	getReadingGoal: userBookGoalsRouter.getReadingGoal,
	setReadingGoal: userBookGoalsRouter.setReadingGoal,
	getReadingCalendar: userBookGoalsRouter.getReadingCalendar,
};
