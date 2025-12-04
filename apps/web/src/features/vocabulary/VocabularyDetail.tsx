"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookText, Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

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
		word.pageNumber?.toString() || "",
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
			pageNumber: editPageNumber
				? Number.parseInt(editPageNumber, 10)
				: undefined,
		});
	};

	return (
		<div className="h-full overflow-y-auto">
			{/* Mobile Back Button */}
			{showBackButton && onBack && (
				<div className="border-b p-4 md:hidden">
					<Button variant="ghost" size="sm" onClick={onBack}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Vocabulary
					</Button>
				</div>
			)}

			<div className="space-y-6 p-6">
				{/* Header */}
				<div className="flex items-start gap-4">
					<div
						className={cn(
							"flex h-16 w-16 shrink-0 items-center justify-center rounded-full",
							word.learned ? "bg-green-100 dark:bg-green-900/30" : "bg-muted",
						)}
					>
						{word.learned ? (
							<Check className="h-8 w-8 text-green-600" />
						) : (
							<BookText className="h-8 w-8 text-muted-foreground" />
						)}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<div>
								<h2 className="font-bold text-2xl">{word.word}</h2>
								{word.pageNumber && (
									<p className="text-muted-foreground text-sm">
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
						<h3 className="mb-2 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Definition
						</h3>
						<p className="leading-relaxed">{word.definition}</p>
					</div>
				)}

				{/* Context Sentence */}
				{word.contextSentence && (
					<div>
						<h3 className="mb-2 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Context from Book
						</h3>
						<p className="text-muted-foreground italic leading-relaxed">
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
				<div className="flex flex-wrap items-center gap-2 border-t pt-4">
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
								<X className="mr-2 h-4 w-4" />
								Mark Unlearned
							</>
						) : (
							<>
								<Check className="mr-2 h-4 w-4" />
								Mark Learned
							</>
						)}
					</Button>
					<Button variant="outline" onClick={handleEdit}>
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
								<Label htmlFor="edit-context">
									Context Sentence (optional)
								</Label>
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
		<div className="flex h-full flex-col items-center justify-center p-6 text-center">
			<BookText className="mb-4 h-16 w-16 text-muted-foreground" />
			<h3 className="font-semibold text-lg">Select a Word</h3>
			<p className="mt-1 text-muted-foreground">
				Choose a word from the list to view its details
			</p>
		</div>
	);
}
