import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
	value: number | string;
	label: string;
	/** Optional subtitle shown below the label (e.g., book title) */
	subtitle?: string;
	href?: string;
	className?: string;
}

export function StatCard({
	value,
	label,
	subtitle,
	href,
	className,
}: StatCardProps) {
	const content = (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-center transition-colors",
				href && "cursor-pointer hover:bg-accent",
				className,
			)}
		>
			<span className="font-bold text-2xl text-foreground">
				{typeof value === "number" ? value.toLocaleString() : value}
			</span>
			<span className="mt-1 text-muted-foreground text-sm">{label}</span>
			{subtitle && (
				<span className="mt-0.5 line-clamp-1 font-medium text-foreground text-sm">
					{subtitle}
				</span>
			)}
		</div>
	);

	if (href) {
		return <Link href={href as "/"}>{content}</Link>;
	}

	return content;
}
