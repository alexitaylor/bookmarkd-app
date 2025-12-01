"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CharactersTabProps {
	bookId: number;
}

export function CharactersTab({ bookId }: CharactersTabProps) {
	const { data: characters, isLoading } = useQuery(
		orpc.character.getByBookId.queryOptions({ input: { bookId, limit: 50 } })
	);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-24 w-full rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	if (!characters || characters.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Users className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold">No Characters Yet</h3>
				<p className="text-muted-foreground mt-1">
					Characters for this book haven&apos;t been added yet.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					Characters ({characters.length})
				</h2>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{characters.map((character) => (
					<Card key={character.id} className="hover:bg-accent/50 transition-colors">
						<CardContent className="p-4">
							<h3 className="font-semibold">{character.name}</h3>
							{character.description && (
								<p className="mt-1 text-sm text-muted-foreground line-clamp-3">
									{character.description}
								</p>
							)}
							{character.aiGenerated && (
								<span className="mt-2 inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
									AI Generated
								</span>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
