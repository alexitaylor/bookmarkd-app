"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarBook {
	id: number;
	bookId: number;
	title: string;
	coverUrl: string | null;
	pageCount: number | null;
	rating: number | null;
}

export function ReadingCalendar() {
	const today = new Date();
	const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
	const [currentYear, setCurrentYear] = useState(today.getFullYear());

	const { data: calendarData, isLoading } = useQuery(
		orpc.userBook.getReadingCalendar.queryOptions({
			input: { year: currentYear, month: currentMonth },
		}),
	);

	const goToPreviousMonth = () => {
		if (currentMonth === 1) {
			setCurrentMonth(12);
			setCurrentYear(currentYear - 1);
		} else {
			setCurrentMonth(currentMonth - 1);
		}
	};

	const goToNextMonth = () => {
		if (currentMonth === 12) {
			setCurrentMonth(1);
			setCurrentYear(currentYear + 1);
		} else {
			setCurrentMonth(currentMonth + 1);
		}
	};

	const goToToday = () => {
		setCurrentMonth(today.getMonth() + 1);
		setCurrentYear(today.getFullYear());
	};

	// Generate calendar days
	const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
	const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
	const daysInMonth = lastDayOfMonth.getDate();
	const startingDayOfWeek = firstDayOfMonth.getDay();

	const calendarDays: Array<{
		day: number | null;
		dateString: string | null;
		isToday: boolean;
	}> = [];

	// Add empty cells for days before the first day of the month
	for (let i = 0; i < startingDayOfWeek; i++) {
		calendarDays.push({ day: null, dateString: null, isToday: false });
	}

	// Add days of the month
	for (let day = 1; day <= daysInMonth; day++) {
		const dateString = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		const isToday =
			day === today.getDate() &&
			currentMonth === today.getMonth() + 1 &&
			currentYear === today.getFullYear();
		calendarDays.push({ day, dateString, isToday });
	}

	const getBooksForDay = (dateString: string | null): CalendarBook[] => {
		if (!dateString || !calendarData?.booksByDay) return [];
		return calendarData.booksByDay[dateString] || [];
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
				<CardTitle className="flex items-center gap-2 font-semibold text-base">
					<BookOpen className="h-4 w-4" />
					Reading Calendar
				</CardTitle>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={goToToday}>
						Today
					</Button>
					<Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="min-w-[140px] text-center font-medium text-sm">
						{MONTH_NAMES[currentMonth - 1]} {currentYear}
					</span>
					<Button variant="ghost" size="icon" onClick={goToNextMonth}>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="grid grid-cols-7 gap-1">
						{WEEKDAY_NAMES.map((day) => (
							<div
								key={day}
								className="py-2 text-center font-medium text-muted-foreground text-xs"
							>
								{day}
							</div>
						))}
						{Array.from({ length: 35 }).map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
								key={i}
								className="aspect-square animate-pulse rounded bg-muted"
							/>
						))}
					</div>
				) : (
					<>
						{/* Stats */}
						<div className="mb-4 flex items-center gap-4 text-sm">
							<span className="text-muted-foreground">
								Books finished this month:{" "}
								<span className="font-medium text-foreground">
									{calendarData?.totalBooks || 0}
								</span>
							</span>
						</div>

						{/* Calendar Grid */}
						<div className="grid grid-cols-7 gap-1">
							{/* Weekday Headers */}
							{WEEKDAY_NAMES.map((day) => (
								<div
									key={day}
									className="py-2 text-center font-medium text-muted-foreground text-xs"
								>
									{day}
								</div>
							))}

							{/* Calendar Days */}
							{calendarDays.map(({ day, dateString, isToday }, index) => {
								const books = getBooksForDay(dateString);
								const hasBooks = books.length > 0;

								return (
									<Popover key={dateString || `empty-${index}`}>
										<PopoverTrigger asChild>
											<button
												type="button"
												disabled={!day}
												className={cn(
													"relative aspect-square rounded-lg p-1 text-sm transition-colors",
													day && "hover:bg-accent",
													isToday && "ring-2 ring-primary ring-offset-2",
													hasBooks &&
														"bg-primary/10 font-medium text-primary hover:bg-primary/20",
													!day && "cursor-default",
												)}
											>
												{day && (
													<>
														<span className="block">{day}</span>
														{hasBooks && (
															<div className="absolute right-1 bottom-1 flex gap-0.5">
																{books.slice(0, 3).map((book) => (
																	<div
																		key={book.id}
																		className="h-1.5 w-1.5 rounded-full bg-primary"
																	/>
																))}
																{books.length > 3 && (
																	<span className="text-[8px] text-primary">
																		+{books.length - 3}
																	</span>
																)}
															</div>
														)}
													</>
												)}
											</button>
										</PopoverTrigger>
										{hasBooks && (
											<PopoverContent className="w-64" align="start">
												<div className="space-y-2">
													<h4 className="font-medium text-sm">
														Finished on{" "}
														{new Date(dateString!).toLocaleDateString("en-US", {
															month: "short",
															day: "numeric",
														})}
													</h4>
													<div className="space-y-2">
														{books.map((book) => (
															<Link
																key={book.id}
																href={`/books/${book.bookId}`}
																className="flex items-start gap-2 rounded-md p-1 transition-colors hover:bg-accent"
															>
																{book.coverUrl ? (
																	<Image
																		src={book.coverUrl}
																		alt={book.title}
																		width={32}
																		height={48}
																		className="rounded object-cover"
																	/>
																) : (
																	<div className="flex h-12 w-8 items-center justify-center rounded bg-muted">
																		<BookOpen className="h-4 w-4 text-muted-foreground" />
																	</div>
																)}
																<div className="min-w-0 flex-1">
																	<p className="line-clamp-2 font-medium text-sm leading-tight">
																		{book.title}
																	</p>
																	{book.rating && (
																		<div className="mt-0.5 flex items-center gap-0.5">
																			{Array.from({ length: 5 }).map((_, i) => (
																				<Star
																					// biome-ignore lint/suspicious/noArrayIndexKey: static display
																					key={i}
																					className={cn(
																						"h-2.5 w-2.5",
																						i < book.rating!
																							? "fill-yellow-400 text-yellow-400"
																							: "text-muted-foreground/30",
																					)}
																				/>
																			))}
																		</div>
																	)}
																	{book.pageCount && (
																		<p className="text-muted-foreground text-xs">
																			{book.pageCount} pages
																		</p>
																	)}
																</div>
															</Link>
														))}
													</div>
												</div>
											</PopoverContent>
										)}
									</Popover>
								);
							})}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
