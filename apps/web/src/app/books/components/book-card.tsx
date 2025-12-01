"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookStatusDropdown } from "@/components/book-status-dropdown";
import type { BookItemProps } from "../types";

export function BookCard({
	id,
	title,
	coverUrl,
	authors,
	avgRating,
	reviewCount,
	addCount,
	pageCount,
	userStatus,
	isLoggedIn,
}: BookItemProps) {
	return (
		<div className="group flex flex-col rounded-lg border bg-card p-3 transition-all hover:border-primary/20 hover:shadow-md">
			{/* Cover - wrapped in Link */}
			<Link href={`/books/${id}` as "/"}>
				<div className="relative mb-3 aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
					{coverUrl ? (
						<Image
							src={coverUrl}
							alt={title}
							fill
							className="object-cover transition-transform group-hover:scale-105"
							sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
						/>
					) : (
						<div className="flex h-full items-center justify-center p-2 text-center text-muted-foreground text-sm">
							No cover
						</div>
					)}
				</div>
			</Link>

			{/* Info - use flex column to push dropdown to bottom */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Top content */}
				<div className="flex-1">
					<Link href={`/books/${id}` as "/"}>
						<h3 className="line-clamp-2 font-medium text-sm transition-colors group-hover:text-primary">
							{title}
						</h3>
					</Link>
					{authors.length > 0 && (
						<p className="mt-1 truncate text-muted-foreground text-xs">
							{authors.map((a) => a.name).join(", ")}
						</p>
					)}

					{/* Rating */}
					<div className="mt-2 flex items-center gap-1">
						<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
						<span className="font-medium text-xs">
							{avgRating > 0 ? avgRating.toFixed(1) : "—"}
						</span>
						{reviewCount > 0 && (
							<span className="text-muted-foreground text-xs">
								({reviewCount})
							</span>
						)}
					</div>

					{/* Add count */}
					{addCount > 0 && (
						<p className="mt-1 text-muted-foreground text-xs">
							{addCount} {addCount === 1 ? "reader" : "readers"}
						</p>
					)}
				</div>

				{/* Reading Status Dropdown - only for logged in users, always at bottom */}
				{isLoggedIn && (
					<div className="mt-auto pt-2">
						<BookStatusDropdown
							bookId={id}
							pageCount={pageCount}
							currentStatus={userStatus}
							compact
						/>
					</div>
				)}
			</div>
		</div>
	);
}
