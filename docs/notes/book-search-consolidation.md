# Book Search Consolidation - Technical Overview

## Current State

We have two separate search implementations:

1. **SearchBar** (`apps/web/src/components/search-bar.tsx`) - Used on the home page
2. **BookSearch** (`apps/web/src/components/search/book-search.tsx`) - Used in the navbar

Both components share significant functionality but have different UIs and some feature gaps.

---

## Component Analysis

### SearchBar (Home Page)

**Location:** `apps/web/src/components/search-bar.tsx`

**UI/UX:**

- Inline search input field
- Results appear in a dropdown panel below the input
- Grid layout using `BookCard` components (3-6 columns responsive)
- Click outside to close
- Clear button (X) in input field
- No fixed height (causes layout shift during search)

**Features:**
| Feature | Status |
|---------|--------|
| Debounced search (300ms) | Yes |
| Local DB search | Yes |
| External ISBNdb search | Yes |
| Add external book to library | Yes |
| View book link after adding | Yes |
| Duplicate filtering (local vs external) | Yes |
| Add to Shelf dropdown | **No** |
| Load More pagination | **No** |
| User shelf status display | **No** |
| Keyboard hints | **No** |

**Code Structure:**

- Self-contained component with all logic inline
- Uses `useDebounce` hook (defined locally)
- Manages own state for query, external results visibility, added books

---

### BookSearch (Nav Dialog)

**Location:** `apps/web/src/components/search/book-search.tsx`

**UI/UX:**

- Full dialog/modal overlay
- List layout (rows with cover, title, author, metadata)
- Fixed height (60vh) prevents flickering
- Auto-focus input on open
- ESC to close with keyboard hint in footer
- Larger external book cards with more metadata

**Features:**
| Feature | Status |
|---------|--------|
| Debounced search (300ms) | Yes |
| Local DB search | Yes |
| External ISBNdb search | Yes |
| Add external book to library | Yes |
| View book link after adding | Yes |
| Duplicate filtering (local vs external) | Yes |
| Add to Shelf dropdown | **Yes** (BookStatusDropdown) |
| Load More pagination | **Yes** |
| User shelf status display | **Yes** |
| Keyboard hints | **Yes** |

**Code Structure:**

- Self-contained component with all logic inline
- Uses `useDebounce` hook (defined locally)
- Uses `BookStatusDropdown` for shelf management
- Has `ExternalBooksList` sub-component

---

## Feature Comparison Matrix

| Feature             | SearchBar | BookSearch | Target               |
| ------------------- | --------- | ---------- | -------------------- |
| Debounced search    | Yes       | Yes        | Shared               |
| Local search        | Yes       | Yes        | Shared               |
| External search     | Yes       | Yes        | Shared               |
| Add external book   | Yes       | Yes        | Shared               |
| Post-add link       | Yes       | Yes        | Shared               |
| Duplicate filtering | Yes       | Yes        | Shared               |
| BookStatusDropdown  | No        | Yes        | **Add to SearchBar** |
| Load More           | No        | Yes        | **Add to SearchBar** |
| User status fetch   | No        | Yes        | **Add to SearchBar** |
| Grid layout         | Yes       | No         | Keep for dropdown    |
| List layout         | No        | Yes        | Keep for dialog      |
| Fixed height        | No        | Yes        | Keep for dialog      |
| Keyboard hints      | No        | Yes        | Keep for dialog      |

---

## Proposed Architecture (Composition Pattern)

### New File Structure

```
apps/web/src/components/search/
├── hooks/
│   └── use-book-search.ts       # Shared search logic hook
├── book-search-input.tsx        # Reusable search input
├── book-search-results.tsx      # Results display (grid/list layouts)
├── external-books-list.tsx      # External catalog results
├── book-search-dialog.tsx       # Dialog variant (for nav)
├── book-search-dropdown.tsx     # Dropdown variant (for home)
└── index.ts                     # Public exports
```

---

## Implementation Plan

### Phase 1: Create Shared Hook

**File:** `hooks/use-book-search.ts`

Extract all search logic into a reusable hook:

```ts
interface UseBookSearchOptions {
  initialLocalLimit?: number;
  initialExternalLimit?: number;
  enabled?: boolean;
}

interface UseBookSearchReturn {
  // State
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
  showExternalResults: boolean;
  addedBooks: Map<string, { id: number; pageCount: number | null }>;
  localLimit: number;
  externalLimit: number;

  // Query results
  localResults: LocalBook[];
  externalBooks: ExternalBook[];
  statusMap: Record<number, { status: string; currentPage: number }> | undefined;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isLoadingExternal: boolean;

  // Derived state
  shouldSearch: boolean;
  hasLocalResults: boolean;
  hasMoreLocal: boolean;
  hasMoreExternal: boolean;

  // Actions
  handleSearchOnline: () => void;
  handleLoadMoreLocal: () => void;
  handleLoadMoreExternal: () => void;
  handleAddExternalBook: (book: ExternalBook) => void;
  getAddedBookInfo: (book: ExternalBook) => { id: number; pageCount: number | null } | null;
  reset: () => void;
}
```

