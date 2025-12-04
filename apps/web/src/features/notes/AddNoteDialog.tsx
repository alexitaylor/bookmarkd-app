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

interface AddNoteDialogProps {
	bookId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddNoteDialog({
	bookId,
	open,
	onOpenChange,
}: AddNoteDialogProps) {
	const [content, setContent] = useState("");
	const [pageNumber, setPageNumber] = useState("");
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (data: {
			bookId: number;
			content: string;
			pageNumber?: number;
		}) => client.note.create(data),
		onSuccess: () => {
			toast.success("Note added!");
			queryClient.invalidateQueries({ queryKey: [["note"]] });
			handleClose();
		},
		onError: (error) => {
			toast.error(`Failed to add note: ${error.message}`);
		},
	});

	const handleClose = () => {
		setContent("");
		setPageNumber("");
		onOpenChange(false);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) {
			toast.error("Please enter note content");
			return;
		}
		createMutation.mutate({
			bookId,
			content: content.trim(),
			pageNumber: pageNumber ? Number.parseInt(pageNumber, 10) : undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Note</DialogTitle>
					<DialogDescription>
						Write down your thoughts about this book.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="content">Note</Label>
							<Textarea
								id="content"
								placeholder="Your thoughts..."
								value={content}
								onChange={(e) => setContent(e.target.value)}
								rows={4}
								autoFocus
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
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? "Adding..." : "Add Note"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
