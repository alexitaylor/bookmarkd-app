"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";

interface BookCardProps {
	id: number;
	title: string;
	coverUrl?: string | null;
	authors?: { id: number; name: string }[];
	avgRating?: number;
	size?: "default" | "sm";
	className?: string;
}

export function BookCard({
	id,
	title,
	coverUrl,
	authors,
	avgRating,
	size = "default",
	className,
}: BookCardProps) {
	const isSmall = size === "sm";

	return (
		<Link
			href={`/books/${id}`}
			className={cn(
				"group flex flex-col rounded-lg overflow-hidden transition-transform hover:scale-[1.02]",
				className,
			)}
		>
			<div className={cn(
				"relative w-full overflow-hidden rounded-lg bg-muted",
				isSmall ? "aspect-[3/4]" : "aspect-[2/3]"
			)}>
				{coverUrl ? (
					<Image
						src={coverUrl}
						alt={title}
						fill
						className="object-cover transition-opacity group-hover:opacity-90"
						sizes={isSmall ? "120px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"}
					/>
				) : (
					<div className="flex h-full items-center justify-center bg-secondary">
						<BookOpen className={cn(isSmall ? "h-8 w-8" : "h-12 w-12", "text-muted-foreground")} />
					</div>
				)}
			</div>
			<div className={cn("mt-2 space-y-1", isSmall && "mt-1.5")}>
				<h3 className={cn(
					"font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors",
					isSmall && "text-sm"
				)}>
					{title}
				</h3>
				{authors && authors.length > 0 && (
					<p className={cn(
						"text-muted-foreground line-clamp-1",
						isSmall ? "text-xs" : "text-sm"
					)}>
						{authors.map((a) => a.name).join(", ")}
					</p>
				)}
				{avgRating !== undefined && Number(avgRating) > 0 && (
					<div className="flex items-center gap-1">
						<span className={cn("text-yellow-500", isSmall && "text-sm")}>★</span>
						<span className={cn("text-muted-foreground", isSmall ? "text-xs" : "text-sm")}>
							{Number(avgRating).toFixed(1)}
						</span>
					</div>
				)}
			</div>
		</Link>
	);
}

interface BookCardCompactProps {
	id: number;
	bookId: number;
	title: string;
	coverUrl?: string | null;
	progress: number;
	currentPage: number;
	pageCount?: number | null;
	onUpdateProgress?: (bookId: number) => void;
	className?: string;
}

export function BookCardCompact({
	bookId,
	title,
	coverUrl,
	progress,
	currentPage,
	pageCount,
	onUpdateProgress,
	className,
}: BookCardCompactProps) {
	return (
		<div className={cn("group flex flex-col w-32 shrink-0 h-full", className)}>
			<Link
				href={`/books/${bookId}`}
				className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02]"
			>
				{coverUrl ? (
					<Image
						src={coverUrl}
						alt={title}
						fill
						className="object-cover transition-opacity group-hover:opacity-90"
						sizes="128px"
					/>
				) : (
					<div className="flex h-full items-center justify-center bg-secondary">
						<BookOpen className="h-8 w-8 text-muted-foreground" />
					</div>
				)}
			</Link>
			<div className="mt-2 flex flex-col">
				<div className="h-10 overflow-hidden">
					<h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors" title={title}>
						{title}
					</h3>
				</div>
				<div className="mt-1 space-y-1">
					<Progress value={progress} />
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">{progress}%</span>
						{onUpdateProgress && (
							<button
								onClick={() => onUpdateProgress(bookId)}
								className="text-xs text-primary hover:underline"
							>
								Update
							</button>
						)}
					</div>
					<p className="text-xs text-muted-foreground">
						{currentPage} / {pageCount ?? "?"} pages
					</p>
				</div>
			</div>
		</div>
	);
}
