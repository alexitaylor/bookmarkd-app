"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Target, Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export function ReadingChallenge() {
	const [isEditing, setIsEditing] = useState(false);
	const [newGoal, setNewGoal] = useState("");
	const queryClient = useQueryClient();

	const { data: goalData, isLoading } = useQuery(
		orpc.userBook.getReadingGoal.queryOptions(),
	);

	const setGoalMutation = useMutation({
		mutationFn: (goal: number) => orpc.userBook.setReadingGoal.call({ goal }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [["userBook"]] });
			setIsEditing(false);
			setNewGoal("");
		},
	});

	const handleSubmitGoal = (e: React.FormEvent) => {
		e.preventDefault();
		const goal = Number.parseInt(newGoal, 10);
		if (goal > 0 && goal <= 365) {
			setGoalMutation.mutate(goal);
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 font-semibold text-base">
						<Target className="h-4 w-4" />
						Reading Challenge
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-24 animate-pulse rounded-lg bg-muted" />
				</CardContent>
			</Card>
		);
	}

	const goal = goalData?.goal || 0;
	const booksRead = goalData?.booksRead || 0;
	const year = goalData?.year || new Date().getFullYear();
	const progress = goal > 0 ? Math.round((booksRead / goal) * 100) : 0;
	const booksRemaining = Math.max(0, goal - booksRead);

	// Calculate pace
	const now = new Date();
	const startOfYear = new Date(year, 0, 1);
	const endOfYear = new Date(year, 11, 31);
	const daysElapsed = Math.ceil(
		(now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
	);
	const daysInYear = 365;
	const daysRemaining = daysInYear - daysElapsed;

	const expectedBooks =
		goal > 0 ? Math.round((daysElapsed / daysInYear) * goal) : 0;
	const isAheadOfPace = booksRead >= expectedBooks;
	const booksPerDayNeeded =
		booksRemaining > 0 && daysRemaining > 0
			? (booksRemaining / daysRemaining).toFixed(2)
			: "0";

	const hasReachedGoal = goal > 0 && booksRead >= goal;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="flex items-center gap-2 font-semibold text-base">
					{hasReachedGoal ? (
						<Trophy className="h-4 w-4 text-yellow-500" />
					) : (
						<Target className="h-4 w-4" />
					)}
					{year} Reading Challenge
				</CardTitle>
				{goal > 0 && !isEditing && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setNewGoal(goal.toString());
							setIsEditing(true);
						}}
					>
						Edit Goal
					</Button>
				)}
			</CardHeader>
			<CardContent>
				{!goal || isEditing ? (
					<form onSubmit={handleSubmitGoal} className="space-y-4">
						<div>
							<p className="mb-3 text-muted-foreground text-sm">
								{goal
									? "Update your reading goal for the year:"
									: "Set a reading goal for the year:"}
							</p>
							<div className="flex items-center gap-2">
								<Input
									type="number"
									placeholder="Number of books"
									value={newGoal}
									onChange={(e) => setNewGoal(e.target.value)}
									min={1}
									max={365}
									className="w-32"
									autoFocus
								/>
								<span className="text-muted-foreground text-sm">
									books in {year}
								</span>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								type="submit"
								size="sm"
								disabled={
									!newGoal ||
									Number.parseInt(newGoal, 10) < 1 ||
									setGoalMutation.isPending
								}
							>
								{setGoalMutation.isPending ? "Saving..." : "Set Goal"}
							</Button>
							{isEditing && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setIsEditing(false);
										setNewGoal("");
									}}
								>
									Cancel
								</Button>
							)}
						</div>
					</form>
				) : (
					<div className="space-y-4">
						{/* Progress Bar */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium">
									{booksRead} of {goal} books
								</span>
								<span className="text-muted-foreground">{progress}%</span>
							</div>
							<Progress
								value={Math.min(100, progress)}
								className={cn("h-3", hasReachedGoal && "[&>div]:bg-yellow-500")}
							/>
						</div>

						{/* Stats */}
						{hasReachedGoal ? (
							<div className="rounded-lg bg-yellow-500/10 p-3 text-center">
								<Trophy className="mx-auto mb-1 h-6 w-6 text-yellow-500" />
								<p className="font-medium text-yellow-600 dark:text-yellow-400">
									Congratulations! You've reached your goal!
								</p>
								{booksRead > goal && (
									<p className="mt-1 text-muted-foreground text-sm">
										You've read {booksRead - goal} extra{" "}
										{booksRead - goal === 1 ? "book" : "books"}!
									</p>
								)}
							</div>
						) : (
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div className="rounded-lg bg-muted/50 p-3 text-center">
									<p className="font-semibold text-2xl">{booksRemaining}</p>
									<p className="text-muted-foreground">books to go</p>
								</div>
								<div className="rounded-lg bg-muted/50 p-3 text-center">
									<p
										className={cn(
											"font-semibold text-2xl",
											isAheadOfPace ? "text-green-600" : "text-orange-600",
										)}
									>
										{isAheadOfPace ? "+" : "-"}
										{Math.abs(booksRead - expectedBooks)}
									</p>
									<p className="text-muted-foreground">
										{isAheadOfPace ? "ahead of pace" : "behind pace"}
									</p>
								</div>
							</div>
						)}

						{/* Pace Info */}
						{!hasReachedGoal && booksRemaining > 0 && (
							<p className="text-center text-muted-foreground text-xs">
								Read {booksPerDayNeeded} books per day to reach your goal
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
