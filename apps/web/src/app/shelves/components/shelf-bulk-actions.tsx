"use client";

import { CheckSquare, FileJson, FileSpreadsheet, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShelfBulkActionsProps {
	selectedCount: number;
	totalCount: number;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onExportCSV: () => void;
	onExportJSON: () => void;
}

export function ShelfBulkActions({
	selectedCount,
	totalCount,
	onSelectAll,
	onDeselectAll,
	onExportCSV,
	onExportJSON,
}: ShelfBulkActionsProps) {
	const allSelected = selectedCount === totalCount;

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={allSelected ? onDeselectAll : onSelectAll}
					className="h-8"
				>
					{allSelected ? (
						<>
							<Square className="mr-1.5 h-4 w-4" />
							Deselect All
						</>
					) : (
						<>
							<CheckSquare className="mr-1.5 h-4 w-4" />
							Select All
						</>
					)}
				</Button>
			</div>

			<div className="h-6 w-px bg-border" />

			<span className="text-muted-foreground text-sm">
				{selectedCount} selected
			</span>

			{selectedCount > 0 && (
				<>
					<div className="h-6 w-px bg-border" />

					<div className="flex items-center gap-1">
						<span className="text-muted-foreground text-sm">Export:</span>
						<Button
							variant="outline"
							size="sm"
							onClick={onExportCSV}
							className="h-8"
						>
							<FileSpreadsheet className="mr-1.5 h-4 w-4" />
							CSV
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onExportJSON}
							className="h-8"
						>
							<FileJson className="mr-1.5 h-4 w-4" />
							JSON
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
