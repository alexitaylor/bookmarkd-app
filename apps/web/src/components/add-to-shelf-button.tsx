"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookMarked, BookOpen, CheckCircle, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { client } from "@/utils/orpc";

type BookStatus = "WantToRead" | "CurrentlyReading" | "Read" | "DNF";

interface AddToShelfButtonProps {
	bookId: number;
	currentStatus?: BookStatus | "None" | null;
	size?: "default" | "sm" | "lg" | "icon";
}

const statusOptions: {
	value: BookStatus;
	label: string;
	icon: React.ReactNode;
}[] = [
	{
		value: "WantToRead",
		label: "Want to Read",
		icon: <BookMarked className="h-4 w-4" />,
	},
	{
		value: "CurrentlyReading",
		label: "Currently Reading",
		icon: <BookOpen className="h-4 w-4" />,
	},
	{ value: "Read", label: "Read", icon: <CheckCircle className="h-4 w-4" /> },
	{
		value: "DNF",
		label: "Did Not Finish",
		icon: <XCircle className="h-4 w-4" />,
	},
];

export function AddToShelfButton({
	bookId,
	currentStatus,
	size = "sm",
}: AddToShelfButtonProps) {
	const queryClient = useQueryClient();

	const updateStatus = useMutation({
		mutationFn: async (status: BookStatus) => {
			return client.userBook.updateStatus({ bookId, status });
		},
		onSuccess: (_, status) => {
			toast.success(
				`Book added to "${statusOptions.find((s) => s.value === status)?.label}"`,
			);
			queryClient.invalidateQueries({ queryKey: ["userBook"] });
		},
		onError: (error) => {
			toast.error(`Failed to update shelf: ${error.message}`);
		},
	});

	const currentOption = statusOptions.find((s) => s.value === currentStatus);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={
						currentStatus && currentStatus !== "None" ? "secondary" : "outline"
					}
					size={size}
				>
					{currentOption ? (
						<>
							{currentOption.icon}
							<span className="ml-1 hidden sm:inline">
								{currentOption.label}
							</span>
						</>
					) : (
						<>
							<Plus className="h-4 w-4" />
							<span className="ml-1 hidden sm:inline">Add to Shelf</span>
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{statusOptions.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onClick={() => updateStatus.mutate(option.value)}
						disabled={updateStatus.isPending}
					>
						{option.icon}
						<span className="ml-2">{option.label}</span>
						{currentStatus === option.value && (
							<CheckCircle className="ml-auto h-4 w-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
