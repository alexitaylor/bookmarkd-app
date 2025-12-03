"use client";

import { useQuery } from "@tanstack/react-query";
import {
	BookmarkPlus,
	BookOpen,
	CheckCircle2,
	Library,
	XCircle,
} from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { ReadingGoalProgress } from "@/components/reading-goal-progress";
import { ReadingStats } from "@/components/reading-stats";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { ShelfGrid } from "./components";

const tabOptions = ["want", "current", "read", "dnf"] as const;
type TabOption = (typeof tabOptions)[number];

// Map tab option to API status
const tabToStatus: Record<
	TabOption,
	"WantToRead" | "CurrentlyReading" | "Read" | "DNF"
> = {
	want: "WantToRead",
	current: "CurrentlyReading",
	read: "Read",
	dnf: "DNF",
};

const tabConfig: Record<
	TabOption,
	{ label: string; shortLabel: string; icon: React.ElementType; color: string }
> = {
	want: {
		label: "Want to Read",
		shortLabel: "Want",
		icon: BookmarkPlus,
		color: "text-blue-600 dark:text-blue-400",
	},
	current: {
		label: "Currently Reading",
		shortLabel: "Reading",
		icon: BookOpen,
		color: "text-green-600 dark:text-green-400",
	},
	read: {
		label: "Read",
		shortLabel: "Read",
		icon: CheckCircle2,
		color: "text-purple-600 dark:text-purple-400",
	},
	dnf: {
		label: "Did Not Finish",
		shortLabel: "DNF",
		icon: XCircle,
		color: "text-red-600 dark:text-red-400",
	},
};

export default function ShelvesPage() {
	const [activeTab, setActiveTab] = useQueryState(
		"tab",
		parseAsStringLiteral(tabOptions).withDefault("want"),
	);

	// Fetch counts for all tabs (lightweight query)
	const { data: shelfCounts, isLoading: isLoadingCounts } = useQuery(
		orpc.userBook.getShelfCounts.queryOptions(),
	);

	// Fetch books only for the active tab
	const { data: books, isLoading: isLoadingBooks } = useQuery(
		orpc.userBook.getShelfBooks.queryOptions({
			input: { status: tabToStatus[activeTab] },
		}),
	);

	const counts = {
		want: shelfCounts?.wantToRead ?? 0,
		current: shelfCounts?.currentlyReading ?? 0,
		read: shelfCounts?.read ?? 0,
		dnf: shelfCounts?.dnf ?? 0,
	};

	const isLoading = isLoadingCounts || isLoadingBooks;

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Header */}
			<div className="mb-6">
				<h1 className="flex items-center gap-3 font-bold text-3xl">
					<Library className="h-8 w-8" />
					Your Shelves
				</h1>
				<p className="mt-2 text-muted-foreground">
					Track what you're reading and what's next
				</p>
			</div>

			{/* Reading Goal & Stats */}
			<div className="mb-8 space-y-6">
				<ReadingGoalProgress />
				<ReadingStats />
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as TabOption)}
				className="w-full"
			>
				<TabsList className="mb-6 grid w-full grid-cols-4 lg:inline-flex lg:w-auto">
					{tabOptions.map((tab) => {
						const config = tabConfig[tab];
						const Icon = config.icon;
						const count = counts[tab];

						return (
							<TabsTrigger
								key={tab}
								value={tab}
								className="flex items-center gap-2"
							>
								<Icon
									className={cn("h-4 w-4", activeTab === tab && config.color)}
								/>
								<span className="hidden sm:inline">{config.label}</span>
								<span className="sm:hidden">{config.shortLabel}</span>
								{isLoading ? (
									<Skeleton className="h-5 w-6 rounded-full" />
								) : (
									<Badge
										variant="secondary"
										className={cn(
											"ml-1 h-5 min-w-[1.5rem] px-1.5 text-xs",
											activeTab === tab && "bg-primary/10",
										)}
									>
										{count}
									</Badge>
								)}
							</TabsTrigger>
						);
					})}
				</TabsList>

				{/* Single ShelfGrid that shows books for the active tab */}
				<ShelfGrid
					books={books ?? []}
					isLoading={isLoadingBooks}
					shelfType={activeTab}
				/>
			</Tabs>
		</div>
	);
}
