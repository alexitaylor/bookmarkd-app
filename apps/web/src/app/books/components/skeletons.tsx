"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function BookCardSkeleton() {
	return (
		<div className="flex flex-col rounded-lg border bg-card p-3">
			<Skeleton className="mb-3 aspect-[2/3] w-full rounded-md" />
			<Skeleton className="mb-2 h-4 w-full" />
			<Skeleton className="mb-2 h-3 w-2/3" />
			<Skeleton className="h-3 w-1/3" />
		</div>
	);
}

export function BookListSkeleton() {
	return (
		<div className="flex gap-4 rounded-lg border bg-card p-4">
			<Skeleton className="h-24 w-16 shrink-0 rounded-md sm:h-32 sm:w-20" />
			<div className="flex flex-1 flex-col justify-between">
				<div>
					<Skeleton className="mb-2 h-5 w-3/4" />
					<Skeleton className="mb-2 h-4 w-1/2" />
					<Skeleton className="h-4 w-1/3" />
				</div>
				<Skeleton className="h-8 w-24" />
			</div>
		</div>
	);
}
