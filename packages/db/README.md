# @bookmarkd/db

Database package for Bookmarkd using Drizzle ORM with PostgreSQL.

## Database Commands

Run these commands from the root of the monorepo:

| Command | Description |
|---------|-------------|
| `bun run db:push` | Push schema changes directly to the database. **Use in development** - fast iteration without migration files. Destructive changes may cause data loss. |
| `bun run db:generate` | Generate SQL migration files from schema changes. **Use before production deploys** - creates versioned migration files in `src/migrations/`. |
| `bun run db:migrate` | Run pending migrations against the database. **Use in production** - applies migration files in order. Safe and reversible. |
| `bun run db:studio` | Open Drizzle Studio GUI in your browser. Visual database explorer for viewing and editing data. |
| `bun run db:seed` | Seed the database with sample data (books, authors, characters, etc.). Run after `db:push` or `db:migrate`. |

## When to Use Each Command

### Development Workflow

```bash
# 1. Make schema changes in src/schema/*.ts
# 2. Push changes directly to dev database
bun run db:push

# 3. (Optional) Seed with sample data
bun run db:seed

# 4. View data in browser GUI
bun run db:studio
```

### Production Workflow

```bash
# 1. Make schema changes in src/schema/*.ts
# 2. Generate migration files
bun run db:generate

# 3. Review generated SQL in src/migrations/
# 4. Commit migration files to git
# 5. In production, run migrations
bun run db:migrate
```

## Quick Reference

- **`db:push`** = Fast, direct, potentially destructive (dev only)
- **`db:generate`** + **`db:migrate`** = Safe, versioned, reversible (production)
- **`db:studio`** = Visual data browser
- **`db:seed`** = Populate with sample data

## Schema Structure

```
src/schema/
├── index.ts          # Barrel export
├── enums.ts          # PostgreSQL enums
├── auth.ts           # User, session, account (Better-Auth)
├── book.ts           # Book metadata
├── author.ts         # Authors + book_author junction
├── genre.ts          # Hierarchical genres + book_genre junction
├── chapter.ts        # Book chapters
├── character.ts      # Characters + aliases
├── user-book.ts      # Reading status/progress
├── note.ts           # Chapter-based notes
├── vocabulary.ts     # Personal word lists
├── review.ts         # Book reviews + votes
├── comment.ts        # Threaded comments
├── reaction.ts       # Reactions (like, love, etc.)
└── relations.ts      # Drizzle relations
```

## Entity Relationship Diagram

### Complete Schema Overview

