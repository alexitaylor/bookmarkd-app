"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { client } from "@/utils/orpc";

interface Character {
	id: number;
	name: string;
	description: string | null;
	imageUrl: string | null;
	aiGenerated: boolean | null;
}

interface CharacterDetailProps {
	character: Character;
	onEdit: () => void;
	onBack?: () => void;
	showBackButton?: boolean;
}

export function CharacterDetail({
	character,
	onEdit,
	onBack,
	showBackButton = false,
}: CharacterDetailProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: (id: number) => client.character.delete({ id }),
		onSuccess: () => {
			toast.success("Character deleted");
			queryClient.invalidateQueries({ queryKey: [["character"]] });
		},
		onError: (error) => {
			toast.error(`Failed to delete character: ${error.message}`);
		},
	});

	// Parse description for role and traits
	const parseDescription = (desc: string | null) => {
		if (!desc) return { role: null, traits: null, text: null };

		const lines = desc.split("\n\n");
		let role: string | null = null;
		let traits: string | null = null;
		const textParts: string[] = [];

		for (const line of lines) {
			if (line.startsWith("Role: ")) {
				role = line.replace("Role: ", "");
			} else if (line.startsWith("Traits: ")) {
				traits = line.replace("Traits: ", "");
			} else {
				textParts.push(line);
			}
		}

		return { role, traits, text: textParts.join("\n\n") || null };
	};

	const { role, traits, text } = parseDescription(character.description);

	return (
		<div className="h-full overflow-y-auto">
			{/* Mobile Back Button */}
			{showBackButton && onBack && (
				<div className="border-b p-4 md:hidden">
					<Button variant="ghost" size="sm" onClick={onBack}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Characters
					</Button>
				</div>
			)}

			<div className="space-y-6 p-6">
				{/* Header */}
				<div className="flex items-start gap-4">
					<Avatar className="h-20 w-20 shrink-0">
						<AvatarImage
							src={character.imageUrl || undefined}
							alt={character.name}
						/>
						<AvatarFallback className="text-2xl">
							<User className="h-10 w-10 text-muted-foreground" />
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<div>
								<h2 className="font-bold text-2xl">{character.name}</h2>
								{character.aiGenerated && (
									<Badge variant="secondary" className="mt-1">
										AI Generated
									</Badge>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Role */}
				{role && (
					<div>
						<h3 className="mb-2 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Role
						</h3>
						<Badge variant="outline" className="text-sm">
							{role}
						</Badge>
					</div>
				)}

				{/* Traits */}
				{traits && (
					<div>
						<h3 className="mb-2 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Personality Traits
						</h3>
						<div className="flex flex-wrap gap-2">
							{traits.split(",").map((trait, i) => (
								<Badge key={i} variant="secondary">
									{trait.trim()}
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Description */}
				{text && (
					<div>
						<h3 className="mb-2 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Description
						</h3>
						<p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
							{text}
						</p>
					</div>
				)}

				{/* No content message */}
				{!role && !traits && !text && (
					<p className="text-muted-foreground italic">
						No description available for this character.
					</p>
				)}

				{/* Actions */}
				<div className="flex items-center gap-2 border-t pt-4">
					<Button onClick={onEdit}>
						<Pencil className="mr-2 h-4 w-4" />
						Edit
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								className="text-destructive hover:text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Character</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete "{character.name}"? This
									action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => deleteMutation.mutate(character.id)}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
}

export function CharacterDetailEmpty() {
	return (
		<div className="flex h-full flex-col items-center justify-center p-6 text-center">
			<User className="mb-4 h-16 w-16 text-muted-foreground" />
			<h3 className="font-semibold text-lg">Select a Character</h3>
			<p className="mt-1 text-muted-foreground">
				Choose a character from the list to view their details
			</p>
		</div>
	);
}
