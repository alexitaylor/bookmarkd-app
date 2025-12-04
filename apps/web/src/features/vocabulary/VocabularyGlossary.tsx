"use client";

import { useQuery } from "@tanstack/react-query";
import { BookText } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";
import { AddVocabularyDialog } from "./AddVocabularyDialog";
import { VocabularyDetail, VocabularyDetailEmpty } from "./VocabularyDetail";
import { VocabularyList } from "./VocabularyList";

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

	const {
		data: vocabulary,
		isLoading,
		error,
	} = useQuery(
		orpc.vocabulary.list.queryOptions({ input: { bookId, limit: 100 } }),
	);

	// Auto-select first word when loaded
	useEffect(() => {
		if (vocabulary && vocabulary.length > 0 && selectedId === null) {
			setSelectedId(vocabulary[0].id);
		}
	}, [vocabulary, selectedId]);

	// Clear selection if selected word is deleted
	useEffect(() => {
		if (
			selectedId &&
			vocabulary &&
			!vocabulary.find((w) => w.id === selectedId)
		) {
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
			<div className="flex flex-col items-center justify-center rounded-lg border py-12 text-center">
				<BookText className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-semibold text-lg">Sign in to Track Vocabulary</h3>
				<p className="mt-1 text-muted-foreground">
					Vocabulary is private and requires you to be signed in.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="grid h-[600px] overflow-hidden rounded-lg border md:grid-cols-[300px_1fr]">
				<div className="space-y-3 border-r p-3">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-10 w-full" />
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-16 w-full" />
					))}
				</div>
				<div className="hidden space-y-4 p-6 md:block">
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
			<div className="flex flex-col items-center justify-center rounded-lg border py-12 text-center">
				<BookText className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-semibold text-lg">No Words Yet</h3>
				<p className="mt-1 mb-4 text-muted-foreground">
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
			<div className="grid h-[600px] overflow-hidden rounded-lg border md:grid-cols-[300px_1fr]">
				{/* Left Panel - Vocabulary List */}
				<div
					className={`min-h-0 border-r bg-background ${
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
