"use client";

import { CharacterGlossary } from "@/features/characters";

interface CharactersTabProps {
	bookId: number;
}

export function CharactersTab({ bookId }: CharactersTabProps) {
	return <CharacterGlossary bookId={bookId} />;
}
