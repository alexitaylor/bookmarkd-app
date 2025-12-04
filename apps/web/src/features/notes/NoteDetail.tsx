"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Pencil, Trash2 } from "lucide-react";
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

interface Note {
	id: number;
	bookId: number;
	content: string;
	pageNumber: number | null;
	createdAt: Date;
}

interface NoteDetailProps {
	note: Note;
	onBack?: () => void;
	showBackButton?: boolean;
}

export function NoteDetail({
	note,
	onBack,
	showBackButton = false,
}: NoteDetailProps) {
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editContent, setEditContent] = useState(note.content);
	const [editPageNumber, setEditPageNumber] = useState(
		note.pageNumber?.toString() || "",
	);
	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: (data: { id: number; content: string; pageNumber?: number }) =>
			client.note.update(data),
		onSuccess: () => {
			toast.success("Note updated");
			queryClient.invalidateQueries({ queryKey: [["note"]] });
			setIsEditOpen(false);
		},
		onError: (error) => {
			toast.error(`Failed to update note: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => client.note.delete({ id }),
		onSuccess: () => {
			toast.success("Note deleted");
			queryClient.invalidateQueries({ queryKey: [["note"]] });
		},
		onError: (error) => {
			toast.error(`Failed to delete note: ${error.message}`);
		},
	});

	const handleEdit = () => {
		setEditContent(note.content);
		setEditPageNumber(note.pageNumber?.toString() || "");
		setIsEditOpen(true);
	};

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editContent.trim()) {
			toast.error("Note content cannot be empty");
			return;
		}
		updateMutation.mutate({
			id: note.id,
			content: editContent,
			pageNumber: editPageNumber
				? Number.parseInt(editPageNumber, 10)
				: undefined,
		});
	};

	const formattedDate = new Date(note.createdAt).toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	return (
		<div className="h-full overflow-y-auto">
			{/* Mobile Back Button */}
			{showBackButton && onBack && (
				<div className="border-b p-4 md:hidden">
					<Button variant="ghost" size="sm" onClick={onBack}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Notes
					</Button>
				</div>
			)}

			<div className="space-y-6 p-6">
				{/* Header */}
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
						<FileText className="h-6 w-6 text-muted-foreground" />
					</div>
					<div className="min-w-0 flex-1">
						<h2 className="font-semibold text-lg">Note</h2>
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<span>{formattedDate}</span>
							{note.pageNumber && <span>· Page {note.pageNumber}</span>}
						</div>
					</div>
				</div>

				{/* Content */}
				<div>
					<h3 className="mb-2 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
						Content
					</h3>
					<p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 border-t pt-4">
					<Button onClick={handleEdit}>
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
								<AlertDialogTitle>Delete Note</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete this note? This action cannot
									be undone.
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
			</div>

			{/* Edit Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Note</DialogTitle>
						<DialogDescription>Update your note.</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSave}>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="edit-content">Note</Label>
								<Textarea
									id="edit-content"
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									rows={6}
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

export function NoteDetailEmpty() {
	return (
		<div className="flex h-full flex-col items-center justify-center p-6 text-center">
			<FileText className="mb-4 h-16 w-16 text-muted-foreground" />
			<h3 className="font-semibold text-lg">Select a Note</h3>
			<p className="mt-1 text-muted-foreground">
				Choose a note from the list to view its content
			</p>
		</div>
	);
}
