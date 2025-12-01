# Bookmarkd API Reference

Complete reference for all oRPC API endpoints.

## Overview

The Bookmarkd API uses **oRPC** for type-safe RPC communication. All endpoints are accessible via `/rpc/*` on the server.

### Base URL

```
Development: http://localhost:3000/rpc
Production:  https://api.bookmarkd.app/rpc
```

### Authentication

Endpoints are either **public** or **protected**:

- **Public**: No authentication required
- **Protected**: Requires valid session cookie/token

Protected endpoints will return `UNAUTHORIZED` error if no valid session is present.

---

## Routers

| Router | Description | Auth |
|--------|-------------|------|
| [book](#book) | Book catalog CRUD | Mixed |
| [author](#author) | Author management | Mixed |
| [genre](#genre) | Genre taxonomy | Mixed |
| [character](#character) | Book characters | Mixed |
| [note](#note) | User notes | Protected |
| [vocabulary](#vocabulary) | Word lists | Protected |
| [userBook](#userbook) | Reading tracking | Protected |
| [review](#review) | Book reviews | Mixed |

---

## Book

Manage the book catalog.

### book.getAll

Get paginated list of books.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  limit?: number;   // 1-100, default: 20
  offset?: number;  // default: 0
}
```

**Output:**
```typescript
Book[]
```

### book.getById

Get a single book with authors and genres.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
{
  ...Book;
  authors: { id: number; name: string }[];
  genres: { id: number; name: string }[];
} | null
```

### book.search

Search books by title or author name.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  query: string;     // min: 1 char
  limit?: number;    // 1-100, default: 20
}
```

**Output:**
```typescript
Book[]
```

### book.create

Create a new book.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  title: string;           // required
  subtitle?: string;
  isbn?: string;
  isbn13?: string;
  synopsis?: string;
  coverUrl?: string;       // valid URL
  publisher?: string;
  pageCount?: number;
  language?: string;
  datePublished?: string;
  authorIds?: number[];
  genreIds?: number[];
}
```

### book.update

Update an existing book.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  id: number;              // required
  title?: string;
  subtitle?: string;
  // ... all create fields optional
  authorIds?: number[];    // replaces existing
  genreIds?: number[];     // replaces existing
}
```

### book.delete

Delete a book.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  id: number;
}
```

---

## Author

Manage authors.

### author.getAll

Get paginated list of authors.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  limit?: number;   // 1-100, default: 50
  offset?: number;  // default: 0
}
```

### author.getById

Get author with their books.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
{
  ...Author;
  books: { id: number; title: string; coverUrl: string | null }[];
} | null
```

### author.search

Search authors by name.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  query: string;
  limit?: number;  // default: 20
}
```

### author.create

Create a new author.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  name: string;  // 1-256 chars
}
```

### author.update

Update an author.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  id: number;
  name: string;
}
```

### author.delete

Delete an author.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

---

## Genre

Manage hierarchical genres.

### genre.getAll

Get all genres, optionally filtered.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  parentId?: number | null;  // filter by parent
  topLevelOnly?: boolean;    // only root genres
}
```

### genre.getById

Get genre with parent, children, and books.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
{
  ...Genre;
  parent: Genre | null;
  children: Genre[];
  books: { id: number; title: string; coverUrl: string | null }[];
} | null
```

### genre.getTree

Get complete genre hierarchy as a tree.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Output:**
```typescript
GenreWithChildren[]  // recursive structure
```

### genre.create

Create a new genre.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  name: string;       // 1-256 chars
  parentId?: number;  // optional parent
}
```

### genre.update / genre.delete

Standard CRUD operations. Protected.

---

## Character

Manage book characters.

### character.getByBookId

Get all characters for a book.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  bookId: number;
  limit?: number;   // default: 50
  offset?: number;
}
```

### character.getById

Get character with book info and aliases.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Output:**
```typescript
{
  ...Character;
  book: { id: number; title: string } | null;
  aliases: { id: number; alias: string }[];
} | null
```

### character.search

Search characters by name or alias.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  query: string;
  bookId?: number;   // optional filter
  limit?: number;
}
```

### character.create

Create a new character.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  aiGenerated?: boolean;  // default: false
  aliases?: string[];     // initial aliases
}
```

### character.addAlias

Add an alias to a character.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  characterId: number;
  alias: string;
}
```

### character.removeAlias

Remove an alias from a character.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  aliasId: number;
}
```

### character.approve

Approve an AI-generated character.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected (Admin/Moderator) |

**Input:**
```typescript
{
  id: number;
}
```

---

## Note

User reading notes (all endpoints protected).

### note.list

Get user's notes for a book.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  chapterId?: number;  // optional filter
  limit?: number;
  offset?: number;
}
```

