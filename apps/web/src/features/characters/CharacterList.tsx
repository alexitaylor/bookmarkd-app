"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterListItem } from "./CharacterListItem";

interface Character {
	id: number;
	name: string;
	description: string | null;
	imageUrl: string | null;
	aiGenerated: boolean | null;
}

interface CharacterListProps {
	characters: Character[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	onAddCharacter: () => void;
}

export function CharacterList({
	characters,
	selectedId,
	onSelect,
	onAddCharacter,
}: CharacterListProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredCharacters = useMemo(() => {
		if (!searchQuery.trim()) return characters;

		const query = searchQuery.toLowerCase();
		return characters.filter(
			(c) =>
				c.name.toLowerCase().includes(query) ||
				c.description?.toLowerCase().includes(query),
		);
	}, [characters, searchQuery]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			{/* Search Input */}
			<div className="border-b p-3">
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search characters..."
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

			{/* Character List */}
			<div className="min-h-0 flex-1 overflow-y-auto p-2">
				{filteredCharacters.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						{searchQuery ? "No characters found" : "No characters yet"}
					</div>
				) : (
					<div className="space-y-1">
						{filteredCharacters.map((character) => (
							<CharacterListItem
								key={character.id}
								character={character}
								isSelected={selectedId === character.id}
								onClick={() => onSelect(character.id)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Add Character Button */}
			<div className="border-t p-3">
				<Button onClick={onAddCharacter} className="w-full">
					<Plus className="mr-2 h-4 w-4" />
					Add Character
				</Button>
			</div>
		</div>
	);
}
