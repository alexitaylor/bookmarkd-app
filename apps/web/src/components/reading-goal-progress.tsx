"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { orpc, client } from "@/utils/orpc";
import { cn } from "@/lib/utils";

interface ReadingGoalProgressProps {
	className?: string;
}

export function ReadingGoalProgress({ className }: ReadingGoalProgressProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [goalInput, setGoalInput] = useState("");
	const queryClient = useQueryClient();

	const { data: goalData, isLoading } = useQuery(
		orpc.userBook.getReadingGoal.queryOptions()
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
		const goal = parseInt(goalInput, 10);
		if (isNaN(goal) || goal < 1 || goal > 365) {
			toast.error("Please enter a valid goal between 1 and 365");
			return;
		}
		setGoalMutation.mutate(goal);
	};

	if (isLoading) {
		return (
			<div className={cn("rounded-lg border p-4 animate-pulse", className)}>
				<div className="h-6 bg-muted rounded w-1/3 mb-4" />
				<div className="h-4 bg-muted rounded w-full mb-2" />
				<div className="h-3 bg-muted rounded w-1/2" />
			</div>
		);
	}

	const hasGoal = goalData?.goal !== null && goalData?.goal !== undefined;
	const progress = hasGoal ? Math.min((goalData.booksRead / goalData.goal!) * 100, 100) : 0;
	const booksRemaining = hasGoal ? Math.max(goalData.goal! - goalData.booksRead, 0) : 0;

	return (
		<div className={cn("rounded-lg border p-4", className)}>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<Target className="h-5 w-5 text-primary" />
					<h3 className="font-semibold">{goalData?.year} Reading Goal</h3>
				</div>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button variant="ghost" size="sm">
							{hasGoal ? "Edit" : <><Plus className="h-4 w-4 mr-1" /> Set Goal</>}
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Set Your Reading Goal</DialogTitle>
							<DialogDescription>
								How many books do you want to read in {new Date().getFullYear()}?
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
					<div className="flex items-baseline gap-2 mb-2">
						<span className="text-3xl font-bold">{goalData.booksRead}</span>
						<span className="text-muted-foreground">of {goalData.goal} books</span>
					</div>
					<Progress value={progress} className="mb-2" />
					<p className="text-sm text-muted-foreground">
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
