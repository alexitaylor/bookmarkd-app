"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteListItem } from "./NoteListItem";

interface Note {
	id: number;
	bookId: number;
	content: string;
	pageNumber: number | null;
	createdAt: Date;
}

interface NoteListProps {
	notes: Note[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	onAddNote: () => void;
}

export function NoteList({
	notes,
	selectedId,
	onSelect,
	onAddNote,
}: NoteListProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredNotes = useMemo(() => {
		if (!searchQuery.trim()) return notes;

		const query = searchQuery.toLowerCase();
		return notes.filter((n) => n.content.toLowerCase().includes(query));
	}, [notes, searchQuery]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			{/* Search Input */}
			<div className="border-b p-3">
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search notes..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pr-9 pl-9"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			{/* Note List */}
			<div className="min-h-0 flex-1 overflow-y-auto p-2">
				{filteredNotes.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						{searchQuery ? "No notes found" : "No notes yet"}
					</div>
				) : (
					<div className="space-y-1">
						{filteredNotes.map((note) => (
							<NoteListItem
								key={note.id}
								note={note}
								isSelected={selectedId === note.id}
								onClick={() => onSelect(note.id)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Add Note Button */}
			<div className="border-t p-3">
				<Button onClick={onAddNote} className="w-full">
					<Plus className="mr-2 h-4 w-4" />
					Add Note
				</Button>
			</div>
		</div>
	);
}
