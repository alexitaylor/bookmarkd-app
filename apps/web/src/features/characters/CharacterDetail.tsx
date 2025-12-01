"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/utils/orpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
				<div className="p-4 border-b md:hidden">
					<Button variant="ghost" size="sm" onClick={onBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Characters
					</Button>
				</div>
			)}

			<div className="p-6 space-y-6">
				{/* Header */}
				<div className="flex items-start gap-4">
					<Avatar className="h-20 w-20 shrink-0">
						<AvatarImage src={character.imageUrl || undefined} alt={character.name} />
						<AvatarFallback className="text-2xl">
							<User className="h-10 w-10 text-muted-foreground" />
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2">
							<div>
								<h2 className="text-2xl font-bold">{character.name}</h2>
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
						<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
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
						<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
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
						<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
							Description
						</h3>
						<p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
				<div className="flex items-center gap-2 pt-4 border-t">
					<Button onClick={onEdit}>
						<Pencil className="h-4 w-4 mr-2" />
						Edit
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="outline" className="text-destructive hover:text-destructive">
								<Trash2 className="h-4 w-4 mr-2" />
								Delete
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Character</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete "{character.name}"? This action cannot be undone.
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
		<div className="h-full flex flex-col items-center justify-center text-center p-6">
			<User className="h-16 w-16 text-muted-foreground mb-4" />
			<h3 className="text-lg font-semibold">Select a Character</h3>
			<p className="text-muted-foreground mt-1">
				Choose a character from the list to view their details
			</p>
		</div>
	);
}
