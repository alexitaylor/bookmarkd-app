"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

interface WriteReviewDialogProps {
	bookId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WriteReviewDialog({
	bookId,
	open,
	onOpenChange,
}: WriteReviewDialogProps) {
	const [newReview, setNewReview] = useState({ rating: 0, content: "" });
	const [hoverRating, setHoverRating] = useState(0);
	const queryClient = useQueryClient();

	const { data: userReview } = useQuery(
		orpc.review.getUserReview.queryOptions({ input: { bookId } }),
	);

	const createMutation = useMutation({
		mutationFn: (data: { bookId: number; rating: number; content?: string }) =>
			client.review.create(data),
		onSuccess: () => {
			toast.success("Review submitted!");
			queryClient.invalidateQueries({ queryKey: [["review"]] });
			onOpenChange(false);
			setNewReview({ rating: 0, content: "" });
		},
		onError: (error) => {
			toast.error(`Failed to submit review: ${error.message}`);
		},
	});

	const handleSubmitReview = (e: React.FormEvent) => {
		e.preventDefault();
		if (newReview.rating === 0) {
			toast.error("Please select a rating");
			return;
		}
		createMutation.mutate({
			bookId,
			rating: newReview.rating,
			content: newReview.content || undefined,
		});
	};

	const handleSkip = () => {
		onOpenChange(false);
		setNewReview({ rating: 0, content: "" });
	};

	// Don't show if user already has a review
	if (userReview) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Write a Review</DialogTitle>
					<DialogDescription>
						You finished this book! Share your thoughts with others.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmitReview}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Your Rating</Label>
							<div className="flex items-center gap-1">
								{Array.from({ length: 5 }).map((_, i) => {
									const value = i + 1;
									return (
										<button
											key={i}
											type="button"
											onClick={() =>
												setNewReview({ ...newReview, rating: value })
											}
											onMouseEnter={() => setHoverRating(value)}
											onMouseLeave={() => setHoverRating(0)}
											className="p-1"
										>
											<Star
												className={cn(
													"h-8 w-8 transition-colors",
													(hoverRating || newReview.rating) >= value
														? "fill-yellow-400 text-yellow-400"
														: "text-muted-foreground",
												)}
											/>
										</button>
									);
								})}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="content">Review (optional)</Label>
							<Textarea
								id="content"
								placeholder="What did you think of this book?"
								value={newReview.content}
								onChange={(e) =>
									setNewReview({ ...newReview, content: e.target.value })
								}
								rows={4}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={handleSkip}>
							Skip
						</Button>
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? "Submitting..." : "Submit Review"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
