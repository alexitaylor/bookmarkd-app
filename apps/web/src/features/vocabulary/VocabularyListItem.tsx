"use client";

import { BookText, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VocabularyWord {
	id: number;
	bookId: number;
	word: string;
	definition: string | null;
	contextSentence: string | null;
	pageNumber: number | null;
	learned: boolean;
}

interface VocabularyListItemProps {
	word: VocabularyWord;
	isSelected: boolean;
	onClick: () => void;
}

export function VocabularyListItem({
	word,
	isSelected,
	onClick,
}: VocabularyListItemProps) {
	// Truncate definition to ~50 chars
	const truncatedDefinition = word.definition
		? word.definition.length > 50
			? word.definition.slice(0, 50) + "..."
			: word.definition
		: null;

	return (
		<button
			onClick={onClick}
			className={cn(
				"flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors",
				"hover:bg-accent/50",
				isSelected && "border-primary border-l-2 bg-accent",
				word.learned && "bg-green-50/50 dark:bg-green-950/20",
			)}
		>
			<div
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
					word.learned ? "bg-green-100 dark:bg-green-900/30" : "bg-muted",
				)}
			>
				{word.learned ? (
					<Check className="h-5 w-5 text-green-600" />
				) : (
					<BookText className="h-5 w-5 text-muted-foreground" />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate font-medium">{word.word}</span>
					{word.learned && (
						<Badge variant="secondary" className="shrink-0 text-[10px]">
							Learned
						</Badge>
					)}
				</div>
				{truncatedDefinition && (
					<p className="truncate text-muted-foreground text-sm">
						{truncatedDefinition}
					</p>
				)}
			</div>
		</button>
	);
}
