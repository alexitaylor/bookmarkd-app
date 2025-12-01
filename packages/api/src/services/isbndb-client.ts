import { z } from "zod";

// ISBNdb API response schemas
const isbndbAuthorSchema = z.string();

const isbndbBookSchema = z.object({
	title: z.string(),
	title_long: z.string().optional().nullable(),
	isbn: z.string().optional().nullable(),
	isbn13: z.string().optional().nullable(),
	dewey_decimal: z.union([z.string(), z.array(z.string())]).optional().nullable(),
	binding: z.string().optional().nullable(),
	publisher: z.string().optional().nullable(),
	language: z.string().optional().nullable(),
	date_published: z.string().optional().nullable(),
	edition: z.string().optional().nullable(),
	pages: z.number().optional().nullable(),
	dimensions: z.string().optional().nullable(),
	overview: z.string().optional().nullable(),
	image: z.string().optional().nullable(),
	msrp: z.number().optional().nullable(),
	excerpt: z.string().optional().nullable(),
	synopsys: z.string().optional().nullable(), // Note: ISBNdb uses "synopsys" (typo in their API)
	authors: z.array(isbndbAuthorSchema).optional().nullable(),
	subjects: z.array(z.string()).optional().nullable(),
	reviews: z.array(z.string()).optional().nullable(),
});

const isbndbBookResponseSchema = z.object({
	book: isbndbBookSchema,
});

const isbndbBooksSearchResponseSchema = z.object({
	total: z.number(),
	books: z.array(isbndbBookSchema),
});

export type ISBNdbBook = z.infer<typeof isbndbBookSchema>;

// Normalized book shape for our application
export interface NormalizedExternalBook {
	title: string;
	subtitle: string | null;
	isbn: string | null;
	isbn13: string | null;
	synopsis: string | null;
	coverUrl: string | null;
	publisher: string | null;
	pageCount: number | null;
	language: string | null;
	datePublished: string | null;
	authors: string[];
	genres: string[]; // Mapped from subjects
}

// Get API key from environment
function getApiKey(): string {
	const apiKey = process.env.ISBNDB_API_KEY;
	if (!apiKey) {
		throw new Error("ISBNDB_API_KEY environment variable is not set");
	}
	return apiKey;
}

// Normalize ISBNdb book to our internal format
export function normalizeISBNdbBook(book: ISBNdbBook): NormalizedExternalBook {
	// Extract subtitle from title_long if available
	let subtitle: string | null = null;
	if (book.title_long && book.title_long !== book.title) {
		// title_long often contains "Title: Subtitle" format
		const titleLong = book.title_long;
		if (titleLong.startsWith(book.title)) {
			const remainder = titleLong.slice(book.title.length).trim();
			if (remainder.startsWith(":") || remainder.startsWith("-")) {
				subtitle = remainder.slice(1).trim();
			} else if (remainder.length > 0) {
				subtitle = remainder;
			}
		} else {
			subtitle = titleLong;
		}
	}

	return {
		title: book.title,
		subtitle,
		isbn: book.isbn || null,
		isbn13: book.isbn13 || null,
		synopsis: book.synopsys || book.overview || null,
		coverUrl: book.image || null,
		publisher: book.publisher || null,
		pageCount: book.pages || null,
		language: book.language || null,
		datePublished: book.date_published || null,
		authors: book.authors?.filter(Boolean) || [],
		genres: book.subjects?.filter(Boolean) || [],
	};
}

// Fetch a single book by ISBN
export async function fetchBookByISBN(
	isbn: string
): Promise<NormalizedExternalBook | null> {
	const apiKey = getApiKey();
	const cleanIsbn = isbn.replace(/[-\s]/g, "");

	try {
		const response = await fetch(
			`https://api2.isbndb.com/book/${encodeURIComponent(cleanIsbn)}`,
			{
				headers: {
					Authorization: apiKey,
					"Content-Type": "application/json",
				},
			}
		);

		if (response.status === 404) {
			return null;
		}

		if (response.status === 429) {
			throw new Error("ISBNdb rate limit exceeded. Please try again later.");
		}

		if (!response.ok) {
			throw new Error(`ISBNdb API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = isbndbBookResponseSchema.safeParse(data);

		if (!parsed.success) {
			console.error("Failed to parse ISBNdb response:", parsed.error);
			return null;
		}

		return normalizeISBNdbBook(parsed.data.book);
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to fetch book from ISBNdb");
	}
}

// Search for books by query
export async function searchBooksFromISBNdb(
	query: string,
	limit: number = 20
): Promise<NormalizedExternalBook[]> {
	const apiKey = getApiKey();
	const cleanQuery = query.trim();

	if (!cleanQuery) {
		return [];
	}

	try {
		const response = await fetch(
			`https://api2.isbndb.com/books/${encodeURIComponent(cleanQuery)}?page=1&pageSize=${limit}`,
			{
				headers: {
					Authorization: apiKey,
					"Content-Type": "application/json",
				},
			}
		);

		if (response.status === 404) {
			return [];
		}

		if (response.status === 429) {
			throw new Error("ISBNdb rate limit exceeded. Please try again later.");
		}

		if (!response.ok) {
			throw new Error(`ISBNdb API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = isbndbBooksSearchResponseSchema.safeParse(data);

		if (!parsed.success) {
			console.error("Failed to parse ISBNdb search response:", parsed.error);
			return [];
		}

		return parsed.data.books.map(normalizeISBNdbBook);
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to search books from ISBNdb");
	}
}
