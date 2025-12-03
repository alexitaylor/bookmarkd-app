"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface BookHeaderProps {
	book: Book;
	avgRating?: number;
	reviewCount?: number;
}

export function BookHeader({ book, avgRating, reviewCount }: BookHeaderProps) {
	return (
		<div className="flex flex-col gap-6 md:flex-row md:gap-8">
			{/* Cover Image */}
			<div className="shrink-0 mx-auto md:mx-0">
				<div className="relative aspect-[2/3] w-48 md:w-56 overflow-hidden rounded-lg bg-muted shadow-lg">
					{book.coverUrl ? (
						<Image
							src={book.coverUrl}
							alt={book.title}
							fill
							className="object-cover"
							sizes="(max-width: 768px) 192px, 224px"
							priority
						/>
					) : (
						<div className="flex h-full items-center justify-center bg-secondary">
							<BookOpen className="h-16 w-16 text-muted-foreground" />
						</div>
					)}
				</div>
			</div>

			{/* Book Info */}
			<div className="flex-1 space-y-4 text-center md:text-left">
				{/* Title & Subtitle */}
				<div>
					<h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">
						{book.title}
					</h1>
					{book.subtitle && (
						<p className="mt-1 text-lg text-muted-foreground">
							{book.subtitle}
						</p>
					)}
				</div>

				{/* Authors */}
				{book.authors.length > 0 && (
					<div className="flex flex-wrap items-center justify-center gap-1 md:justify-start">
						<span className="text-muted-foreground">by</span>
						{book.authors.map((author, index) => (
							<span key={author.id}>
								<span className="text-primary">
									{author.name}
								</span>
								{index < book.authors.length - 1 && ", "}
							</span>
						))}
					</div>
				)}

				{/* Rating */}
				{avgRating !== undefined && avgRating > 0 && (
					<div className="flex items-center justify-center gap-2 md:justify-start">
						<div className="flex items-center gap-1">
							<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
							<span className="font-semibold">{avgRating.toFixed(1)}</span>
						</div>
						{reviewCount !== undefined && reviewCount > 0 && (
							<span className="text-muted-foreground">
								({reviewCount.toLocaleString()} {reviewCount === 1 ? "review" : "reviews"})
							</span>
						)}
					</div>
				)}

				{/* Genres */}
				{book.genres.length > 0 && (
					<div className="flex flex-wrap gap-2 justify-center md:justify-start">
						{book.genres.map((genre) => (
							<Link key={genre.id} href={`/books?genre=${genre.id}`}>
								<Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
									{genre.name}
								</Badge>
							</Link>
						))}
					</div>
				)}

				{/* Metadata */}
				<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground md:justify-start">
					{book.pageCount && (
						<span>{book.pageCount} pages</span>
					)}
					{book.publisher && (
						<span>{book.publisher}</span>
					)}
					{book.datePublished && (
						<span>Published {book.datePublished}</span>
					)}
					{book.language && (
						<span className="uppercase">{book.language}</span>
					)}
				</div>

				{/* ISBN */}
				{(book.isbn || book.isbn13) && (
					<div className="text-xs text-muted-foreground">
						{book.isbn13 && <span>ISBN-13: {book.isbn13}</span>}
						{book.isbn13 && book.isbn && " | "}
						{book.isbn && <span>ISBN: {book.isbn}</span>}
					</div>
				)}
			</div>
		</div>
	);
}
