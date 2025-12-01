"use client";

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
import { client } from "@/utils/orpc";
import { cn } from "@/lib/utils";

type BookStatus = "WantToRead" | "CurrentlyReading" | "Read" | "DNF" | "None";

interface BookStatusDropdownProps {
	bookId: number;
	pageCount?: number | null;
	currentStatus?: BookStatus;
	/** Compact mode for book cards - shows just an icon button */
	compact?: boolean;
}

const statusConfig: Record<
	BookStatus,
	{ label: string; shortLabel: string; icon: React.ElementType; color: string }
> = {
	WantToRead: {
		label: "Want to Read",
		shortLabel: "Want",
		icon: BookmarkPlus,
		color: "text-blue-600 dark:text-blue-400",
	},
	CurrentlyReading: {
		label: "Currently Reading",
		shortLabel: "Reading",
		icon: BookOpen,
		color: "text-green-600 dark:text-green-400",
	},
	Read: {
		label: "Read",
		shortLabel: "Read",
		icon: CheckCircle2,
		color: "text-purple-600 dark:text-purple-400",
	},
	DNF: {
		label: "Did Not Finish",
		shortLabel: "DNF",
		icon: XCircle,
		color: "text-orange-600 dark:text-orange-400",
	},
	None: {
		label: "Add to Shelf",
		shortLabel: "Add",
		icon: BookmarkPlus,
		color: "",
	},
};

export function BookStatusDropdown({
	bookId,
	pageCount,
	currentStatus = "None",
	compact = false,
}: BookStatusDropdownProps) {
	const queryClient = useQueryClient();

	const statusMutation = useMutation({
		mutationFn: ({
			status,
			currentPage,
		}: {
			status: BookStatus;
			currentPage?: number;
		}) => client.userBook.updateStatus({ bookId, status, currentPage }),
		onSuccess: (_, { status }) => {
			const config = statusConfig[status];
			toast.success(`Book marked as "${config.label}"`);
			// Invalidate all userBook queries to refresh the data
			queryClient.invalidateQueries({ queryKey: [["userBook"]] });
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

	const handleRemove = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		removeMutation.mutate();
	};

	const StatusIcon = statusConfig[currentStatus].icon;
	const isPending = statusMutation.isPending || removeMutation.isPending;

	if (compact) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant={currentStatus === "None" ? "outline" : "secondary"}
						size="sm"
						className={cn(
							"h-8 gap-1 px-2",
							currentStatus !== "None" && statusConfig[currentStatus].color
						)}
						disabled={isPending}
						onClick={(e) => e.preventDefault()}
					>
						<StatusIcon className="h-3.5 w-3.5" />
						<span className="text-xs">
							{statusConfig[currentStatus].shortLabel}
						</span>
						<ChevronDown className="h-3 w-3 opacity-50" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[180px]">
					{(
						Object.entries(statusConfig) as [
							BookStatus,
							(typeof statusConfig)[BookStatus],
						][]
					)
						.filter(([status]) => status !== "None")
						.map(([status, config]) => {
							const Icon = config.icon;
							return (
								<DropdownMenuItem
									key={status}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handleStatusChange(status);
									}}
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
		);
	}

	// Full-size version (similar to the book detail page)
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="lg"
					className={cn(
						"min-w-[200px] justify-between",
						currentStatus !== "None" && statusConfig[currentStatus].color
					)}
					disabled={isPending}
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
						(typeof statusConfig)[BookStatus],
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
	);
}