```mermaid
erDiagram
    %% ==================== AUTHENTICATION ====================
    user {
        text id PK
        text name
        text email UK
        boolean email_verified
        text image
        varchar display_name
        text bio
        text avatar_url
        timestamp created_at
        timestamp updated_at
    }

    session {
        text id PK
        timestamp expires_at
        text token UK
        text ip_address
        text user_agent
        text user_id FK
        timestamp created_at
        timestamp updated_at
    }

    account {
        text id PK
        text account_id
        text provider_id
        text user_id FK
        text access_token
        text refresh_token
        timestamp created_at
        timestamp updated_at
    }

    verification {
        text id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    user_role {
        serial id PK
        text user_id FK
        enum role
        timestamp created_at
    }

    %% ==================== BOOK DOMAIN ====================
    book {
        serial id PK
        varchar title
        varchar subtitle
        varchar isbn
        varchar isbn13
        text synopsis
        text cover_url
        varchar publisher
        integer page_count
        varchar language
        varchar date_published
        timestamp created_at
        timestamp updated_at
    }

    author {
        serial id PK
        varchar name
    }

    book_author {
        serial id PK
        integer book_id FK
        integer author_id FK
    }

    genre {
        serial id PK
        varchar name
        integer parent_id FK
    }

    book_genre {
        serial id PK
        integer book_id FK
        integer genre_id FK
    }

    chapter {
        serial id PK
        integer book_id FK
        integer number
        varchar title
        integer start_page
        integer end_page
        timestamp created_at
    }

    character {
        serial id PK
        integer book_id FK
        varchar name
        text description
        text image_url
        boolean ai_generated
        timestamp created_at
        timestamp updated_at
    }

    character_alias {
        serial id PK
        integer character_id FK
        varchar alias
    }

    %% ==================== USER READING ====================
    user_book {
        serial id PK
        text user_id FK
        integer book_id FK
        enum status
        integer current_page
        integer rating
        timestamp started_at
        timestamp finished_at
        timestamp created_at
        timestamp updated_at
    }

    note {
        serial id PK
        text user_id FK
        integer book_id FK
        integer chapter_id FK
        text content
        integer page_number
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }

    vocabulary {
        serial id PK
        text user_id FK
        integer book_id FK
        integer chapter_id FK
        varchar word
        text definition
        text context_sentence
        integer page_number
        boolean learned
        timestamp created_at
        timestamp updated_at
    }

    %% ==================== SOCIAL ====================
    review {
        serial id PK
        text user_id FK
        integer book_id FK
        integer rating
        text content
        timestamp created_at
        timestamp updated_at
    }

    review_vote {
        serial id PK
        integer review_id FK
        text user_id FK
        integer value
        timestamp created_at
    }

    comment {
        serial id PK
        text user_id FK
        integer book_id FK
        integer review_id FK
        integer note_id FK
        integer parent_id FK
        text content
        timestamp created_at
        timestamp updated_at
    }

    reaction {
        serial id PK
        text user_id FK
        enum type
        integer comment_id FK
        integer review_id FK
        integer note_id FK
        timestamp created_at
    }

    %% ==================== RELATIONSHIPS ====================
    %% Auth relationships
    user ||--o{ session : "has"
    user ||--o{ account : "has"
    user ||--o{ user_role : "has"

    %% Book relationships
    book ||--o{ book_author : "has"
    author ||--o{ book_author : "written_by"
    book ||--o{ book_genre : "has"
    genre ||--o{ book_genre : "categorizes"
    genre ||--o| genre : "parent_of"
    book ||--o{ chapter : "contains"
    book ||--o{ character : "features"
    character ||--o{ character_alias : "known_as"

    %% User reading relationships
    user ||--o{ user_book : "tracks"
    book ||--o{ user_book : "tracked_by"
    user ||--o{ note : "writes"
    book ||--o{ note : "has"
    chapter ||--o{ note : "contains"
    user ||--o{ vocabulary : "learns"
    book ||--o{ vocabulary : "has"
    chapter ||--o{ vocabulary : "contains"

    %% Social relationships
    user ||--o{ review : "writes"
    book ||--o{ review : "has"
    review ||--o{ review_vote : "receives"
    user ||--o{ review_vote : "casts"
    user ||--o{ comment : "writes"
    book ||--o{ comment : "has"
    review ||--o{ comment : "has"
    note ||--o{ comment : "has"
    comment ||--o| comment : "replies_to"
    user ||--o{ reaction : "reacts"
    comment ||--o{ reaction : "receives"
    review ||--o{ reaction : "receives"
    note ||--o{ reaction : "receives"
```

### Domain-Specific Diagrams

#### Authentication & Users

```mermaid
erDiagram
    user ||--o{ session : "has"
    user ||--o{ account : "oauth"
    user ||--o{ user_role : "assigned"

    user {
        text id PK
        text name
        text email UK
        boolean email_verified
        text image
        varchar display_name
        text bio
        text avatar_url
    }

    session {
        text id PK
        text token UK
        timestamp expires_at
        text user_id FK
    }

    account {
        text id PK
        text provider_id
        text account_id
        text user_id FK
    }

    user_role {
        serial id PK
        text user_id FK
        enum role "ADMIN|MODERATOR|USER"
    }
```

