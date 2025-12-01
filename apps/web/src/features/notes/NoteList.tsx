"use client";

import { useState, useMemo } from "react";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
		<div className="flex flex-col h-full min-h-0">
			{/* Search Input */}
			<div className="p-3 border-b">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search notes..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 pr-9"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			{/* Note List */}
			<div className="flex-1 min-h-0 overflow-y-auto p-2">
				{filteredNotes.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
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
			<div className="p-3 border-t">
				<Button onClick={onAddNote} className="w-full">
					<Plus className="h-4 w-4 mr-2" />
					Add Note
				</Button>
			</div>
		</div>
	);
}
