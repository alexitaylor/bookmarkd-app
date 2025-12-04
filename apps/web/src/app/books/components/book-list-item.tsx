"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookStatusDropdown } from "@/components/book-status-dropdown";
import { HtmlContent } from "@/components/ui/html-content";
import type { BookItemProps } from "../types";

export function BookListItem({
	id,
	title,
	coverUrl,
	authors,
	avgRating,
	reviewCount,
	addCount,
	pageCount,
	publisher,
	datePublished,
	synopsis,
	userStatus,
	isLoggedIn,
}: BookItemProps) {
	// Format publication year from datePublished
	const pubYear = datePublished ? new Date(datePublished).getFullYear() : null;

	return (
		<div className="group flex gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-md">
			{/* Cover */}
			<Link href={`/books/${id}` as "/"} className="shrink-0">
				<div className="relative h-28 w-[72px] overflow-hidden rounded-md bg-muted sm:h-36 sm:w-24">
					{coverUrl ? (
						<Image
							src={coverUrl}
							alt={title}
							fill
							className="object-cover transition-transform group-hover:scale-105"
							sizes="96px"
						/>
					) : (
						<div className="flex h-full items-center justify-center p-1 text-center text-muted-foreground text-xs">
							No cover
						</div>
					)}
				</div>
			</Link>

			{/* Info */}
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex-1">
					<Link href={`/books/${id}` as "/"}>
						<h3 className="line-clamp-1 font-medium transition-colors group-hover:text-primary sm:text-lg">
							{title}
						</h3>
					</Link>
					{authors.length > 0 && (
						<p className="mt-0.5 truncate text-muted-foreground text-sm">
							by {authors.map((a) => a.name).join(", ")}
						</p>
					)}

					{/* Meta info row */}
					<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
						{pubYear && <span>{pubYear}</span>}
						{publisher && (
							<span className="max-w-[150px] truncate">{publisher}</span>
						)}
						{pageCount && <span>{pageCount} pages</span>}
					</div>

					{/* Rating and stats row */}
					<div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
						<div className="flex items-center gap-1">
							<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
							<span className="font-medium">
								{avgRating > 0 ? avgRating.toFixed(1) : "—"}
							</span>
							{reviewCount > 0 && (
								<span className="text-muted-foreground">({reviewCount})</span>
							)}
						</div>
						{addCount > 0 && (
							<span className="text-muted-foreground">
								{addCount} {addCount === 1 ? "reader" : "readers"}
							</span>
						)}
					</div>

					{/* Synopsis */}
					{synopsis && (
						<HtmlContent
							content={synopsis}
							lineClamp={2}
							className="mt-2 text-muted-foreground text-sm"
						/>
					)}
				</div>

				{/* Reading Status Dropdown */}
				{isLoggedIn && (
					<div className="mt-2">
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
