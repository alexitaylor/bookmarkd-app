"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookText, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { orpc, client } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
	DialogTrigger,
} from "@/components/ui/dialog";
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

interface VocabularyTabProps {
	bookId: number;
}

export function VocabularyTab({ bookId }: VocabularyTabProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [newWord, setNewWord] = useState({
		word: "",
		definition: "",
		contextSentence: "",
		pageNumber: "",
	});
	const queryClient = useQueryClient();

	const { data: vocabulary, isLoading, error } = useQuery(
		orpc.vocabulary.list.queryOptions({ input: { bookId, limit: 100 } })
	);

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
			queryClient.invalidateQueries({ queryKey: ["vocabulary", "list"] });
			setIsAddOpen(false);
			setNewWord({ word: "", definition: "", contextSentence: "", pageNumber: "" });
		},
		onError: (error) => {
			toast.error(`Failed to add word: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => client.vocabulary.delete({ id }),
		onSuccess: () => {
			toast.success("Word deleted");
			queryClient.invalidateQueries({ queryKey: ["vocabulary", "list"] });
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
			queryClient.invalidateQueries({ queryKey: ["vocabulary", "list"] });
		},
		onError: (error) => {
			toast.error(`Failed to update: ${error.message}`);
		},
	});

	const handleAddWord = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newWord.word.trim()) {
			toast.error("Please enter a word");
			return;
		}
		addMutation.mutate({
			bookId,
			word: newWord.word,
			definition: newWord.definition || undefined,
			contextSentence: newWord.contextSentence || undefined,
			pageNumber: newWord.pageNumber ? parseInt(newWord.pageNumber, 10) : undefined,
		});
	};

	// Handle unauthenticated users
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<BookText className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold">Sign in to Track Vocabulary</h3>
				<p className="text-muted-foreground mt-1">
					Vocabulary is private and requires you to be signed in.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-20 w-full rounded-lg" />
				))}
			</div>
		);
	}

	const learnedCount = vocabulary?.filter((v) => v.learned).length || 0;
	const totalCount = vocabulary?.length || 0;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">
						Your Vocabulary {totalCount > 0 && `(${totalCount})`}
					</h2>
					{totalCount > 0 && (
						<p className="text-sm text-muted-foreground">
							{learnedCount} of {totalCount} words learned
						</p>
					)}
				</div>
				<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Add Word
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Vocabulary Word</DialogTitle>
							<DialogDescription>
								Save a new word from your reading.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleAddWord}>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="word">Word</Label>
									<Input
										id="word"
										placeholder="Enter the word"
										value={newWord.word}
										onChange={(e) =>
											setNewWord({ ...newWord, word: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="definition">Definition (optional)</Label>
									<Textarea
										id="definition"
										placeholder="What does it mean?"
										value={newWord.definition}
										onChange={(e) =>
											setNewWord({ ...newWord, definition: e.target.value })
										}
										rows={2}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="context">Context Sentence (optional)</Label>
									<Textarea
										id="context"
										placeholder="How was it used in the book?"
										value={newWord.contextSentence}
										onChange={(e) =>
											setNewWord({ ...newWord, contextSentence: e.target.value })
										}
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
										value={newWord.pageNumber}
										onChange={(e) =>
											setNewWord({ ...newWord, pageNumber: e.target.value })
										}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsAddOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={addMutation.isPending}>
									{addMutation.isPending ? "Adding..." : "Add Word"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{!vocabulary || vocabulary.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<BookText className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold">No Words Yet</h3>
					<p className="text-muted-foreground mt-1">
						Start adding new words you encounter while reading.
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{vocabulary.map((word) => (
						<Card
							key={word.id}
							className={word.learned ? "bg-green-50 dark:bg-green-950/20" : ""}
						>
							<CardContent className="p-4">
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 space-y-2">
										<div className="flex items-center gap-2">
											<h3 className="font-semibold">{word.word}</h3>
											{word.learned && (
												<Badge variant="secondary" className="text-xs">
													Learned
												</Badge>
											)}
										</div>
										{word.definition && (
											<p className="text-sm text-muted-foreground">
												{word.definition}
											</p>
										)}
										{word.contextSentence && (
											<p className="text-sm italic text-muted-foreground">
												&ldquo;{word.contextSentence}&rdquo;
											</p>
										)}
										{word.pageNumber && (
											<span className="text-xs text-muted-foreground">
												Page {word.pageNumber}
											</span>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												markLearnedMutation.mutate({
													id: word.id,
													learned: !word.learned,
												})
											}
											title={word.learned ? "Mark as unlearned" : "Mark as learned"}
										>
											<Check
												className={`h-4 w-4 ${
													word.learned
														? "text-green-600"
														: "text-muted-foreground"
												}`}
											/>
										</Button>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button variant="ghost" size="icon">
													<Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
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
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
