"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	BookmarkPlus,
	BookOpen,
	CheckCircle2,
	XCircle,
	ChevronDown,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { UpdateProgressModal } from "@/components/update-progress-modal";
import { client } from "@/utils/orpc";
import { cn } from "@/lib/utils";

type BookStatus = "WantToRead" | "CurrentlyReading" | "Read" | "DNF" | "None";

interface UserBook {
	id: number;
	bookId: number;
	status: BookStatus;
	currentPage: number;
	rating: number | null;
	startedAt: Date | null;
	finishedAt: Date | null;
}

interface ReadingStatusSectionProps {
	bookId: number;
	pageCount?: number | null;
	userBook: UserBook | null | undefined;
	onStatusChange?: (status: BookStatus) => void;
}

const statusConfig: Record<
	BookStatus,
	{ label: string; icon: React.ElementType; color: string }
> = {
	WantToRead: {
		label: "Want to Read",
		icon: BookmarkPlus,
		color: "text-blue-600 dark:text-blue-400",
	},
	CurrentlyReading: {
		label: "Currently Reading",
		icon: BookOpen,
		color: "text-green-600 dark:text-green-400",
	},
	Read: {
		label: "Read",
		icon: CheckCircle2,
		color: "text-purple-600 dark:text-purple-400",
	},
	DNF: {
		label: "Did Not Finish",
		icon: XCircle,
		color: "text-orange-600 dark:text-orange-400",
	},
	None: {
		label: "Add to Shelf",
		icon: BookmarkPlus,
		color: "",
	},
};

export function ReadingStatusSection({
	bookId,
	pageCount,
	userBook,
	onStatusChange,
}: ReadingStatusSectionProps) {
	const [showProgressModal, setShowProgressModal] = useState(false);
	const queryClient = useQueryClient();

	const currentStatus = userBook?.status || "None";
	const currentPage = userBook?.currentPage || 0;
	const progress =
		pageCount && pageCount > 0
			? Math.round((currentPage / pageCount) * 100)
			: 0;

	// Get progress bar color based on percentage
	const getProgressColor = (percent: number) => {
		if (percent >= 100) return "bg-green-500";
		if (percent >= 75) return "bg-emerald-500";
		if (percent >= 50) return "bg-yellow-500";
		if (percent >= 25) return "bg-orange-500";
		return "bg-red-500";
	};

	const statusMutation = useMutation({
		mutationFn: ({ status, currentPage }: { status: BookStatus; currentPage?: number }) =>
			client.userBook.updateStatus({ bookId, status, currentPage }),
		onSuccess: (_, { status }) => {
			const config = statusConfig[status];
			toast.success(`Book marked as "${config.label}"`);
			// Invalidate all userBook queries to refresh the data
			queryClient.invalidateQueries({ queryKey: [["userBook"]] });
			// Notify parent of status change
			onStatusChange?.(status);
		},
		onError: (error) => {
			toast.error(`Failed to update status: ${error.message}`);
		},
	});

	const removeMutation = useMutation({
		mutationFn: () => client.userBook.remove({ bookId }),
		onSuccess: () => {
			toast.success("Book removed from shelf");
			queryClient.invalidateQueries({ queryKey: [["userBook"]] });
		},
		onError: (error) => {
			toast.error(`Failed to remove book: ${error.message}`);
		},
	});

	const handleStatusChange = (status: BookStatus) => {
		if (status === currentStatus) return;
		// When marking as "Read", set progress to 100% (all pages read)
		// When changing from "Read" to another status, reset progress to 0
		let newCurrentPage: number | undefined;
		if (status === "Read" && pageCount) {
			newCurrentPage = pageCount;
		} else if (currentStatus === "Read") {
			newCurrentPage = 0;
		}
		statusMutation.mutate({ status, currentPage: newCurrentPage });
	};

	const handleRemove = () => {
		removeMutation.mutate();
	};

	const StatusIcon = statusConfig[currentStatus].icon;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-4">
				{/* Status Dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="lg"
							className={cn(
								"min-w-[200px] justify-between",
								currentStatus !== "None" && statusConfig[currentStatus].color
							)}
							disabled={statusMutation.isPending || removeMutation.isPending}
						>
							<span className="flex items-center gap-2">
								<StatusIcon className="h-4 w-4" />
								{statusConfig[currentStatus].label}
							</span>
							<ChevronDown className="h-4 w-4 opacity-50" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[200px]">
						{(
							Object.entries(statusConfig) as [
								BookStatus,
								(typeof statusConfig)[BookStatus]
							][]
						)
							.filter(([status]) => status !== "None")
							.map(([status, config]) => {
								const Icon = config.icon;
								return (
									<DropdownMenuItem
										key={status}
										onClick={() => handleStatusChange(status)}
										className={cn(
											"cursor-pointer",
											currentStatus === status && "bg-accent"
										)}
									>
										<Icon className={cn("mr-2 h-4 w-4", config.color)} />
										{config.label}
									</DropdownMenuItem>
								);
							})}
						{currentStatus !== "None" && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleRemove}
									className="cursor-pointer text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Remove from Shelf
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Update Progress Button */}
				{(currentStatus === "CurrentlyReading" ||
					currentStatus === "Read" ||
					currentStatus === "DNF") && (
					<Button
						variant="outline"
						onClick={() => setShowProgressModal(true)}
					>
						Update Progress
					</Button>
				)}
			</div>

			{/* Progress Bar (only for Currently Reading) */}
			{currentStatus === "CurrentlyReading" && pageCount && (
				<div className="max-w-md space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Reading progress</span>
						<span className="font-medium">{progress}%</span>
					</div>
					<Progress
						value={progress}
						className="h-2"
						indicatorClassName={getProgressColor(progress)}
					/>
					<p className="text-sm text-muted-foreground">
						{currentPage} of {pageCount} pages
					</p>
				</div>
			)}

			{/* Dates */}
			{userBook?.startedAt && (
				<div className="text-sm text-muted-foreground">
					Started:{" "}
					{new Date(userBook.startedAt).toLocaleDateString("en-US", {
						month: "long",
						day: "numeric",
						year: "numeric",
					})}
					{userBook.finishedAt && (
						<>
							{" "}
							| Finished:{" "}
							{new Date(userBook.finishedAt).toLocaleDateString("en-US", {
								month: "long",
								day: "numeric",
								year: "numeric",
							})}
						</>
					)}
				</div>
			)}

			{/* Progress Modal */}
			<UpdateProgressModal
				open={showProgressModal}
				onOpenChange={setShowProgressModal}
				bookId={bookId}
				bookTitle=""
				currentPage={currentPage}
				pageCount={pageCount ?? null}
			/>
		</div>
	);
}
