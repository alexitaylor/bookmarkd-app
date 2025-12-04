import { ChevronRight } from "lucide-react";
import Link from "next/link";
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
			<h2 className="font-semibold text-xl">{title}</h2>
			{href && (
				<Link
					href={href as "/"}
					className="flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					{linkText}
					<ChevronRight className="h-4 w-4" />
				</Link>
			)}
		</div>
	);
}
