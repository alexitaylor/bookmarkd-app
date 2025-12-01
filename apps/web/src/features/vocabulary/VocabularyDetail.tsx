"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookText, Pencil, Trash2, ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VocabularyWord {
	id: number;
	bookId: number;
	word: string;
	definition: string | null;
	contextSentence: string | null;
	pageNumber: number | null;
	learned: boolean;
}

interface VocabularyDetailProps {
	word: VocabularyWord;
	onBack?: () => void;
	showBackButton?: boolean;
}

export function VocabularyDetail({
	word,
	onBack,
	showBackButton = false,
}: VocabularyDetailProps) {
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editWord, setEditWord] = useState(word.word);
	const [editDefinition, setEditDefinition] = useState(word.definition || "");
	const [editContext, setEditContext] = useState(word.contextSentence || "");
	const [editPageNumber, setEditPageNumber] = useState(
		word.pageNumber?.toString() || ""
	);
	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: (data: {
			id: number;
			word?: string;
			definition?: string;
			contextSentence?: string;
			pageNumber?: number;
		}) => client.vocabulary.update(data),
		onSuccess: () => {
			toast.success("Word updated");
			queryClient.invalidateQueries({ queryKey: [["vocabulary"]] });
			setIsEditOpen(false);
		},
		onError: (error) => {
			toast.error(`Failed to update word: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => client.vocabulary.delete({ id }),
		onSuccess: () => {
			toast.success("Word deleted");
			queryClient.invalidateQueries({ queryKey: [["vocabulary"]] });
		},
		onError: (error) => {
			toast.error(`Failed to delete word: ${error.message}`);
		},
	});

	const markLearnedMutation = useMutation({
		mutationFn: ({ id, learned }: { id: number; learned: boolean }) =>
			client.vocabulary.markLearned({ id, learned }),
		onSuccess: (_, { learned }) => {
			toast.success(learned ? "Marked as learned!" : "Marked as unlearned");
			queryClient.invalidateQueries({ queryKey: [["vocabulary"]] });
		},
		onError: (error) => {
			toast.error(`Failed to update: ${error.message}`);
		},
	});

	const handleEdit = () => {
		setEditWord(word.word);
		setEditDefinition(word.definition || "");
		setEditContext(word.contextSentence || "");
		setEditPageNumber(word.pageNumber?.toString() || "");
		setIsEditOpen(true);
	};

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editWord.trim()) {
			toast.error("Word cannot be empty");
			return;
		}
		updateMutation.mutate({
			id: word.id,
			word: editWord.trim(),
			definition: editDefinition.trim() || undefined,
			contextSentence: editContext.trim() || undefined,
			pageNumber: editPageNumber ? parseInt(editPageNumber, 10) : undefined,
		});
	};

	return (
		<div className="h-full overflow-y-auto">
			{/* Mobile Back Button */}
			{showBackButton && onBack && (
				<div className="p-4 border-b md:hidden">
					<Button variant="ghost" size="sm" onClick={onBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Vocabulary
					</Button>
				</div>
			)}

			<div className="p-6 space-y-6">
				{/* Header */}
				<div className="flex items-start gap-4">
					<div
						className={cn(
							"h-16 w-16 shrink-0 rounded-full flex items-center justify-center",
							word.learned
								? "bg-green-100 dark:bg-green-900/30"
								: "bg-muted"
						)}
					>
						{word.learned ? (
							<Check className="h-8 w-8 text-green-600" />
						) : (
							<BookText className="h-8 w-8 text-muted-foreground" />
						)}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2">
							<div>
								<h2 className="text-2xl font-bold">{word.word}</h2>
								{word.pageNumber && (
									<p className="text-sm text-muted-foreground">
										Page {word.pageNumber}
									</p>
								)}
							</div>
							{word.learned && (
								<Badge
									variant="secondary"
									className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
								>
									Learned
								</Badge>
							)}
						</div>
					</div>
				</div>

				{/* Definition */}
				{word.definition && (
					<div>
						<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
							Definition
						</h3>
						<p className="leading-relaxed">{word.definition}</p>
					</div>
				)}

				{/* Context Sentence */}
				{word.contextSentence && (
					<div>
						<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
							Context from Book
						</h3>
						<p className="italic text-muted-foreground leading-relaxed">
							&ldquo;{word.contextSentence}&rdquo;
						</p>
					</div>
				)}

				{/* No content message */}
				{!word.definition && !word.contextSentence && (
					<p className="text-muted-foreground italic">
						No definition or context added for this word.
					</p>
				)}

				{/* Actions */}
				<div className="flex flex-wrap items-center gap-2 pt-4 border-t">
					<Button
						variant={word.learned ? "outline" : "default"}
						onClick={() =>
							markLearnedMutation.mutate({
								id: word.id,
								learned: !word.learned,
							})
						}
					>
						{word.learned ? (
							<>
								<X className="h-4 w-4 mr-2" />
								Mark Unlearned
							</>
						) : (
							<>
								<Check className="h-4 w-4 mr-2" />
								Mark Learned
							</>
						)}
					</Button>
					<Button variant="outline" onClick={handleEdit}>
						<Pencil className="h-4 w-4 mr-2" />
						Edit
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								className="text-destructive hover:text-destructive"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Word</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete &ldquo;{word.word}&rdquo;?
									This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => deleteMutation.mutate(word.id)}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			{/* Edit Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Word</DialogTitle>
						<DialogDescription>Update the vocabulary word.</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSave}>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="edit-word">Word</Label>
								<Input
									id="edit-word"
									value={editWord}
									onChange={(e) => setEditWord(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-definition">Definition (optional)</Label>
								<Textarea
									id="edit-definition"
									value={editDefinition}
									onChange={(e) => setEditDefinition(e.target.value)}
									rows={2}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-context">Context Sentence (optional)</Label>
								<Textarea
									id="edit-context"
									value={editContext}
									onChange={(e) => setEditContext(e.target.value)}
									rows={2}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-page">Page Number (optional)</Label>
								<Input
									id="edit-page"
									type="number"
									min={1}
									value={editPageNumber}
									onChange={(e) => setEditPageNumber(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditOpen(false)}
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
		</div>
	);
}

export function VocabularyDetailEmpty() {
	return (
		<div className="h-full flex flex-col items-center justify-center text-center p-6">
			<BookText className="h-16 w-16 text-muted-foreground mb-4" />
			<h3 className="text-lg font-semibold">Select a Word</h3>
			<p className="text-muted-foreground mt-1">
				Choose a word from the list to view its details
			</p>
		</div>
	);
}
