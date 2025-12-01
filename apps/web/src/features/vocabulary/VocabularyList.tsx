"use client";

import { useState, useMemo } from "react";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
				w.definition?.toLowerCase().includes(query)
		);
	}, [words, searchQuery]);

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* Header with stats */}
			<div className="px-3 pt-3 pb-2">
				<p className="text-sm text-muted-foreground">
					{learnedCount} of {totalCount} words learned
				</p>
			</div>

			{/* Search Input */}
			<div className="px-3 pb-3 border-b">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search words..."
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

			{/* Word List */}
			<div className="flex-1 min-h-0 overflow-y-auto p-2">
				{filteredWords.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
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
			<div className="p-3 border-t">
				<Button onClick={onAddWord} className="w-full">
					<Plus className="h-4 w-4 mr-2" />
					Add Word
				</Button>
			</div>
		</div>
	);
}
