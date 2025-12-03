"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

interface GenreComboboxProps {
	value: number | null;
	onChange: (value: number | null) => void;
}

export function GenreCombobox({ value, onChange }: GenreComboboxProps) {
	const [open, setOpen] = React.useState(false);

	const { data: allGenres = [], isLoading } = useQuery({
		queryKey: ["genres", "popular"],
		queryFn: () => client.genre.getPopular({ limit: 50 }),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	// Filter out genres with 0 books and sort A-Z
	const genres = allGenres
		.filter((g) => {
			const count =
				typeof g.bookCount === "string"
					? Number.parseInt(g.bookCount, 10)
					: g.bookCount;
			return count > 0;
		})
		.sort((a, b) => a.name.localeCompare(b.name));

	const selectedGenre = genres.find((g) => g.id === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-[180px] justify-between"
					disabled={isLoading}
				>
					<span className="truncate">
						{isLoading
							? "Loading..."
							: selectedGenre
								? selectedGenre.name
								: "All Genres"}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search genre..." />
					<CommandList>
						<CommandEmpty>No genre found.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								value="all-genres"
								onSelect={() => {
									onChange(null);
									setOpen(false);
								}}
							>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										value === null ? "opacity-100" : "opacity-0",
									)}
								/>
								All Genres
							</CommandItem>
							{genres.map((genre) => (
								<CommandItem
									key={genre.id}
									value={genre.name}
									onSelect={() => {
										onChange(genre.id === value ? null : genre.id);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === genre.id ? "opacity-100" : "opacity-0",
										)}
									/>
									{genre.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