#### Books & Metadata

```mermaid
erDiagram
    book ||--o{ book_author : "written_by"
    author ||--o{ book_author : "writes"
    book ||--o{ book_genre : "categorized_as"
    genre ||--o{ book_genre : "contains"
    genre ||--o| genre : "parent_of"
    book ||--o{ chapter : "contains"
    book ||--o{ character : "features"
    character ||--o{ character_alias : "known_as"

    book {
        serial id PK
        varchar title
        varchar subtitle
        varchar isbn
        text synopsis
        text cover_url
        integer page_count
    }

    author {
        serial id PK
        varchar name
    }

    genre {
        serial id PK
        varchar name
        integer parent_id FK "self-reference"
    }

    chapter {
        serial id PK
        integer book_id FK
        integer number
        varchar title
    }

    character {
        serial id PK
        integer book_id FK
        varchar name
        text description
        boolean ai_generated
    }

    character_alias {
        serial id PK
        integer character_id FK
        varchar alias
    }
```

#### User Reading Activity

```mermaid
erDiagram
    user ||--o{ user_book : "tracks"
    book ||--o{ user_book : "tracked_by"
    user ||--o{ note : "writes"
    book ||--o{ note : "has"
    chapter ||--o{ note : "contains"
    user ||--o{ vocabulary : "learns"
    book ||--o{ vocabulary : "has"

    user_book {
        serial id PK
        text user_id FK
        integer book_id FK
        enum status "WantToRead|CurrentlyReading|Read|DNF|None"
        integer current_page
        integer rating
        timestamp started_at
        timestamp finished_at
    }

    note {
        serial id PK
        text user_id FK
        integer book_id FK
        integer chapter_id FK
        text content
        integer page_number
        boolean is_public
    }

    vocabulary {
        serial id PK
        text user_id FK
        integer book_id FK
        varchar word
        text definition
        text context_sentence
        boolean learned
    }
```

#### Social Features

```mermaid
erDiagram
    user ||--o{ review : "writes"
    book ||--o{ review : "has"
    review ||--o{ review_vote : "receives"
    user ||--o{ review_vote : "casts"
    user ||--o{ comment : "writes"
    comment ||--o| comment : "replies_to"
    user ||--o{ reaction : "gives"

    review {
        serial id PK
        text user_id FK
        integer book_id FK
        integer rating "1-5"
        text content
    }

    review_vote {
        serial id PK
        integer review_id FK
        text user_id FK
        integer value "+1 or -1"
    }

    comment {
        serial id PK
        text user_id FK
        integer book_id FK
        integer review_id FK
        integer note_id FK
        integer parent_id FK "self-reference"
        text content
    }

    reaction {
        serial id PK
        text user_id FK
        enum type "Like|Love|Laugh|Surprised|Sad|Angry"
        integer comment_id FK
        integer review_id FK
        integer note_id FK
    }
```

## Enums

| Enum | Values | Used In |
|------|--------|---------|
| `role` | ADMIN, MODERATOR, USER | user_role.role |
| `book_status` | WantToRead, CurrentlyReading, Read, DNF, None | user_book.status |
| `reaction_type` | Like, Love, Laugh, Surprised, Sad, Angry | reaction.type |

## Key Design Decisions

### Polymorphic Associations

**Comments** can be attached to multiple entity types:
- Books (general discussion)
- Reviews (discussion about reviews)
- Notes (collaboration on notes)
- Other comments (threaded replies)

**Reactions** follow the same pattern for comments, reviews, and notes.

### Self-Referential Tables

- **genre.parent_id** → Creates hierarchical genre tree (e.g., Fiction → Science Fiction → Space Opera)
- **comment.parent_id** → Enables threaded/nested comment replies

### Junction Tables

Many-to-many relationships use junction tables:
- `book_author` → Books can have multiple authors
- `book_genre` → Books can have multiple genres