### note.getById

Get a single note with book/chapter info.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Protected |

### note.create

Create a new note.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  chapterId?: number;
  content: string;        // required
  pageNumber?: number;
  isPublic?: boolean;     // default: false
}
```

### note.update

Update a note (owner only).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

### note.delete

Delete a note (owner only).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

---

## Vocabulary

Personal word lists (all endpoints protected).

### vocabulary.list

Get user's vocabulary for a book.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  chapterId?: number;
  learnedOnly?: boolean;  // filter by learned status
  limit?: number;
  offset?: number;
}
```

### vocabulary.add

Add a word to vocabulary.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  chapterId?: number;
  word: string;            // required
  definition?: string;
  contextSentence?: string;
  pageNumber?: number;
}
```

### vocabulary.markLearned

Mark a word as learned/unlearned.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  id: number;
  learned?: boolean;  // default: true
}
```

### vocabulary.delete

Remove a word from vocabulary.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

---

## UserBook

Reading tracking and library (all endpoints protected).

### userBook.getShelves

Get user's complete library grouped by status.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Protected |

**Output:**
```typescript
{
  wantToRead: UserBookWithDetails[];
  currentlyReading: UserBookWithDetails[];
  read: UserBookWithDetails[];
  dnf: UserBookWithDetails[];
}
```

### userBook.getByBookId

Get user's entry for a specific book.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Protected |

### userBook.updateStatus

Add book to shelf or update status.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  status: "WantToRead" | "CurrentlyReading" | "Read" | "DNF" | "None";
}
```

**Behavior:**
- Setting to `CurrentlyReading` auto-sets `startedAt`
- Setting to `Read` auto-sets `finishedAt`
- Setting to `WantToRead` clears timestamps

### userBook.updateProgress

Update reading progress.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  currentPage: number;
}
```

**Behavior:**
- Auto-sets status to `CurrentlyReading` if not already reading
- Auto-sets `startedAt` if not set

### userBook.updateRating

Rate a book (1-5 stars).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  rating: number;  // 1-5
}
```

### userBook.remove

Remove book from library.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

---

## Review

Book reviews and voting.

### review.list

Get reviews for a book (public).

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

**Input:**
```typescript
{
  bookId: number;
  limit?: number;
  offset?: number;
}
```

**Output:**
```typescript
{
  ...Review;
  userName: string;
  userImage: string | null;
  votes: { helpful: number; notHelpful: number };
}[]
```

### review.getById

Get a single review with vote counts.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Public |

### review.getUserReview

Get current user's review for a book.

| Property | Value |
|----------|-------|
| **Type** | Query |
| **Auth** | Protected |

### review.create

Create a review (one per user per book).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  bookId: number;
  rating: number;    // 1-5
  content?: string;
}
```

### review.update

Update own review.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

### review.delete

Delete own review.

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

### review.vote

Vote on a review (helpful/not helpful).

| Property | Value |
|----------|-------|
| **Type** | Mutation |
| **Auth** | Protected |

**Input:**
```typescript
{
  reviewId: number;
  value: 1 | -1;  // 1 = helpful, -1 = not helpful
}
```

**Behavior:**
- Voting same value again removes the vote
- Voting opposite value updates the vote
- Cannot vote on own reviews

---

## Error Handling

All endpoints may return these error codes:

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | No valid session for protected endpoint |
| `BAD_REQUEST` | Invalid input (Zod validation failed) |
| `NOT_FOUND` | Resource not found |
| `FORBIDDEN` | User lacks permission |
| `INTERNAL_SERVER_ERROR` | Server error |

Error response format:
```typescript
{
  code: string;
  message: string;
}
```

---

## Type Definitions

### Book
```typescript
interface Book {
  id: number;
  title: string;
  subtitle: string | null;
  isbn: string | null;
  isbn13: string | null;
  synopsis: string | null;
  coverUrl: string | null;
  publisher: string | null;
  pageCount: number | null;
  language: string | null;
  datePublished: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Author
```typescript
interface Author {
  id: number;
  name: string;
}
```

### Genre
```typescript
interface Genre {
  id: number;
  name: string;
  parentId: number | null;
}
```

### Character
```typescript
interface Character {
  id: number;
  bookId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### UserBook
```typescript
interface UserBook {
  id: number;
  userId: string;
  bookId: number;
  status: "WantToRead" | "CurrentlyReading" | "Read" | "DNF" | "None";
  currentPage: number;
  rating: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Review
```typescript
interface Review {
  id: number;
  userId: string;
  bookId: number;
  rating: number;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```
