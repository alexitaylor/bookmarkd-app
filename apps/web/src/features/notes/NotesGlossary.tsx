"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";
import { AddNoteDialog } from "./AddNoteDialog";
import { NoteDetail, NoteDetailEmpty } from "./NoteDetail";
import { NoteList } from "./NoteList";

interface Note {
	id: number;
	bookId: number;
	content: string;
	pageNumber: number | null;
	createdAt: Date;
}

interface NotesGlossaryProps {
	bookId: number;
}

export function NotesGlossary({ bookId }: NotesGlossaryProps) {
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

	const {
		data: notes,
		isLoading,
		error,
	} = useQuery(orpc.note.list.queryOptions({ input: { bookId, limit: 100 } }));

	// Auto-select first note when loaded
	useEffect(() => {
		if (notes && notes.length > 0 && selectedId === null) {
			setSelectedId(notes[0].id);
		}
	}, [notes, selectedId]);

	// Clear selection if selected note is deleted
	useEffect(() => {
		if (selectedId && notes && !notes.find((n) => n.id === selectedId)) {
			setSelectedId(notes.length > 0 ? notes[0].id : null);
			setIsMobileDetailOpen(false);
		}
	}, [notes, selectedId]);

	const selectedNote = notes?.find((n) => n.id === selectedId) || null;

	const handleSelect = (id: number) => {
		setSelectedId(id);
		setIsMobileDetailOpen(true);
	};

	const handleBack = () => {
		setIsMobileDetailOpen(false);
	};

	// Handle unauthenticated users
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border py-12 text-center">
				<FileText className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-semibold text-lg">Sign in to Add Notes</h3>
				<p className="mt-1 text-muted-foreground">
					Notes are private and require you to be signed in.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="grid h-[600px] overflow-hidden rounded-lg border md:grid-cols-[300px_1fr]">
				<div className="space-y-3 border-r p-3">
					<Skeleton className="h-10 w-full" />
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-16 w-full" />
					))}
				</div>
				<div className="hidden space-y-4 p-6 md:block">
					<Skeleton className="h-12 w-12 rounded-full" />
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</div>
			</div>
		);
	}

	if (!notes || notes.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border py-12 text-center">
				<FileText className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-semibold text-lg">No Notes Yet</h3>
				<p className="mt-1 mb-4 text-muted-foreground">
					Start adding notes to keep track of your thoughts.
				</p>
				<Button onClick={() => setIsAddOpen(true)}>Add Note</Button>
				<AddNoteDialog
					bookId={bookId}
					open={isAddOpen}
					onOpenChange={setIsAddOpen}
				/>
			</div>
		);
	}

	return (
		<>
			<div className="grid h-[600px] overflow-hidden rounded-lg border md:grid-cols-[300px_1fr]">
				{/* Left Panel - Note List */}
				<div
					className={`min-h-0 border-r bg-background ${
						isMobileDetailOpen ? "hidden md:flex md:flex-col" : "flex flex-col"
					}`}
				>
					<NoteList
						notes={notes}
						selectedId={selectedId}
						onSelect={handleSelect}
						onAddNote={() => setIsAddOpen(true)}
					/>
				</div>

				{/* Right Panel - Note Detail */}
				<div
					className={`bg-background ${
						isMobileDetailOpen ? "flex flex-col" : "hidden md:flex md:flex-col"
					}`}
				>
					{selectedNote ? (
						<NoteDetail
							note={selectedNote}
							onBack={handleBack}
							showBackButton={isMobileDetailOpen}
						/>
					) : (
						<NoteDetailEmpty />
					)}
				</div>
			</div>

			{/* Add Note Dialog */}
			<AddNoteDialog
				bookId={bookId}
				open={isAddOpen}
				onOpenChange={setIsAddOpen}
			/>
		</>
	);
}
