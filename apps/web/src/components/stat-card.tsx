import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
	value: number | string;
	label: string;
	href?: string;
	className?: string;
}

export function StatCard({ value, label, href, className }: StatCardProps) {
	const content = (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-center transition-colors",
				href && "hover:bg-accent cursor-pointer",
				className,
			)}
		>
			<span className="text-3xl font-bold text-foreground">
				{typeof value === "number" ? value.toLocaleString() : value}
			</span>
			<span className="mt-1 text-sm text-muted-foreground">{label}</span>
		</div>
	);

	if (href) {
		return <Link href={href as "/"}>{content}</Link>;
	}

	return content;
}
