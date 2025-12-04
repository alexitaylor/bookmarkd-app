"use client";

import { Check, Copy, Facebook, Share2, Twitter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShelfBook {
	bookTitle: string;
	bookAuthors: string | null;
	rating: number | null;
}

interface ShareShelfDialogProps {
	shelfType: "want" | "current" | "read" | "dnf";
	books: ShelfBook[];
	booksCount: number;
}

const shelfNames = {
	want: "Want to Read",
	current: "Currently Reading",
	read: "Read",
	dnf: "Did Not Finish",
};

export function ShareShelfDialog({
	shelfType,
	books,
	booksCount,
}: ShareShelfDialogProps) {
	const [copied, setCopied] = useState(false);
	const [open, setOpen] = useState(false);

	// For now, we'll create a shareable text since we don't have public profiles
	// In a real app, this would link to a public profile page
	const shelfName = shelfNames[shelfType];
	const topBooks = books.slice(0, 5);

	// Create share text
	const shareText = `My "${shelfName}" shelf (${booksCount} books):\n${topBooks.map((b) => `- ${b.bookTitle}${b.bookAuthors ? ` by ${b.bookAuthors}` : ""}${b.rating ? ` (${b.rating}/5)` : ""}`).join("\n")}${booksCount > 5 ? `\n...and ${booksCount - 5} more!` : ""}\n\nTrack your reading at Bookmarkd`;

	// Placeholder share URL (would be a real URL in production)
	const shareUrl = typeof window !== "undefined" ? window.location.href : "";

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleCopyText = async () => {
		try {
			await navigator.clipboard.writeText(shareText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const shareToTwitter = () => {
		const text = encodeURIComponent(
			`My "${shelfName}" shelf has ${booksCount} books! Check out what I'm reading.`,
		);
		window.open(
			`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`,
			"_blank",
		);
	};

	const shareToFacebook = () => {
		window.open(
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
			"_blank",
		);
	};

	const handleNativeShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: `My ${shelfName} Shelf`,
					text: `Check out my ${shelfName} shelf with ${booksCount} books!`,
					url: shareUrl,
				});
			} catch (err) {
				// User cancelled or error
			}
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Share2 className="mr-1.5 h-4 w-4" />
					Share
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share Your Shelf</DialogTitle>
					<DialogDescription>
						Share your "{shelfName}" shelf with {booksCount} books
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Copy Link */}
					<div className="space-y-2">
						<label htmlFor="share-link" className="font-medium text-sm">
							Share Link
						</label>
						<div className="flex gap-2">
							<Input
								id="share-link"
								value={shareUrl}
								readOnly
								className="flex-1"
							/>
							<Button size="icon" variant="outline" onClick={handleCopyLink}>
								{copied ? (
									<Check className="h-4 w-4 text-green-500" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					{/* Preview of what will be shared */}
					<div className="space-y-2">
						<p className="font-medium text-sm">Preview</p>
						<div className="max-h-40 overflow-auto rounded-lg border bg-muted/50 p-3 text-sm">
							<p className="whitespace-pre-wrap text-muted-foreground">
								{shareText}
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopyText}
							className="w-full"
						>
							<Copy className="mr-1.5 h-4 w-4" />
							Copy Text
						</Button>
					</div>

					{/* Social Share Buttons */}
					<div className="space-y-2">
						<p className="font-medium text-sm">Share to</p>
						<div className="flex gap-2">
							{typeof navigator !== "undefined" && "share" in navigator && (
								<Button
									variant="outline"
									onClick={handleNativeShare}
									className="flex-1"
								>
									<Share2 className="mr-1.5 h-4 w-4" />
									Share
								</Button>
							)}
							<Button
								variant="outline"
								onClick={shareToTwitter}
								className="flex-1"
							>
								<Twitter className="mr-1.5 h-4 w-4" />
								Twitter
							</Button>
							<Button
								variant="outline"
								onClick={shareToFacebook}
								className="flex-1"
							>
								<Facebook className="mr-1.5 h-4 w-4" />
								Facebook
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
