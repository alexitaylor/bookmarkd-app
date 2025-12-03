"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Target } from "lucide-react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

interface ReadingGoalProgressProps {
	className?: string;
}

export function ReadingGoalProgress({ className }: ReadingGoalProgressProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [goalInput, setGoalInput] = useState("");
	const queryClient = useQueryClient();

	const { data: goalData, isLoading } = useQuery(
		orpc.userBook.getReadingGoal.queryOptions(),
	);

	const setGoalMutation = useMutation({
		mutationFn: (goal: number) => client.userBook.setReadingGoal({ goal }),
		onSuccess: () => {
			toast.success("Reading goal set!");
			// Invalidate all userBook queries to refresh the reading goal data
			queryClient.invalidateQueries({ queryKey: [["userBook"]] });
			setIsOpen(false);
			setGoalInput("");
		},
		onError: (error) => {
			toast.error(`Failed to set goal: ${error.message}`);
		},
	});

	const handleSetGoal = (e: React.FormEvent) => {
		e.preventDefault();
		const goal = Number.parseInt(goalInput, 10);
		if (isNaN(goal) || goal < 1 || goal > 365) {
			toast.error("Please enter a valid goal between 1 and 365");
			return;
		}
		setGoalMutation.mutate(goal);
	};

	if (isLoading) {
		return (
			<div className={cn("animate-pulse rounded-lg border p-4", className)}>
				<div className="mb-4 h-6 w-1/3 rounded bg-muted" />
				<div className="mb-2 h-4 w-full rounded bg-muted" />
				<div className="h-3 w-1/2 rounded bg-muted" />
			</div>
		);
	}

	const hasGoal = goalData?.goal !== null && goalData?.goal !== undefined;
	const progress = hasGoal
		? Math.min((goalData.booksRead / goalData.goal!) * 100, 100)
		: 0;
	const booksRemaining = hasGoal
		? Math.max(goalData.goal! - goalData.booksRead, 0)
		: 0;

	return (
		<div className={cn("rounded-lg border p-4", className)}>
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Target className="h-5 w-5 text-primary" />
					<h3 className="font-semibold">{goalData?.year} Reading Goal</h3>
				</div>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button variant="ghost" size="sm">
							{hasGoal ? (
								"Edit"
							) : (
								<>
									<Plus className="mr-1 h-4 w-4" /> Set Goal
								</>
							)}
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Set Your Reading Goal</DialogTitle>
							<DialogDescription>
								How many books do you want to read in {new Date().getFullYear()}
								?
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSetGoal}>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="goal">Number of books</Label>
									<Input
										id="goal"
										type="number"
										min={1}
										max={365}
										placeholder="e.g., 24"
										value={goalInput}
										onChange={(e) => setGoalInput(e.target.value)}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={setGoalMutation.isPending}>
									{setGoalMutation.isPending ? "Saving..." : "Set Goal"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{hasGoal ? (
				<>
					<div className="mb-2 flex items-baseline gap-2">
						<span className="font-bold text-3xl">{goalData.booksRead}</span>
						<span className="text-muted-foreground">
							of {goalData.goal} books
						</span>
					</div>
					<Progress
					value={progress}
					className="mb-2"
					indicatorClassName="bg-blue-600 dark:bg-blue-500"
				/>
					<p className="text-muted-foreground text-sm">
						{booksRemaining === 0
							? "🎉 Congratulations! You've reached your goal!"
							: `${booksRemaining} more book${booksRemaining !== 1 ? "s" : ""} to go`}
					</p>
				</>
			) : (
				<p className="text-muted-foreground text-sm">
					Set a reading goal to track your progress throughout the year.
				</p>
			)}
		</div>
	);
}
