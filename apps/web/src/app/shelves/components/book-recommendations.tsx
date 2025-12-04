"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export function BookRecommendations() {
	const { data, isLoading } = useQuery(
		orpc.book.getRecommendations.queryOptions({ input: { limit: 6 } }),
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 font-semibold text-base">
						<Sparkles className="h-4 w-4" />
						Recommended for You
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<div key={i} className="flex gap-3">
								<Skeleton className="h-20 w-14 flex-shrink-0 rounded" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
									<Skeleton className="h-3 w-full" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	const recommendations = data?.recommendations || [];
	const basedOn = data?.basedOn;

	if (recommendations.length === 0) {
		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 font-semibold text-base">
						<Sparkles className="h-4 w-4" />
						Recommended for You
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Start reading and rating books to get personalized recommendations!
					</p>
					<Button asChild variant="outline" size="sm" className="mt-3">
						<Link href="/books">
							Browse Books
							<ChevronRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
				<div>
					<CardTitle className="flex items-center gap-2 font-semibold text-base">
						<Sparkles className="h-4 w-4 text-yellow-500" />
						Recommended for You
					</CardTitle>
					{basedOn &&
						(basedOn.genres.length > 0 || basedOn.authors.length > 0) && (
							<p className="mt-1 text-muted-foreground text-xs">
								Based on your love of{" "}
								{basedOn.genres.length > 0 &&
									basedOn.genres.slice(0, 2).join(", ")}
								{basedOn.genres.length > 0 &&
									basedOn.authors.length > 0 &&
									" and "}
								{basedOn.authors.length > 0 &&
									basedOn.authors.slice(0, 2).join(", ")}
							</p>
						)}
				</div>
				<Button asChild variant="ghost" size="sm">
					<Link href="/books">
						Browse All
						<ChevronRight className="ml-1 h-4 w-4" />
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{recommendations.map((book) => (
						<Link
							key={book.id}
							href={`/books/${book.id}`}
							className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
						>
							{/* Book Cover */}
							<div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-muted shadow-sm">
								{book.coverUrl ? (
									<Image
										src={book.coverUrl}
										alt={book.title}
										fill
										className="object-cover transition-opacity group-hover:opacity-90"
										sizes="56px"
									/>
								) : (
									<div className="flex h-full items-center justify-center bg-secondary">
										<BookOpen className="h-5 w-5 text-muted-foreground" />
									</div>
								)}
							</div>

							{/* Book Info */}
							<div className="min-w-0 flex-1">
								<h4 className="line-clamp-2 font-medium text-sm leading-tight transition-colors group-hover:text-primary">
									{book.title}
								</h4>
								{book.authors.length > 0 && (
									<p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
										{book.authors.join(", ")}
									</p>
								)}

								{/* Rating */}
								{book.avgRating > 0 && (
									<div className="mt-1 flex items-center gap-1">
										<div className="flex items-center">
											{Array.from({ length: 5 }).map((_, i) => (
												<Star
													// biome-ignore lint/suspicious/noArrayIndexKey: static display
													key={i}
													className={cn(
														"h-2.5 w-2.5",
														i < Math.round(book.avgRating)
															? "fill-yellow-400 text-yellow-400"
															: "text-muted-foreground/30",
													)}
												/>
											))}
										</div>
										<span className="text-muted-foreground text-xs">
											({book.avgRating.toFixed(1)})
										</span>
									</div>
								)}

								{/* Reason */}
								<Badge variant="secondary" className="mt-1.5 text-[10px]">
									{book.reason}
								</Badge>
							</div>
						</Link>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
