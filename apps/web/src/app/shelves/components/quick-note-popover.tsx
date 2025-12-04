"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface QuickNotePopoverProps {
	bookId: number;
	disabled?: boolean;
	compact?: boolean;
}

export function QuickNotePopover({
	bookId,
	disabled = false,
	compact = false,
}: QuickNotePopoverProps) {
	const [open, setOpen] = useState(false);
	const [content, setContent] = useState("");
	const [pageNumber, setPageNumber] = useState<string>("");
	const queryClient = useQueryClient();

	const createNoteMutation = useMutation({
		mutationFn: (data: { content: string; pageNumber?: number }) =>
			orpc.note.create.call({
				bookId,
				content: data.content,
				pageNumber: data.pageNumber,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [["note"]] });
			setContent("");
			setPageNumber("");
			setOpen(false);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;

		createNoteMutation.mutate({
			content: content.trim(),
			pageNumber: pageNumber ? Number.parseInt(pageNumber, 10) : undefined,
		});
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					disabled={disabled}
					onClick={(e) => e.stopPropagation()}
					className={cn(
						"text-muted-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-50",
						compact ? "p-0.5" : "p-1",
					)}
					title="Add quick note"
				>
					<StickyNote className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-80"
				onClick={(e) => e.stopPropagation()}
				align="center"
			>
				<form onSubmit={handleSubmit} className="space-y-3">
					<div className="space-y-2">
						<h4 className="font-medium text-sm">Quick Note</h4>
						<Textarea
							placeholder="Write a note..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="min-h-[80px] resize-none"
							autoFocus
						/>
					</div>
					<div className="flex items-center gap-2">
						<input
							type="number"
							placeholder="Page #"
							value={pageNumber}
							onChange={(e) => setPageNumber(e.target.value)}
							className="h-8 w-20 rounded-md border bg-background px-2 text-sm"
							min={1}
						/>
						<div className="flex-1" />
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={!content.trim() || createNoteMutation.isPending}
						>
							{createNoteMutation.isPending ? "Saving..." : "Save"}
						</Button>
					</div>
				</form>
			</PopoverContent>
		</Popover>
	);
}
