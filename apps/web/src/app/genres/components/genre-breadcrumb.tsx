"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface GenreParent {
	id: number;
	name: string;
}

interface SelectedGenre {
	name: string;
	parent?: GenreParent | null;
}

interface GenreBreadcrumbProps {
	selectedGenre: SelectedGenre | null | undefined;
	onClearSelection: () => void;
	onSelectGenre: (genreId: number) => void;
}

export function GenreBreadcrumb({
	selectedGenre,
	onClearSelection,
	onSelectGenre,
}: GenreBreadcrumbProps) {
	return (
		<Breadcrumb className="mb-4">
			<BreadcrumbList>
				<BreadcrumbItem>
					{selectedGenre ? (
						<BreadcrumbLink asChild>
							<button type="button" onClick={onClearSelection}>
								Genres
							</button>
						</BreadcrumbLink>
					) : (
						<BreadcrumbPage>Genres</BreadcrumbPage>
					)}
				</BreadcrumbItem>
				{selectedGenre?.parent && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<button
									type="button"
									onClick={() => onSelectGenre(selectedGenre.parent!.id)}
								>
									{selectedGenre.parent.name}
								</button>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</>
				)}
				{selectedGenre && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{selectedGenre.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
