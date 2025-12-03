"use client";

import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getGenreColor } from "./color-utils";

interface Book {
	id: number;
	title: string;
	subtitle?: string | null;
	coverUrl?: string | null;
}

interface GenreChild {
	id: number;
	name: string;
}

interface GenreParent {
	id: number;
	name: string;
}

interface SelectedGenre {
	id: number;
	name: string;
	books: Book[];
	children?: GenreChild[];
	parent?: GenreParent | null;
}

interface GenreDetailProps {
	selectedGenreId: number | null;
	selectedGenre: SelectedGenre | null | undefined;
	isLoading: boolean;
	isMobileDetailOpen: boolean;
	onSelectGenre: (genreId: number) => void;
	onBackToList: () => void;
}

export function GenreDetail({
	selectedGenreId,
	selectedGenre,
	isLoading,
	isMobileDetailOpen,
	onSelectGenre,
	onBackToList,
}: GenreDetailProps) {
	return (
		<div
			className={cn(
				"flex flex-col overflow-hidden rounded-lg border bg-card",
				!isMobileDetailOpen && "hidden lg:flex",
			)}
		>
			{selectedGenreId === null ? (
				<EmptyState />
			) : isLoading ? (
				<LoadingSkeleton />
			) : selectedGenre ? (
				<>
					<GenreHeader
						selectedGenre={selectedGenre}
						onSelectGenre={onSelectGenre}
						onBackToList={onBackToList}
					/>
					<BooksGrid books={selectedGenre.books} />
					{selectedGenre.books.length > 0 && (
						<ViewAllCTA
							genreName={selectedGenre.name}
							genreId={selectedGenreId}
						/>
					)}
				</>
			) : null}
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center p-8 text-center">
			<BookOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
			<h3 className="font-medium text-lg text-muted-foreground">
				Select a genre
			</h3>
			<p className="mt-1 text-muted-foreground text-sm">
				Choose a genre from the list to see its books
			</p>
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<div className="space-y-4 p-6">
			<Skeleton className="h-8 w-48" />
			<Skeleton className="h-4 w-32" />
			<div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
					<div key={i} className="space-y-2">
						<Skeleton className="aspect-[2/3] w-full rounded-lg" />
						<Skeleton className="h-4 w-full" />
					</div>
				))}
			</div>
		</div>
	);
}

interface GenreHeaderProps {
	selectedGenre: SelectedGenre;
	onSelectGenre: (genreId: number) => void;
	onBackToList: () => void;
}

function GenreHeader({
	selectedGenre,
	onSelectGenre,
	onBackToList,
}: GenreHeaderProps) {
	return (
		<div className="border-b p-6">
			<div className="flex items-start gap-3">
				<Button
					variant="ghost"
					size="icon"
					className="mt-1 lg:hidden"
					onClick={onBackToList}
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					{/* H1 - Genre Name: 28px, semibold, high contrast */}
					<h2 className="font-semibold text-[28px] text-foreground leading-tight tracking-tight">
						{selectedGenre.name}
					</h2>
					{/* Meta line - Book count: 14px, muted, with spacing */}
					<p className="mt-1 mb-4 text-muted-foreground text-sm tracking-wide">
						{selectedGenre.books.length}{" "}
						{selectedGenre.books.length === 1 ? "book" : "books"} in this genre
					</p>
					{/* Back link - accent color with arrow */}
					{selectedGenre.parent && (
						<button
							type="button"
							onClick={() => onSelectGenre(selectedGenre.parent!.id)}
							className="flex items-center gap-1.5 text-[13px] text-primary hover:underline"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							Back to {selectedGenre.parent.name}
						</button>
					)}
				</div>
			</div>
			{/* Subgenres */}
			{selectedGenre.children && selectedGenre.children.length > 0 && (
				<div className="mt-4 flex flex-wrap gap-2">
					{selectedGenre.children.map((child) => {
						const style = getGenreColor(child.id);
						return (
							<button
								type="button"
								key={child.id}
								onClick={() => onSelectGenre(child.id)}
								className={cn(
									"inline-flex items-center rounded-full px-3 py-1 font-medium text-sm transition-all hover:scale-105",
									style.bg,
									style.text,
								)}
							>
								{child.name}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

interface BooksGridProps {
	books: Book[];
}

function BooksGrid({ books }: BooksGridProps) {
	return (
		<div className="min-h-0 flex-1 overflow-y-auto p-6">
			{books.length === 0 ? (
				<div className="flex h-full flex-col items-center justify-center text-center">
					<BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
					<p className="text-muted-foreground">No books in this genre yet</p>
					<Link
						href="/books"
						className="mt-2 text-primary text-sm hover:underline"
					>
						Browse all books
					</Link>
				</div>
			) : (
				<div className={cn("mx-auto max-w-4xl")}>
					<div
						className={cn(
							"grid gap-6",
							books.length <= 3
								? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
								: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
						)}
					>
						{books.map((book) => (
							<Link
								key={book.id}
								href={`/books/${book.id}`}
								className="group flex flex-col overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
							>
								<div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted shadow-sm">
									{book.coverUrl ? (
										<Image
											src={book.coverUrl}
											alt={book.title}
											fill
											className="object-cover transition-opacity group-hover:opacity-90"
											sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
										/>
									) : (
										<div className="flex h-full items-center justify-center bg-secondary">
											<BookOpen className="h-12 w-12 text-muted-foreground" />
										</div>
									)}
								</div>
								<div className="mt-3 space-y-1">
									<h3 className="line-clamp-2 font-medium leading-tight transition-colors group-hover:text-primary">
										{book.title}
									</h3>
									{book.subtitle && (
										<p className="line-clamp-1 text-muted-foreground text-sm">
											{book.subtitle}
										</p>
									)}
								</div>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

interface ViewAllCTAProps {
	genreName: string;
	genreId: number;
}

function ViewAllCTA({ genreName, genreId }: ViewAllCTAProps) {
	return (
		<div className="sticky bottom-0 border-t bg-card/80 p-4 backdrop-blur-md">
			<Link
				href={`/books?genre=${genreId}`}
				className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90"
			>
				View all {genreName} books
				<ChevronRight className="ml-1 h-4 w-4" />
			</Link>
		</div>
	);
}
