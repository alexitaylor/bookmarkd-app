"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";
import { BookDetailContent } from "./book-detail-content";

export default function BookDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const bookId = Number.parseInt(id, 10);

	const {
		data: book,
		isLoading,
		error,
	} = useQuery(orpc.book.getById.queryOptions({ input: { id: bookId } }));

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-6xl px-4 py-8">
				<div className="flex flex-col gap-6 md:flex-row md:gap-8">
					<Skeleton className="mx-auto aspect-[2/3] w-48 rounded-lg md:mx-0 md:w-56" />
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
				<div className="py-12 text-center">
					<h1 className="font-bold text-2xl">Book Not Found</h1>
					<p className="mt-2 text-muted-foreground">
						The book you're looking for doesn't exist or has been removed.
					</p>
				</div>
			</div>
		);
	}

	return <BookDetailContent book={book} />;
}
