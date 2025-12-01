"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Pencil, User } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddCharacterDialog } from "../add-character-dialog";
import { EditCharacterDialog } from "../edit-character-dialog";

interface Character {
	id: number;
	bookId: number;
	name: string;
	description: string | null;
	imageUrl: string | null;
	aiGenerated: boolean | null;
}

interface CharactersTabProps {
	bookId: number;
}

export function CharactersTab({ bookId }: CharactersTabProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

	const { data: characters, isLoading } = useQuery(
		orpc.character.getByBookId.queryOptions({ input: { bookId, limit: 50 } })
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-24 w-full rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	if (!characters || characters.length === 0) {
		return (
			<>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Users className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold">No Characters Yet</h3>
					<p className="text-muted-foreground mt-1 mb-4">
						Characters for this book haven&apos;t been added yet.
					</p>
					<Button onClick={() => setIsAddOpen(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Add Character
					</Button>
				</div>
				<AddCharacterDialog
					bookId={bookId}
					open={isAddOpen}
					onOpenChange={setIsAddOpen}
				/>
			</>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					Characters ({characters.length})
				</h2>
				<Button onClick={() => setIsAddOpen(true)}>
					<Plus className="h-4 w-4 mr-2" />
					Add Character
				</Button>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{characters.map((character) => (
					<Card key={character.id} className="hover:bg-accent/50 transition-colors">
						<CardContent className="p-4">
							<div className="flex gap-3">
								<Avatar className="h-12 w-12 shrink-0">
									<AvatarImage src={character.imageUrl || undefined} alt={character.name} />
									<AvatarFallback>
										<User className="h-6 w-6 text-muted-foreground" />
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2">
										<h3 className="font-semibold truncate">{character.name}</h3>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 shrink-0 -mt-1 -mr-2"
											onClick={() => setEditingCharacter(character)}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
									</div>
									{character.description && (
										<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
											{character.description}
										</p>
									)}
									{character.aiGenerated && (
										<span className="mt-2 inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
											AI Generated
										</span>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<AddCharacterDialog
				bookId={bookId}
				open={isAddOpen}
				onOpenChange={setIsAddOpen}
			/>

			{editingCharacter && (
				<EditCharacterDialog
					character={editingCharacter}
					open={!!editingCharacter}
					onOpenChange={(open) => !open && setEditingCharacter(null)}
				/>
			)}
		</div>
	);
}
