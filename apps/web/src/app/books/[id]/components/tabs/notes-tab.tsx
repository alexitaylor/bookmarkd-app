"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { orpc, client } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface NotesTabProps {
	bookId: number;
}

export function NotesTab({ bookId }: NotesTabProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [newNote, setNewNote] = useState({ content: "", pageNumber: "" });
	const queryClient = useQueryClient();

	const { data: notes, isLoading, error } = useQuery(
		orpc.note.list.queryOptions({ input: { bookId, limit: 50 } })
	);

	const createMutation = useMutation({
		mutationFn: (data: { bookId: number; content: string; pageNumber?: number }) =>
			client.note.create(data),
		onSuccess: () => {
			toast.success("Note added!");
			queryClient.invalidateQueries({ queryKey: ["note", "list"] });
			setIsAddOpen(false);
			setNewNote({ content: "", pageNumber: "" });
		},
		onError: (error) => {
			toast.error(`Failed to add note: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => client.note.delete({ id }),
		onSuccess: () => {
			toast.success("Note deleted");
			queryClient.invalidateQueries({ queryKey: ["note", "list"] });
		},
		onError: (error) => {
			toast.error(`Failed to delete note: ${error.message}`);
		},
	});

	const handleAddNote = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newNote.content.trim()) {
			toast.error("Please enter note content");
			return;
		}
		createMutation.mutate({
			bookId,
			content: newNote.content,
			pageNumber: newNote.pageNumber ? parseInt(newNote.pageNumber, 10) : undefined,
		});
	};

	// Handle unauthenticated users
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<FileText className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold">Sign in to Add Notes</h3>
				<p className="text-muted-foreground mt-1">
					Notes are private and require you to be signed in.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-24 w-full rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					Your Notes {notes && notes.length > 0 && `(${notes.length})`}
				</h2>
				<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Add Note
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Note</DialogTitle>
							<DialogDescription>
								Write down your thoughts about this book.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleAddNote}>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="content">Note</Label>
									<Textarea
										id="content"
										placeholder="Your thoughts..."
										value={newNote.content}
										onChange={(e) =>
											setNewNote({ ...newNote, content: e.target.value })
										}
										rows={4}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pageNumber">Page Number (optional)</Label>
									<Input
										id="pageNumber"
										type="number"
										min={1}
										placeholder="e.g., 42"
										value={newNote.pageNumber}
										onChange={(e) =>
											setNewNote({ ...newNote, pageNumber: e.target.value })
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
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending ? "Adding..." : "Add Note"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{!notes || notes.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<FileText className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold">No Notes Yet</h3>
					<p className="text-muted-foreground mt-1">
						Start adding notes to keep track of your thoughts.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{notes.map((note) => (
						<Card key={note.id}>
							<CardContent className="p-4">
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 space-y-2">
										<p className="whitespace-pre-wrap">{note.content}</p>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											{note.pageNumber && <span>Page {note.pageNumber}</span>}
											<span>
												{new Date(note.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</span>
										</div>
									</div>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="ghost" size="icon" className="shrink-0">
												<Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Delete Note</AlertDialogTitle>
												<AlertDialogDescription>
													Are you sure you want to delete this note? This action
													cannot be undone.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => deleteMutation.mutate(note.id)}
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
												>
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