**Responsibilities:**

- Query state management
- Debouncing
- Local search query (react-query)
- External search query (react-query, manual trigger)
- User status fetching for book IDs
- Add book mutation
- Pagination state
- Duplicate filtering logic
- All action handlers

---

### Phase 2: Create BookSearchInput Component

**File:** `book-search-input.tsx`

Reusable search input with consistent styling:

```ts
interface BookSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}
```

**Features:**

- Search icon
- Input field
- Loading spinner
- Clear button (optional)
- Consistent styling across variants

---

### Phase 3: Create BookSearchResults Component

**File:** `book-search-results.tsx`

Results display supporting both layouts:

```ts
interface BookSearchResultsProps {
  books: LocalBook[];
  statusMap?: Record<number, { status: string; currentPage: number }>;
  layout: 'grid' | 'list';
  onBookClick?: () => void; // For closing dropdown/dialog
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}
```

**Features:**

- Grid layout: Uses `BookCard` components
- List layout: Uses row-based display with more details
- BookStatusDropdown for each result
- Load More button
- Empty states

---

### Phase 4: Create ExternalBooksList Component

**File:** `external-books-list.tsx`

Already exists in BookSearch, extract and enhance:

```ts
interface ExternalBooksListProps {
  books: ExternalBook[];
  onAddBook: (book: ExternalBook) => void;
  getAddedBookInfo: (book: ExternalBook) => { id: number; pageCount: number | null } | null;
  isAdding: boolean;
  addingIsbn: string | null;
  onBookClick?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}
```

---

### Phase 5: Create Variant Components

#### BookSearchDialog (Nav)

**File:** `book-search-dialog.tsx`

```ts
interface BookSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Composition:**

```tsx
<Dialog>
  <DialogContent>
    <BookSearchInput />
    <div className="h-[60vh] overflow-y-auto">
      <BookSearchResults layout="list" />
      <ExternalBooksList />
    </div>
    <Footer with keyboard hints />
  </DialogContent>
</Dialog>
```

#### BookSearchDropdown (Home)

**File:** `book-search-dropdown.tsx`

```ts
interface BookSearchDropdownProps {
  className?: string;
  placeholder?: string;
}
```

**Composition:**

```tsx
<div ref={containerRef}>
  <BookSearchInput />
  {showResults && (
    <div className="dropdown-panel">
      <BookSearchResults layout="grid" />
      <ExternalBooksList />
    </div>
  )}
</div>
```

---

### Phase 6: Migration & Cleanup

1. **Update imports:**

- `header.tsx`: Import `BookSearchDialog` from new location
- `home-content.tsx` or wherever SearchBar is used: Import `BookSearchDropdown`

2. **Remove old files:**

- Delete `search-bar.tsx` (replaced by `BookSearchDropdown`)
- The old `book-search.tsx` content moves to new structure

3. **Test both variants:**

- Verify dropdown works on home page
- Verify dialog works from nav
- Verify all features work in both (shelf management, pagination, external search)

---

## Benefits of This Approach

1. **DRY (Don't Repeat Yourself):** All search logic lives in one hook
2. **Consistency:** Both variants have identical features
3. **Maintainability:** Bug fixes and enhancements apply to both automatically
4. **Flexibility:** Easy to add new variants (e.g., mobile sheet) or layouts
5. **Testability:** Hook can be unit tested independently
6. **Feature parity:** SearchBar gains missing features (shelf dropdown, pagination, status display)

---

## Migration Risk Assessment

| Risk                             | Mitigation                                  |
| -------------------------------- | ------------------------------------------- |
| Breaking existing functionality  | Incremental migration, test each phase      |
| Different edge cases in variants | Shared hook handles all logic consistently  |
| Performance regression           | React-query caching already in place        |
| UI regressions                   | Keep existing styles, only change structure |

---

## Open Questions

1. Should the dropdown variant have a fixed height like the dialog to prevent layout shift? No the current styling for it is good.
2. Should we add keyboard navigation (arrow keys) to results? Yes.
3. Should the grid layout in dropdown also show BookStatusDropdown, or keep it minimal? Yes, it should show BookStatusDropdown.
4. Should Load More be infinite scroll instead of a button? It should be a button.

---

## Next Steps

1. Review and approve this plan
2. Implement Phase 1 (useBookSearch hook)
3. Implement Phases 2-4 (shared components)
4. Implement Phase 5 (variant components)
5. Execute Phase 6 (migration and cleanup)
6. Test thoroughly
