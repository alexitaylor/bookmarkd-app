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
		note.content.length > 60
			? note.content.slice(0, 60) + "..."
			: note.content;

	const formattedDate = new Date(note.createdAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});

	return (
		<button
			onClick={onClick}
			className={cn(
				"w-full flex items-start gap-3 p-3 text-left transition-colors rounded-md",
				"hover:bg-accent/50",
				isSelected && "bg-accent border-l-2 border-primary"
			)}
		>
			<div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
				<FileText className="h-5 w-5 text-muted-foreground" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
					<span>{formattedDate}</span>
					{note.pageNumber && <span>· Page {note.pageNumber}</span>}
				</div>
				<p className="text-sm truncate">{truncatedContent}</p>
			</div>
		</button>
	);
}
