"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";

interface AddVocabularyDialogProps {
	bookId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddVocabularyDialog({
	bookId,
	open,
	onOpenChange,
}: AddVocabularyDialogProps) {
	const [word, setWord] = useState("");
	const [definition, setDefinition] = useState("");
	const [contextSentence, setContextSentence] = useState("");
	const [pageNumber, setPageNumber] = useState("");
	const queryClient = useQueryClient();

	const addMutation = useMutation({
		mutationFn: (data: {
			bookId: number;
			word: string;
			definition?: string;
			contextSentence?: string;
			pageNumber?: number;
		}) => client.vocabulary.add(data),
		onSuccess: () => {
			toast.success("Word added!");
			queryClient.invalidateQueries({ queryKey: [["vocabulary"]] });
			handleClose();
		},
		onError: (error) => {
			toast.error(`Failed to add word: ${error.message}`);
		},
	});

	const handleClose = () => {
		setWord("");
		setDefinition("");
		setContextSentence("");
		setPageNumber("");
		onOpenChange(false);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!word.trim()) {
			toast.error("Please enter a word");
			return;
		}
		addMutation.mutate({
			bookId,
			word: word.trim(),
			definition: definition.trim() || undefined,
			contextSentence: contextSentence.trim() || undefined,
			pageNumber: pageNumber ? Number.parseInt(pageNumber, 10) : undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Vocabulary Word</DialogTitle>
					<DialogDescription>
						Save a new word from your reading.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="word">Word</Label>
							<Input
								id="word"
								placeholder="Enter the word"
								value={word}
								onChange={(e) => setWord(e.target.value)}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="definition">Definition (optional)</Label>
							<Textarea
								id="definition"
								placeholder="What does it mean?"
								value={definition}
								onChange={(e) => setDefinition(e.target.value)}
								rows={2}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="context">Context Sentence (optional)</Label>
							<Textarea
								id="context"
								placeholder="How was it used in the book?"
								value={contextSentence}
								onChange={(e) => setContextSentence(e.target.value)}
								rows={2}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="pageNumber">Page Number (optional)</Label>
							<Input
								id="pageNumber"
								type="number"
								min={1}
								placeholder="e.g., 42"
								value={pageNumber}
								onChange={(e) => setPageNumber(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={addMutation.isPending}>
							{addMutation.isPending ? "Adding..." : "Add Word"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
