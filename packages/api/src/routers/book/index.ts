import { bookCrudRouter } from "./crud";
import { bookDiscoveryRouter } from "./discovery";
import { bookRecommendationsRouter } from "./recommendations";
import { bookSearchRouter } from "./search";

// Combine all book routers into a single router
export const bookRouter = {
	// CRUD operations
	getById: bookCrudRouter.getById,
	create: bookCrudRouter.create,
	update: bookCrudRouter.update,
	delete: bookCrudRouter.delete,

	// Search operations
	search: bookSearchRouter.search,
	addFromISBN: bookSearchRouter.addFromISBN,
	searchExternal: bookSearchRouter.searchExternal,

	// Discovery operations
	getPopular: bookDiscoveryRouter.getPopular,
	getRecent: bookDiscoveryRouter.getRecent,
	getAll: bookDiscoveryRouter.getAll,
	getByRating: bookDiscoveryRouter.getByRating,

	// Recommendation operations
	getRelated: bookRecommendationsRouter.getRelated,
	getRecommendations: bookRecommendationsRouter.getRecommendations,
};
