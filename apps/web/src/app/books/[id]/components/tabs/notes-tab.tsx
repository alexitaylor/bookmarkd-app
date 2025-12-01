"use client";

import { NotesGlossary } from "@/features/notes";

interface NotesTabProps {
	bookId: number;
}

export function NotesTab({ bookId }: NotesTabProps) {
	return <NotesGlossary bookId={bookId} />;
}
