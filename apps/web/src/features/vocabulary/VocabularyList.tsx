"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VocabularyListItem } from "./VocabularyListItem";

interface VocabularyWord {
	id: number;
	bookId: number;
	word: string;
	definition: string | null;
	contextSentence: string | null;
	pageNumber: number | null;
	learned: boolean;
}

interface VocabularyListProps {
	words: VocabularyWord[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	onAddWord: () => void;
	learnedCount: number;
	totalCount: number;
}

export function VocabularyList({
	words,
	selectedId,
	onSelect,
	onAddWord,
	learnedCount,
	totalCount,
}: VocabularyListProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredWords = useMemo(() => {
		if (!searchQuery.trim()) return words;

		const query = searchQuery.toLowerCase();
		return words.filter(
			(w) =>
				w.word.toLowerCase().includes(query) ||
				w.definition?.toLowerCase().includes(query),
		);
	}, [words, searchQuery]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			{/* Header with stats */}
			<div className="px-3 pt-3 pb-2">
				<p className="text-muted-foreground text-sm">
					{learnedCount} of {totalCount} words learned
				</p>
			</div>

			{/* Search Input */}
			<div className="border-b px-3 pb-3">
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search words..."
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

			{/* Word List */}
			<div className="min-h-0 flex-1 overflow-y-auto p-2">
				{filteredWords.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						{searchQuery ? "No words found" : "No words yet"}
					</div>
				) : (
					<div className="space-y-1">
						{filteredWords.map((word) => (
							<VocabularyListItem
								key={word.id}
								word={word}
								isSelected={selectedId === word.id}
								onClick={() => onSelect(word.id)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Add Word Button */}
			<div className="border-t p-3">
				<Button onClick={onAddWord} className="w-full">
					<Plus className="mr-2 h-4 w-4" />
					Add Word
				</Button>
			</div>
		</div>
	);
}
