"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	action?: {
		label: string;
		href?: string;
		onClick?: () => void;
	};
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center p-8 text-center">
			<Icon className="mb-4 h-16 w-16 text-muted-foreground/50" />
			<h3 className="font-medium text-lg text-muted-foreground">{title}</h3>
			<p className="mt-1 max-w-sm text-muted-foreground text-sm">
				{description}
			</p>
			{action && (
				<div className="mt-4">
					{action.href ? (
						<Button asChild>
							<Link href={action.href}>{action.label}</Link>
						</Button>
					) : (
						<Button onClick={action.onClick}>{action.label}</Button>
					)}
				</div>
			)}
		</div>
	);
}
