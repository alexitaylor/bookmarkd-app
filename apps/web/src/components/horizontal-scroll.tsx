import { cn } from "@/lib/utils";

interface HorizontalScrollProps {
	children: React.ReactNode;
	className?: string;
}

export function HorizontalScroll({
	children,
	className,
}: HorizontalScrollProps) {
	return (
		<div
			className={cn(
				"scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex items-stretch gap-4 overflow-x-auto pb-4",
				"-mx-4 sm:-mx-0 px-4 sm:px-0",
				className,
			)}
		>
			{children}
		</div>
	);
}
