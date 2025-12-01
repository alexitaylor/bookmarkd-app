"use client";

import { useState, useMemo } from "react";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
				c.description?.toLowerCase().includes(query)
		);
	}, [characters, searchQuery]);

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* Search Input */}
			<div className="p-3 border-b">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search characters..."
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

			{/* Character List */}
			<div className="flex-1 min-h-0 overflow-y-auto p-2">
				{filteredCharacters.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
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
			<div className="p-3 border-t">
				<Button onClick={onAddCharacter} className="w-full">
					<Plus className="h-4 w-4 mr-2" />
					Add Character
				</Button>
			</div>
		</div>
	);
}
