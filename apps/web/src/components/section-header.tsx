import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
	title: string;
	href?: string;
	linkText?: string;
	className?: string;
}

export function SectionHeader({
	title,
	href,
	linkText = "See all",
	className,
}: SectionHeaderProps) {
	return (
		<div className={cn("flex items-center justify-between", className)}>
			<h2 className="text-xl font-semibold">{title}</h2>
			{href && (
				<Link
					href={href as "/"}
					className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					{linkText}
					<ChevronRight className="h-4 w-4" />
				</Link>
			)}
		</div>
	);
}
