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
				"w-full flex items-start gap-3 p-3 text-left transition-colors rounded-md",
				"hover:bg-accent/50",
				isSelected && "bg-accent border-l-2 border-primary",
				word.learned && "bg-green-50/50 dark:bg-green-950/20"
			)}
		>
			<div
				className={cn(
					"h-10 w-10 shrink-0 rounded-full flex items-center justify-center",
					word.learned
						? "bg-green-100 dark:bg-green-900/30"
						: "bg-muted"
				)}
			>
				{word.learned ? (
					<Check className="h-5 w-5 text-green-600" />
				) : (
					<BookText className="h-5 w-5 text-muted-foreground" />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium truncate">{word.word}</span>
					{word.learned && (
						<Badge variant="secondary" className="text-[10px] shrink-0">
							Learned
						</Badge>
					)}
				</div>
				{truncatedDefinition && (
					<p className="text-sm text-muted-foreground truncate">
						{truncatedDefinition}
					</p>
				)}
			</div>
		</button>
	);
}
