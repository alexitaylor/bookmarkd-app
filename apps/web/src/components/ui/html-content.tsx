"use client";

import parse from "html-react-parser";
import { cn } from "@/lib/utils";

interface HtmlContentProps {
	content: string;
	className?: string;
	/** Maximum number of lines to show (uses line-clamp) */
	lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;
}

const lineClampClasses = {
	1: "line-clamp-1",
	2: "line-clamp-2",
	3: "line-clamp-3",
	4: "line-clamp-4",
	5: "line-clamp-5",
	6: "line-clamp-6",
} as const;

/**
 * A component for safely rendering HTML content (like book synopses from ISBNdb).
 * Handles common HTML tags like <b>, <strong>, <i>, <em>, <br>, etc.
 */
export function HtmlContent({
	content,
	className,
	lineClamp,
}: HtmlContentProps) {
	return (
		<div
			className={cn(
				"[&>a]:text-primary [&>a]:underline [&>b]:font-semibold [&>br]:my-2 [&>br]:block [&>em]:italic [&>i]:italic [&>strong]:font-semibold",
				lineClamp && lineClampClasses[lineClamp],
				className,
			)}
		>
			{parse(content)}
		</div>
	);
}
