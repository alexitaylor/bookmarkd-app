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
				"flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors",
				"hover:bg-accent/50",
				isSelected && "border-primary border-l-2 bg-accent",
			)}
		>
			<Avatar className="h-10 w-10 shrink-0">
				<AvatarImage
					src={character.imageUrl || undefined}
					alt={character.name}
				/>
				<AvatarFallback>
					<User className="h-5 w-5 text-muted-foreground" />
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate font-medium">{character.name}</span>
					{character.aiGenerated && (
						<span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
							AI
						</span>
					)}
				</div>
				{truncatedDescription && (
					<p className="truncate text-muted-foreground text-sm">
						{truncatedDescription}
					</p>
				)}
			</div>
		</button>
	);
}
