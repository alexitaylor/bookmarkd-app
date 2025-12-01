"use client";

import { VocabularyGlossary } from "@/features/vocabulary";

interface VocabularyTabProps {
	bookId: number;
}

export function VocabularyTab({ bookId }: VocabularyTabProps) {
	return <VocabularyGlossary bookId={bookId} />;
}
