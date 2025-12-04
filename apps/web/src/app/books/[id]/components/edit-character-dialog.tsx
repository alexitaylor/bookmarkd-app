"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";

interface Character {
	id: number;
	bookId: number;
	name: string;
	description: string | null;
	imageUrl: string | null;
	aiGenerated: boolean | null;
}

interface EditCharacterDialogProps {
	character: Character;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const CHARACTER_ROLES = [
	{
		value: "protagonist",
		label: "Protagonist",
		description: "Main character driving the story",
	},
	{
		value: "antagonist",
		label: "Antagonist",
		description: "Primary opposing force",
	},
	{
		value: "supporting",
		label: "Supporting",
		description: "Important secondary character",
	},
	{
		value: "minor",
		label: "Minor",
		description: "Appears briefly or occasionally",
	},
	{
		value: "mentor",
		label: "Mentor",
		description: "Guides or teaches the protagonist",
	},
	{
		value: "love-interest",
		label: "Love Interest",
		description: "Romantic connection",
	},
	{
		value: "sidekick",
		label: "Sidekick",
		description: "Loyal companion to main character",
	},
	{ value: "narrator", label: "Narrator", description: "Tells the story" },
];

function parseDescription(description: string | null): {
	role: string;
	traits: string;
	text: string;
} {
	if (!description) return { role: "", traits: "", text: "" };

	const lines = description.split("\n\n");
	let role = "";
	let traits = "";
	const textParts: string[] = [];

	for (const line of lines) {
		if (line.startsWith("Role: ")) {
			const roleLabel = line.replace("Role: ", "");
			const foundRole = CHARACTER_ROLES.find((r) => r.label === roleLabel);
			role = foundRole?.value || "";
		} else if (line.startsWith("Traits: ")) {
			traits = line.replace("Traits: ", "");
		} else {
			textParts.push(line);
		}
	}

	return { role, traits, text: textParts.join("\n\n") };
}

export function EditCharacterDialog({
	character,
	open,
	onOpenChange,
}: EditCharacterDialogProps) {
	const parsed = parseDescription(character.description);

	const [name, setName] = useState(character.name);
	const [role, setRole] = useState(parsed.role);
	const [description, setDescription] = useState(parsed.text);
	const [traits, setTraits] = useState(parsed.traits);
	const [imageUrl, setImageUrl] = useState(character.imageUrl || "");
	const queryClient = useQueryClient();

	// Reset form when character changes
	useEffect(() => {
		const newParsed = parseDescription(character.description);
		setName(character.name);
		setRole(newParsed.role);
		setDescription(newParsed.text);
		setTraits(newParsed.traits);
		setImageUrl(character.imageUrl || "");
	}, [character]);

	const updateMutation = useMutation({
		mutationFn: (data: {
			id: number;
			name?: string;
			description?: string;
			imageUrl?: string | null;
		}) => client.character.update(data),
		onSuccess: () => {
			toast.success("Character updated successfully!");
			queryClient.invalidateQueries({ queryKey: [["character"]] });
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(`Failed to update character: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Please enter a character name");
			return;
		}

		// Build description from role, traits, and custom description
		const descriptionParts: string[] = [];

		if (role) {
			const roleInfo = CHARACTER_ROLES.find((r) => r.value === role);
			if (roleInfo) {
				descriptionParts.push(`Role: ${roleInfo.label}`);
			}
		}

		if (traits.trim()) {
			descriptionParts.push(`Traits: ${traits.trim()}`);
		}

		if (description.trim()) {
			descriptionParts.push(description.trim());
		}

		const fullDescription = descriptionParts.join("\n\n") || undefined;

		updateMutation.mutate({
			id: character.id,
			name: name.trim(),
			description: fullDescription,
			imageUrl: imageUrl.trim() || null,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Edit Character
					</DialogTitle>
					<DialogDescription>
						Update the character's information.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Character Name */}
						<div className="space-y-2">
							<Label htmlFor="edit-name">
								Character Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="edit-name"
								placeholder="e.g., Elizabeth Bennet"
								value={name}
								onChange={(e) => setName(e.target.value)}
								autoFocus
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor="edit-description">Description / Background</Label>
							<Textarea
								id="edit-description"
								placeholder="Describe the character's background, appearance, motivations, or any other relevant details..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
							/>
						</div>

						{/* Image URL */}
						<div className="space-y-2">
							<Label htmlFor="edit-imageUrl">Image URL (optional)</Label>
							<Input
								id="edit-imageUrl"
								type="url"
								placeholder="https://example.com/character-image.jpg"
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
							/>
							<p className="text-muted-foreground text-xs">
								Link to an image representing this character
							</p>
						</div>

						{/* Character Role */}
						<div className="space-y-2">
							<Label htmlFor="edit-role">Role in Story</Label>
							<Select value={role} onValueChange={setRole}>
								<SelectTrigger>
									<SelectValue placeholder="Select a role..." />
								</SelectTrigger>
								<SelectContent>
									{CHARACTER_ROLES.map((r) => (
										<SelectItem key={r.value} value={r.value}>
											<div className="flex flex-col">
												<span>{r.label}</span>
												<span className="text-muted-foreground text-xs">
													{r.description}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Personality Traits */}
						<div className="space-y-2">
							<Label htmlFor="edit-traits">
								<span className="flex items-center gap-1">
									<Sparkles className="h-3 w-3" />
									Personality Traits
								</span>
							</Label>
							<Input
								id="edit-traits"
								placeholder="e.g., witty, intelligent, independent, proud"
								value={traits}
								onChange={(e) => setTraits(e.target.value)}
							/>
							<p className="text-muted-foreground text-xs">
								Comma-separated list of key personality traits
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={updateMutation.isPending}>
							{updateMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
