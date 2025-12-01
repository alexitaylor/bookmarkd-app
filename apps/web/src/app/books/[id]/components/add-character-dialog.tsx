"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface AddCharacterDialogProps {
	bookId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const CHARACTER_ROLES = [
	{ value: "protagonist", label: "Protagonist", description: "Main character driving the story" },
	{ value: "antagonist", label: "Antagonist", description: "Primary opposing force" },
	{ value: "supporting", label: "Supporting", description: "Important secondary character" },
	{ value: "minor", label: "Minor", description: "Appears briefly or occasionally" },
	{ value: "mentor", label: "Mentor", description: "Guides or teaches the protagonist" },
	{ value: "love-interest", label: "Love Interest", description: "Romantic connection" },
	{ value: "sidekick", label: "Sidekick", description: "Loyal companion to main character" },
	{ value: "narrator", label: "Narrator", description: "Tells the story" },
];

export function AddCharacterDialog({
	bookId,
	open,
	onOpenChange,
}: AddCharacterDialogProps) {
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [description, setDescription] = useState("");
	const [traits, setTraits] = useState("");
	const [aliasInput, setAliasInput] = useState("");
	const [aliases, setAliases] = useState<string[]>([]);
	const [imageUrl, setImageUrl] = useState("");
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (data: {
			bookId: number;
			name: string;
			description?: string;
			imageUrl?: string;
			aliases?: string[];
		}) => client.character.create(data),
		onSuccess: () => {
			toast.success("Character added successfully!");
			queryClient.invalidateQueries({ queryKey: [["character"]] });
			handleClose();
		},
		onError: (error) => {
			toast.error(`Failed to add character: ${error.message}`);
		},
	});

	const handleClose = () => {
		setName("");
		setRole("");
		setDescription("");
		setTraits("");
		setAliasInput("");
		setAliases([]);
		setImageUrl("");
		onOpenChange(false);
	};

	const handleAddAlias = () => {
		const trimmed = aliasInput.trim();
		if (trimmed && !aliases.includes(trimmed)) {
			setAliases([...aliases, trimmed]);
			setAliasInput("");
		}
	};

	const handleRemoveAlias = (alias: string) => {
		setAliases(aliases.filter((a) => a !== alias));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddAlias();
		}
	};

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

		createMutation.mutate({
			bookId,
			name: name.trim(),
			description: fullDescription,
			imageUrl: imageUrl.trim() || undefined,
			aliases: aliases.length > 0 ? aliases : undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Add Character
					</DialogTitle>
					<DialogDescription>
						Add a new character from this book. Include as much detail as you'd like to help others understand the character.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Character Name */}
						<div className="space-y-2">
							<Label htmlFor="name">
								Character Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								placeholder="e.g., Elizabeth Bennet"
								value={name}
								onChange={(e) => setName(e.target.value)}
								autoFocus
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor="description">Description / Background</Label>
							<Textarea
								id="description"
								placeholder="Describe the character's background, appearance, motivations, or any other relevant details..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
							/>
						</div>

						{/* Image URL */}
						<div className="space-y-2">
							<Label htmlFor="imageUrl">Image URL (optional)</Label>
							<Input
								id="imageUrl"
								type="url"
								placeholder="https://example.com/character-image.jpg"
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">
								Link to an image representing this character
							</p>
						</div>

						{/* Character Role */}
						<div className="space-y-2">
							<Label htmlFor="role">Role in Story</Label>
							<Select value={role} onValueChange={setRole}>
								<SelectTrigger>
									<SelectValue placeholder="Select a role..." />
								</SelectTrigger>
								<SelectContent>
									{CHARACTER_ROLES.map((r) => (
										<SelectItem key={r.value} value={r.value}>
											<div className="flex flex-col">
												<span>{r.label}</span>
												<span className="text-xs text-muted-foreground">
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
							<Label htmlFor="traits">
								<span className="flex items-center gap-1">
									<Sparkles className="h-3 w-3" />
									Personality Traits
								</span>
							</Label>
							<Input
								id="traits"
								placeholder="e.g., witty, intelligent, independent, proud"
								value={traits}
								onChange={(e) => setTraits(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">
								Comma-separated list of key personality traits
							</p>
						</div>

						{/* Aliases / Nicknames */}
						<div className="space-y-2">
							<Label htmlFor="aliases">Aliases / Nicknames</Label>
							<div className="flex gap-2">
								<Input
									id="aliases"
									placeholder="e.g., Lizzy, Miss Bennet"
									value={aliasInput}
									onChange={(e) => setAliasInput(e.target.value)}
									onKeyDown={handleKeyDown}
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={handleAddAlias}
									disabled={!aliasInput.trim()}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>
							{aliases.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{aliases.map((alias) => (
										<Badge
											key={alias}
											variant="secondary"
											className="flex items-center gap-1"
										>
											{alias}
											<button
												type="button"
												onClick={() => handleRemoveAlias(alias)}
												className="ml-1 hover:text-destructive"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? "Adding..." : "Add Character"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
