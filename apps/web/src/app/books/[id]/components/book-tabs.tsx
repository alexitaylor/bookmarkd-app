"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./tabs/overview-tab";
import { CharactersTab } from "./tabs/characters-tab";
import { NotesTab } from "./tabs/notes-tab";
import { VocabularyTab } from "./tabs/vocabulary-tab";
import { ReviewsTab } from "./tabs/reviews-tab";

interface Author {
	id: number;
	name: string;
}

interface Genre {
	id: number;
	name: string;
}

interface Book {
	id: number;
	title: string;
	subtitle?: string | null;
	synopsis?: string | null;
	coverUrl?: string | null;
	pageCount?: number | null;
	publisher?: string | null;
	language?: string | null;
	datePublished?: string | null;
	isbn?: string | null;
	isbn13?: string | null;
	authors: Author[];
	genres: Genre[];
}

interface BookTabsProps {
	bookId: number;
	book: Book;
	activeTab: string;
	onTabChange: (tab: string) => void;
}

export function BookTabs({ bookId, book, activeTab, onTabChange }: BookTabsProps) {
	return (
		<Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
			<TabsList className="w-full justify-start overflow-x-auto">
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="characters">Characters</TabsTrigger>
				<TabsTrigger value="notes">Notes</TabsTrigger>
				<TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
				<TabsTrigger value="reviews">Reviews</TabsTrigger>
			</TabsList>

			<TabsContent value="overview" className="mt-6">
				<OverviewTab bookId={bookId} book={book} onNavigateToTab={onTabChange} />
			</TabsContent>

			<TabsContent value="characters" className="mt-6">
				<CharactersTab bookId={bookId} />
			</TabsContent>

			<TabsContent value="notes" className="mt-6">
				<NotesTab bookId={bookId} />
			</TabsContent>

			<TabsContent value="vocabulary" className="mt-6">
				<VocabularyTab bookId={bookId} />
			</TabsContent>

			<TabsContent value="reviews" className="mt-6">
				<ReviewsTab bookId={bookId} />
			</TabsContent>
		</Tabs>
	);
}
