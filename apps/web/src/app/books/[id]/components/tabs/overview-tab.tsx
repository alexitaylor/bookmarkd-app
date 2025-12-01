"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Users, FileText, BookText, Star, ChevronRight } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RelatedBooks } from "./related-books";

interface Author {
	id: number;
	name: string;
}

interface Genre {
	id: number;
	name: string;
}

interface Book {
	id: number;
	title: string;
	subtitle?: string | null;
	synopsis?: string | null;
	coverUrl?: string | null;
	pageCount?: number | null;
	publisher?: string | null;
	language?: string | null;
	datePublished?: string | null;
	isbn?: string | null;
	isbn13?: string | null;
	authors: Author[];
	genres: Genre[];
}

interface OverviewTabProps {
	bookId: number;
	book: Book;
}

export function OverviewTab({ bookId, book }: OverviewTabProps) {
	// Fetch characters preview
	const { data: characters, isLoading: isLoadingCharacters } = useQuery(
		orpc.character.getByBookId.queryOptions({ input: { bookId, limit: 5 } })
	);

	// Fetch reviews preview
	const { data: reviews, isLoading: isLoadingReviews } = useQuery(
		orpc.review.list.queryOptions({ input: { bookId, limit: 3 } })
	);

	// Fetch review stats
	const { data: reviewStats } = useQuery(
		orpc.review.getStats.queryOptions({ input: { bookId } })
	);

	return (
		<div className="space-y-8">
			{/* Synopsis */}
			{book.synopsis && (
				<section>
					<h2 className="text-xl font-semibold mb-3">Synopsis</h2>
					<p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
						{book.synopsis}
					</p>
				</section>
			)}

			{/* Preview Sections Grid */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Characters Preview */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<Users className="h-4 w-4" />
							Characters
						</CardTitle>
						{characters && characters.length > 0 && (
							<Link
								href="#"
								onClick={(e) => {
									e.preventDefault();
									document
										.querySelector('[value="characters"]')
										?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
								}}
								className="text-sm text-primary hover:underline flex items-center"
							>
								View all
								<ChevronRight className="h-4 w-4" />
							</Link>
						)}
					</CardHeader>
					<CardContent>
						{isLoadingCharacters ? (
							<div className="space-y-2">
								{Array.from({ length: 3 }).map((_, i) => (
									<Skeleton key={i} className="h-8 w-full" />
								))}
							</div>
						) : characters && characters.length > 0 ? (
							<ul className="space-y-2">
								{characters.slice(0, 5).map((character) => (
									<li
										key={character.id}
										className="flex items-center justify-between py-1"
									>
										<span className="font-medium">{character.name}</span>
										{character.description && (
											<span className="text-sm text-muted-foreground truncate max-w-[60%]">
												{character.description}
											</span>
										)}
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-muted-foreground">
								No characters added yet.
							</p>
						)}
					</CardContent>
				</Card>

				{/* Reviews Preview */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<Star className="h-4 w-4" />
							Reviews
							{reviewStats && reviewStats.count > 0 && (
								<span className="text-muted-foreground font-normal">
									({reviewStats.avgRating.toFixed(1)} avg)
								</span>
							)}
						</CardTitle>
						{reviews && reviews.length > 0 && (
							<Link
								href="#"
								onClick={(e) => {
									e.preventDefault();
									document
										.querySelector('[value="reviews"]')
										?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
								}}
								className="text-sm text-primary hover:underline flex items-center"
							>
								View all
								<ChevronRight className="h-4 w-4" />
							</Link>
						)}
					</CardHeader>
					<CardContent>
						{isLoadingReviews ? (
							<div className="space-y-3">
								{Array.from({ length: 2 }).map((_, i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-12 w-full" />
									</div>
								))}
							</div>
						) : reviews && reviews.length > 0 ? (
							<div className="space-y-4">
								{reviews.slice(0, 2).map((review) => (
									<div key={review.id} className="space-y-1">
										<div className="flex items-center gap-2">
											<div className="flex items-center">
												{Array.from({ length: 5 }).map((_, i) => (
													<Star
														key={i}
														className={`h-3 w-3 ${
															i < review.rating
																? "fill-yellow-400 text-yellow-400"
																: "text-muted-foreground"
														}`}
													/>
												))}
											</div>
											<span className="text-sm text-muted-foreground">
												by {review.userName}
											</span>
										</div>
										{review.content && (
											<p className="text-sm text-muted-foreground line-clamp-2">
												{review.content}
											</p>
										)}
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No reviews yet. Be the first to review!
							</p>
						)}
					</CardContent>
				</Card>

				{/* Notes Preview - placeholder for authenticated users */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Your Notes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Keep track of your thoughts while reading. Click the Notes tab to add notes.
						</p>
					</CardContent>
				</Card>

				{/* Vocabulary Preview - placeholder for authenticated users */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-base font-semibold flex items-center gap-2">
							<BookText className="h-4 w-4" />
							Your Vocabulary
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Save new words you encounter. Click the Vocabulary tab to add words.
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Related Books */}
			<RelatedBooks bookId={bookId} />
		</div>
	);
}
