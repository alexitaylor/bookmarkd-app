"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookText } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { VocabularyList } from "./VocabularyList";
import { VocabularyDetail, VocabularyDetailEmpty } from "./VocabularyDetail";
import { AddVocabularyDialog } from "./AddVocabularyDialog";

interface VocabularyWord {
	id: number;
	bookId: number;
	word: string;
	definition: string | null;
	contextSentence: string | null;
	pageNumber: number | null;
	learned: boolean;
}

interface VocabularyGlossaryProps {
	bookId: number;
}

export function VocabularyGlossary({ bookId }: VocabularyGlossaryProps) {
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

	const { data: vocabulary, isLoading, error } = useQuery(
		orpc.vocabulary.list.queryOptions({ input: { bookId, limit: 100 } })
	);

	// Auto-select first word when loaded
	useEffect(() => {
		if (vocabulary && vocabulary.length > 0 && selectedId === null) {
			setSelectedId(vocabulary[0].id);
		}
	}, [vocabulary, selectedId]);

	// Clear selection if selected word is deleted
	useEffect(() => {
		if (selectedId && vocabulary && !vocabulary.find((w) => w.id === selectedId)) {
			setSelectedId(vocabulary.length > 0 ? vocabulary[0].id : null);
			setIsMobileDetailOpen(false);
		}
	}, [vocabulary, selectedId]);

	const selectedWord = vocabulary?.find((w) => w.id === selectedId) || null;
	const learnedCount = vocabulary?.filter((w) => w.learned).length || 0;
	const totalCount = vocabulary?.length || 0;

	const handleSelect = (id: number) => {
		setSelectedId(id);
		setIsMobileDetailOpen(true);
	};

	const handleBack = () => {
		setIsMobileDetailOpen(false);
	};

	// Handle unauthenticated users
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
				<BookText className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold">Sign in to Track Vocabulary</h3>
				<p className="text-muted-foreground mt-1">
					Vocabulary is private and requires you to be signed in.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="grid md:grid-cols-[300px_1fr] h-[600px] border rounded-lg overflow-hidden">
				<div className="border-r p-3 space-y-3">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-10 w-full" />
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-16 w-full" />
					))}
				</div>
				<div className="p-6 space-y-4 hidden md:block">
					<Skeleton className="h-16 w-16 rounded-full" />
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</div>
			</div>
		);
	}

	if (!vocabulary || vocabulary.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
				<BookText className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold">No Words Yet</h3>
				<p className="text-muted-foreground mt-1 mb-4">
					Start adding new words you encounter while reading.
				</p>
				<Button onClick={() => setIsAddOpen(true)}>Add Word</Button>
				<AddVocabularyDialog
					bookId={bookId}
					open={isAddOpen}
					onOpenChange={setIsAddOpen}
				/>
			</div>
		);
	}

	return (
		<>
			<div className="grid md:grid-cols-[300px_1fr] h-[600px] border rounded-lg overflow-hidden">
				{/* Left Panel - Vocabulary List */}
				<div
					className={`border-r bg-background min-h-0 ${
						isMobileDetailOpen ? "hidden md:flex md:flex-col" : "flex flex-col"
					}`}
				>
					<VocabularyList
						words={vocabulary}
						selectedId={selectedId}
						onSelect={handleSelect}
						onAddWord={() => setIsAddOpen(true)}
						learnedCount={learnedCount}
						totalCount={totalCount}
					/>
				</div>

				{/* Right Panel - Vocabulary Detail */}
				<div
					className={`bg-background ${
						isMobileDetailOpen ? "flex flex-col" : "hidden md:flex md:flex-col"
					}`}
				>
					{selectedWord ? (
						<VocabularyDetail
							word={selectedWord}
							onBack={handleBack}
							showBackButton={isMobileDetailOpen}
						/>
					) : (
						<VocabularyDetailEmpty />
					)}
				</div>
			</div>

			{/* Add Vocabulary Dialog */}
			<AddVocabularyDialog
				bookId={bookId}
				open={isAddOpen}
				onOpenChange={setIsAddOpen}
			/>
		</>
	);
}
