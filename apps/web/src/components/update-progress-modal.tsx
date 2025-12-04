"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { client } from "@/utils/orpc";

interface UpdateProgressModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bookId: number;
	bookTitle: string;
	currentPage: number;
	pageCount: number | null;
}

export function UpdateProgressModal({
	open,
	onOpenChange,
	bookId,
	bookTitle,
	currentPage,
	pageCount,
}: UpdateProgressModalProps) {
	const [page, setPage] = useState(currentPage.toString());
	const queryClient = useQueryClient();

	// Sync local state when currentPage prop changes
	useEffect(() => {
		setPage(currentPage.toString());
	}, [currentPage]);

	const updateProgress = useMutation({
		mutationFn: async (newPage: number) => {
			return client.userBook.updateProgress({ bookId, currentPage: newPage });
		},
		onSuccess: () => {
			toast.success("Progress updated!");
			queryClient.invalidateQueries({ queryKey: [["userBook"]] });
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(`Failed to update progress: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const pageNum = Number.parseInt(page, 10);
		if (isNaN(pageNum) || pageNum < 0) {
			toast.error("Please enter a valid page number");
			return;
		}
		if (pageCount && pageNum > pageCount) {
			toast.error(`Page number cannot exceed ${pageCount}`);
			return;
		}
		updateProgress.mutate(pageNum);
	};

	const progress = pageCount
		? Math.round(((Number.parseInt(page, 10) || 0) / pageCount) * 100)
		: 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Update Reading Progress</DialogTitle>
					<DialogDescription className="line-clamp-1">
						{bookTitle}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="page">Current Page</Label>
							<div className="flex items-center gap-2">
								<Input
									id="page"
									type="number"
									min={0}
									max={pageCount ?? undefined}
									value={page}
									onChange={(e) => setPage(e.target.value)}
									className="flex-1"
								/>
								{pageCount && (
									<span className="whitespace-nowrap text-muted-foreground text-sm">
										of {pageCount}
									</span>
								)}
							</div>
						</div>
						{pageCount && (
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Progress</span>
									<span>{progress}%</span>
								</div>
								<Progress value={progress} />
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={updateProgress.isPending}>
							{updateProgress.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
