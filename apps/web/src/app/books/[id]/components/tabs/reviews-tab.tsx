"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

interface ReviewsTabProps {
	bookId: number;
}

export function ReviewsTab({ bookId }: ReviewsTabProps) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [newReview, setNewReview] = useState({ rating: 0, content: "" });
	const [hoverRating, setHoverRating] = useState(0);
	const queryClient = useQueryClient();

	const { data: reviews, isLoading } = useQuery(
		orpc.review.list.queryOptions({ input: { bookId, limit: 50 } }),
	);

	const { data: userReview } = useQuery(
		orpc.review.getUserReview.queryOptions({ input: { bookId } }),
	);

	const { data: reviewStats } = useQuery(
		orpc.review.getStats.queryOptions({ input: { bookId } }),
	);

	const createMutation = useMutation({
		mutationFn: (data: { bookId: number; rating: number; content?: string }) =>
			client.review.create(data),
		onSuccess: () => {
			toast.success("Review submitted!");
			queryClient.invalidateQueries({ queryKey: [["review"]] });
			setIsAddOpen(false);
			setNewReview({ rating: 0, content: "" });
		},
		onError: (error) => {
			toast.error(`Failed to submit review: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => client.review.delete({ id }),
		onSuccess: () => {
			toast.success("Review deleted");
			queryClient.invalidateQueries({ queryKey: [["review"]] });
		},
		onError: (error) => {
			toast.error(`Failed to delete review: ${error.message}`);
		},
	});

	const voteMutation = useMutation({
		mutationFn: ({ reviewId, value }: { reviewId: number; value: 1 | -1 }) =>
			client.review.vote({ reviewId, value }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [["review"]] });
		},
		onError: (error) => {
			toast.error(`Failed to vote: ${error.message}`);
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

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-32 w-full rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats & Add Review */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="font-semibold text-xl">
						Reviews{" "}
						{reviewStats && reviewStats.count > 0 && `(${reviewStats.count})`}
					</h2>
					{reviewStats && reviewStats.count > 0 && (
						<div className="mt-1 flex items-center gap-2">
							<div className="flex items-center">
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										className={`h-4 w-4 ${
											i < Math.round(reviewStats.avgRating)
												? "fill-yellow-400 text-yellow-400"
												: "text-muted-foreground"
										}`}
									/>
								))}
							</div>
							<span className="text-muted-foreground text-sm">
								{reviewStats.avgRating.toFixed(1)} average
							</span>
						</div>
					)}
				</div>

				{!userReview && (
					<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
						<DialogTrigger asChild>
							<Button>Write a Review</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Write a Review</DialogTitle>
								<DialogDescription>
									Share your thoughts about this book.
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
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsAddOpen(false)}
									>
										Cancel
									</Button>
									<Button type="submit" disabled={createMutation.isPending}>
										{createMutation.isPending
											? "Submitting..."
											: "Submit Review"}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{/* User's Review */}
			{userReview && (
				<Card className="border-primary">
					<CardContent className="p-4">
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1 space-y-2">
								<div className="flex items-center gap-2">
									<span className="font-medium text-sm">Your Review</span>
									<div className="flex items-center">
										{Array.from({ length: 5 }).map((_, i) => (
											<Star
												key={i}
												className={`h-4 w-4 ${
													i < userReview.rating
														? "fill-yellow-400 text-yellow-400"
														: "text-muted-foreground"
												}`}
											/>
										))}
									</div>
								</div>
								{userReview.content && (
									<p className="text-muted-foreground">{userReview.content}</p>
								)}
							</div>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="ghost" size="icon">
										<Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Review</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete your review? This action
											cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => deleteMutation.mutate(userReview.id)}
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
			)}

			{/* All Reviews */}
			{!reviews || reviews.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Star className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="font-semibold text-lg">No Reviews Yet</h3>
					<p className="mt-1 text-muted-foreground">
						Be the first to share your thoughts!
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{reviews
						.filter((r) => !userReview || r.id !== userReview.id)
						.map((review) => (
							<Card key={review.id}>
								<CardContent className="p-4">
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<AvatarImage src={review.userImage || undefined} />
												<AvatarFallback>
													{review.userName?.charAt(0).toUpperCase() || "U"}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<span className="font-medium">{review.userName}</span>
													<div className="flex items-center">
														{Array.from({ length: 5 }).map((_, i) => (
															<Star
																key={i}
																className={`h-3 w-3 ${
																	i < review.rating
																		? "fill-yellow-400 text-yellow-400"
																		: "text-muted-foreground"
																}`}
															/>
														))}
													</div>
												</div>
												<span className="text-muted-foreground text-xs">
													{new Date(review.createdAt).toLocaleDateString(
														"en-US",
														{
															month: "short",
															day: "numeric",
															year: "numeric",
														},
													)}
												</span>
											</div>
										</div>

										{review.content && (
											<p className="text-muted-foreground">{review.content}</p>
										)}

										{/* Vote buttons */}
										<div className="flex items-center gap-4 pt-2">
											<button
												onClick={() =>
													voteMutation.mutate({ reviewId: review.id, value: 1 })
												}
												className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
											>
												<ThumbsUp className="h-4 w-4" />
												<span>{review.votes?.helpful || 0}</span>
											</button>
											<button
												onClick={() =>
													voteMutation.mutate({
														reviewId: review.id,
														value: -1,
													})
												}
												className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
											>
												<ThumbsDown className="h-4 w-4" />
												<span>{review.votes?.notHelpful || 0}</span>
											</button>
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
