"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { BookCard } from "@/components/book-card";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedBooksProps {
	bookId: number;
}

export function RelatedBooks({ bookId }: RelatedBooksProps) {
	const { data: relatedBooks, isLoading } = useQuery(
		orpc.book.getRelated.queryOptions({ input: { bookId, limit: 6 } })
	);

	if (isLoading) {
		return (
			<section>
				<h2 className="text-xl font-semibold mb-4">Related Books</h2>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-[2/3] w-full rounded-lg" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-3 w-2/3" />
						</div>
					))}
				</div>
			</section>
		);
	}

	if (!relatedBooks || relatedBooks.length === 0) {
		return null;
	}

	return (
		<section>
			<h2 className="text-xl font-semibold mb-4">Related Books</h2>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
				{relatedBooks.map((book) => (
					<BookCard
						key={book.id}
						id={book.id}
						title={book.title}
						coverUrl={book.coverUrl}
						authors={book.authors}
					/>
				))}
			</div>
		</section>
	);
}
