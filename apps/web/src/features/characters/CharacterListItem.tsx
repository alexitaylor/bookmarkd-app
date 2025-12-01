"use client";

import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Character {
	id: number;
	name: string;
	description: string | null;
	imageUrl: string | null;
	aiGenerated: boolean | null;
}

interface CharacterListItemProps {
	character: Character;
	isSelected: boolean;
	onClick: () => void;
}

export function CharacterListItem({
	character,
	isSelected,
	onClick,
}: CharacterListItemProps) {
	// Truncate description to ~60 chars
	const truncatedDescription = character.description
		? character.description.length > 60
			? character.description.slice(0, 60) + "..."
			: character.description
		: null;

	return (
		<button
			onClick={onClick}
			className={cn(
				"w-full flex items-center gap-3 p-3 text-left transition-colors rounded-md",
				"hover:bg-accent/50",
				isSelected && "bg-accent border-l-2 border-primary"
			)}
		>
			<Avatar className="h-10 w-10 shrink-0">
				<AvatarImage src={character.imageUrl || undefined} alt={character.name} />
				<AvatarFallback>
					<User className="h-5 w-5 text-muted-foreground" />
				</AvatarFallback>
			</Avatar>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium truncate">{character.name}</span>
					{character.aiGenerated && (
						<span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
							AI
						</span>
					)}
				</div>
				{truncatedDescription && (
					<p className="text-sm text-muted-foreground truncate">
						{truncatedDescription}
					</p>
				)}
			</div>
		</button>
	);
}
