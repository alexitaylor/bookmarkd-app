"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
	id: number;
	bookId: number;
	content: string;
	pageNumber: number | null;
	createdAt: Date;
}

interface NoteListItemProps {
	note: Note;
	isSelected: boolean;
	onClick: () => void;
}

export function NoteListItem({ note, isSelected, onClick }: NoteListItemProps) {
	// Truncate content to ~60 chars
	const truncatedContent =
		note.content.length > 60 ? note.content.slice(0, 60) + "..." : note.content;

	const formattedDate = new Date(note.createdAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});

	return (
		<button
			onClick={onClick}
			className={cn(
				"flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors",
				"hover:bg-accent/50",
				isSelected && "border-primary border-l-2 bg-accent",
			)}
		>
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
				<FileText className="h-5 w-5 text-muted-foreground" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="mb-1 flex items-center gap-2 text-muted-foreground text-xs">
					<span>{formattedDate}</span>
					{note.pageNumber && <span>· Page {note.pageNumber}</span>}
				</div>
				<p className="truncate text-sm">{truncatedContent}</p>
			</div>
		</button>
	);
}
