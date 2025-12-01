"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { useParams } from "next/navigation";
import { BookDetailContent } from "./book-detail-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const bookId = Number.parseInt(id, 10);

	const { data: book, isLoading, error } = useQuery(
		orpc.book.getById.queryOptions({ input: { id: bookId } })
	);

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<div className="flex flex-col gap-6 md:flex-row md:gap-8">
					<Skeleton className="aspect-[2/3] w-48 md:w-56 rounded-lg mx-auto md:mx-0" />
					<div className="flex-1 space-y-4">
						<Skeleton className="h-10 w-3/4" />
						<Skeleton className="h-6 w-1/2" />
						<Skeleton className="h-4 w-1/3" />
						<div className="flex gap-2">
							<Skeleton className="h-6 w-20 rounded-full" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error || !book) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<div className="text-center py-12">
					<h1 className="text-2xl font-bold">Book Not Found</h1>
					<p className="text-muted-foreground mt-2">
						The book you're looking for doesn't exist or has been removed.
					</p>
				</div>
			</div>
		);
	}

	return <BookDetailContent book={book} />;
}
