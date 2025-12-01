"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CharacterList } from "./CharacterList";
import { CharacterDetail, CharacterDetailEmpty } from "./CharacterDetail";
import { AddCharacterDialog } from "@/app/books/[id]/components/add-character-dialog";
import { EditCharacterDialog } from "@/app/books/[id]/components/edit-character-dialog";

interface Character {
	id: number;
	bookId: number;
	name: string;
	description: string | null;
	imageUrl: string | null;
	aiGenerated: boolean | null;
}

interface CharacterGlossaryProps {
	bookId: number;
}

export function CharacterGlossary({ bookId }: CharacterGlossaryProps) {
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
	const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

	const { data: characters, isLoading } = useQuery(
		orpc.character.getByBookId.queryOptions({ input: { bookId, limit: 100 } })
	);

	// Auto-select first character when loaded
	useEffect(() => {
		if (characters && characters.length > 0 && selectedId === null) {
			setSelectedId(characters[0].id);
		}
	}, [characters, selectedId]);

	// Clear selection if selected character is deleted
	useEffect(() => {
		if (selectedId && characters && !characters.find((c) => c.id === selectedId)) {
			setSelectedId(characters.length > 0 ? characters[0].id : null);
			setIsMobileDetailOpen(false);
		}
	}, [characters, selectedId]);

	const selectedCharacter = characters?.find((c) => c.id === selectedId) || null;

	const handleSelect = (id: number) => {
		setSelectedId(id);
		setIsMobileDetailOpen(true);
	};

	const handleBack = () => {
		setIsMobileDetailOpen(false);
	};

	const handleEdit = () => {
		if (selectedCharacter) {
			setEditingCharacter(selectedCharacter);
		}
	};

	if (isLoading) {
		return (
			<div className="grid md:grid-cols-[300px_1fr] h-[600px] border rounded-lg overflow-hidden">
				<div className="border-r p-3 space-y-3">
					<Skeleton className="h-10 w-full" />
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-16 w-full" />
					))}
				</div>
				<div className="p-6 space-y-4 hidden md:block">
					<Skeleton className="h-20 w-20 rounded-full" />
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</div>
			</div>
		);
	}

	if (!characters || characters.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
				<Users className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold">No Characters Yet</h3>
				<p className="text-muted-foreground mt-1 mb-4">
					Characters for this book haven&apos;t been added yet.
				</p>
				<Button onClick={() => setIsAddOpen(true)}>Add Character</Button>
				<AddCharacterDialog
					bookId={bookId}
					open={isAddOpen}
					onOpenChange={setIsAddOpen}
				/>
			</div>
		);
	}

	return (
		<>
			<div className="grid md:grid-cols-[300px_1fr] h-[600px] border rounded-lg overflow-hidden">
				{/* Left Panel - Character List */}
				<div
					className={`border-r bg-background min-h-0 ${
						isMobileDetailOpen ? "hidden md:flex md:flex-col" : "flex flex-col"
					}`}
				>
					<CharacterList
						characters={characters}
						selectedId={selectedId}
						onSelect={handleSelect}
						onAddCharacter={() => setIsAddOpen(true)}
					/>
				</div>

				{/* Right Panel - Character Detail */}
				<div
					className={`bg-background ${
						isMobileDetailOpen ? "flex flex-col" : "hidden md:flex md:flex-col"
					}`}
				>
					{selectedCharacter ? (
						<CharacterDetail
							character={selectedCharacter}
							onEdit={handleEdit}
							onBack={handleBack}
							showBackButton={isMobileDetailOpen}
						/>
					) : (
						<CharacterDetailEmpty />
					)}
				</div>
			</div>

			{/* Add Character Dialog */}
			<AddCharacterDialog
				bookId={bookId}
				open={isAddOpen}
				onOpenChange={setIsAddOpen}
			/>

			{/* Edit Character Dialog */}
			{editingCharacter && (
				<EditCharacterDialog
					character={editingCharacter}
					open={!!editingCharacter}
					onOpenChange={(open) => !open && setEditingCharacter(null)}
				/>
			)}
		</>
	);
}
