# Bookmarkd

## Product Requirements Document

*A Modern Book Tracking & Reading Companion Platform*

**Version 1.1 | November 2025**

---

## Executive Summary

Bookmarkd is a modern book tracking and reading companion application that reimagines the traditional book cataloging experience. While providing core functionality similar to GoodReads (book discovery, reading lists, reviews), Bookmarkd differentiates itself through AI-powered reading comprehension tools including character glossaries, vocabulary tracking, and chapter-based note-taking.

The platform is available on **web and mobile (iOS/Android)**, leveraging AI through Model Context Protocol (MCP) integration to automatically generate character profiles, reducing friction for users while building a collaborative knowledge base for each book.

---

## Vision & Goals

### Product Vision

To create the most comprehensive and intelligent book companion platform that helps readers not just track what they read, but deeply engage with and understand their books.

### Key Goals

- Provide a modern, intuitive alternative to legacy book tracking platforms
- Enhance reading comprehension through AI-assisted character tracking
- Enable vocabulary building within reading context
- Support structured note-taking organized by book chapters
- Build community-driven knowledge through collaborative character glossaries

---

## Target Audience

### Primary Users

- **Avid Readers:** Users who read 10+ books per year and want to track their reading journey
- **Students:** High school and college students studying literature who need character references and vocabulary tools
- **Book Club Members:** Groups who discuss books and want shared notes and character references
- **Complex Fiction Readers:** Fans of epic fantasy, historical fiction, and literary novels with large casts
- **Mobile-First Readers:** Users who prefer tracking reading progress and looking up characters on-the-go via mobile devices

### User Pain Points Addressed

- Forgetting characters when returning to a book or reading a series
- No centralized place to track new vocabulary encountered while reading
- Notes scattered across physical bookmarks, apps, and notebooks
- Outdated UI/UX in existing book tracking platforms

---

## Core Features

### 1. Book Management (Baseline)

**Description:** Standard book cataloging functionality matching industry expectations.

**Capabilities:**
- Book search and discovery via external APIs (Google Books, Open Library)
- Book details display (cover, synopsis, author, page count, ISBN, publisher)
- Reading status shelves: Want to Read, Currently Reading, Read, DNF
- Reading progress tracking (current page, start/finish dates)
- User ratings and reviews
- Genre/subject categorization

### 2. Character Glossary (Differentiator)

**Description:** Community-built, AI-assisted character database for each book.

**Capabilities:**
- Character profiles with name, description, profile image, first appearance
- Character aliases/nicknames (e.g., "The Imp" for Tyrion Lannister)
- Character relationships mapping (parent, sibling, ally, enemy)
- AI-powered character creation via MCP tool calling
- Human-in-the-loop approval workflow for AI-generated content
- Spoiler protection with chapter-based visibility controls

### 3. Vocabulary Tracker (Differentiator)

**Description:** Personal vocabulary building tied to reading context.

**Capabilities:**
- Save unfamiliar words while reading
- Store word, definition, context sentence, and page number
- Associate vocabulary with specific books and chapters
- Mark words as "learned" for progress tracking
- Export vocabulary lists for study purposes

### 4. Chapter-Based Notes (Differentiator)

**Description:** Structured note-taking organized by book chapters.

**Capabilities:**
- Create notes tied to specific chapters or page references
- Private notes (personal) vs public notes (shared)
- Rich text formatting support
- Note organization and search
- Separate from reviews (notes are reading aids, reviews are recommendations)

---

## AI Integration Architecture

### MCP Tool Integration

The AI assistant operates through Model Context Protocol (MCP), calling API endpoints as tools to interact with the Bookmarkd backend.

#### Available MCP Tools

| Tool Name | API Endpoint | Purpose |
|-----------|--------------|---------|
| `get_current_book` | `GET /api/users/:id/currently-reading` | Get user's current book context |
| `search_characters` | `GET /api/books/:id/characters` | Check if character exists |
| `get_character` | `GET /api/books/:id/characters/:id` | Retrieve character details |
| `create_character` | `POST /api/books/:id/characters` | Create new character entry |
| `generate_image` | `POST /api/images/generate` | Generate character portrait |

### AI Character Creation Flow

1. User enters a character name (e.g., "Tyrion Lannister")
2. AI retrieves user's currently reading book via `get_current_book`
3. AI searches existing characters via `search_characters`
4. If found: Return existing character details
5. If not found: AI generates description, profile image, metadata
6. User reviews AI-generated content
7. User approves or edits before saving
8. Character saved to glossary for community benefit

---

## Technical Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend (Web) | Next.js | SSR, SEO, React ecosystem |
| Frontend (Mobile) | Expo + React Native | Cross-platform iOS/Android |
| Mobile Styling | NativeWind | Tailwind CSS for React Native |
| Backend | Elysia | Bun-native, fast, ergonomic API |
| Runtime | Bun | Performance, modern tooling |
| API Layer | oRPC | End-to-end type safety |
| Authentication | Better-Auth | Modern, flexible auth solution |
| Database | PostgreSQL (Supabase) | Relational data, managed hosting |
| ORM | Drizzle | Type-safe, lightweight |
| Monorepo | Turborepo | Build caching, task orchestration |
| Code Quality | Biome | Fast linting and formatting |
| AI Integration | MCP | Tool calling for AI assistant |
| Mobile | Expo | React Native framework, managed workflow |
| Mobile Styling | NativeWind | Tailwind CSS for React Native |

### Project Structure

```
my-better-t-app/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── server/       # Elysia backend API
│   └── native/       # Expo React Native mobile app
├── packages/         # Shared packages
└── README.md
```

---

## Data Model Overview

### Authentication (Better-Auth managed)

- **user** - Core user identity
- **session** - User sessions
- **account** - OAuth provider connections
- **verification** - Email verification tokens

### User Extensions

- **user_profile** - Public profile (username, bio, avatar)
- **user_role** - Admin/Moderator/User permissions

### Book Core

- **book** - Book metadata (title, ISBN, synopsis, cover)
- **author** - Author profiles
- **book_author** - Many-to-many junction (supports co-authors)
- **genre** - Hierarchical genres with parent/child
- **book_genre** - Many-to-many book categorization
- **chapter** - Chapter metadata for structured notes

### Characters

- **character** - Character profiles with AI generation tracking
- **character_alias** - Nicknames and alternative names
- **character_relationship** - Character connections (family, allies, enemies)

### User Interactions

- **user_book** - Reading status, progress, personal rating
- **review** - Public book reviews
- **review_vote** - Helpful/not helpful votes
- **note** - Chapter-based personal notes
- **vocabulary** - Personal word lists with context

### Social

- **reaction** - Polymorphic reactions (like, love, etc.)
- **comment** - Threaded comments with replies

---

## User Stories

### Book Discovery & Tracking

1. As a reader, I want to search for books by title/author so I can add them to my library
2. As a reader, I want to mark books as "Want to Read" so I can build a reading list
3. As a reader, I want to track my current page so I can see my reading progress
4. As a reader, I want to rate and review books so I can share my opinions

### Character Glossary

1. As a reader, I want to look up a character's name so I can remember who they are
2. As a reader, I want the AI to auto-generate character details so I don't have to write them manually
3. As a reader, I want to see character relationships so I can understand the cast
4. As a contributor, I want to edit AI-generated characters so I can correct errors

### Vocabulary & Notes

1. As a reader, I want to save unfamiliar words so I can learn them later
2. As a student, I want to take chapter-by-chapter notes so I can study the book
3. As a book club member, I want to share my notes publicly so others can read them

### Mobile Experience

1. As a mobile user, I want to quickly look up a character while reading on my couch
2. As a mobile user, I want to update my reading progress from my phone
3. As a mobile user, I want to add vocabulary words with one tap while reading
4. As a mobile user, I want offline access to character glossaries for books I'm reading

---

## Development Phases

### Phase 1: Foundation (MVP)

- User authentication (Better-Auth setup)
- Book search via external API integration
- Reading status management (shelves)
- Basic book details page
- Database schema implementation

### Phase 2: Core Differentiators

- Character glossary CRUD
- Vocabulary tracker
- Chapter-based notes
- User reviews and ratings

### Phase 3: AI Integration

- MCP server setup
- AI character generation workflow
- Character image generation
- Approval/moderation system

### Phase 4: Mobile App

- Expo React Native app setup with NativeWind
- Core screens (book search, shelves, book details)
- Character glossary with offline support
- Push notifications for reading reminders
- App Store and Google Play deployment

### Phase 5: Social & Polish

- Comments and reactions
- User profiles
- Public/private note sharing
- Search and filtering improvements
- Cross-platform sync enhancements

---

## Open Questions & Decisions

### To Be Determined

1. **Book data source:** Google Books API vs Open Library vs hybrid approach?
2. **AI knowledge source:** LLM training data only, or feed book summaries/content?
3. **Image generation:** DALL-E, Flux, Stable Diffusion, or user uploads only?
4. **Spoiler handling:** How to prevent character descriptions from spoiling plot points?
5. **Monetization:** Free with ads, freemium, or subscription model?
6. **Moderation:** Community moderation vs AI moderation vs manual review?

---

## Success Metrics

- **User Acquisition:** Monthly active users, sign-up conversion rate
- **Engagement:** Books tracked per user, characters viewed, notes created
- **AI Quality:** Character approval rate, edit frequency on AI content
- **Retention:** 7-day and 30-day retention rates
- **Community Health:** Characters contributed, vocabulary words shared
- **Mobile Adoption:** Mobile app installs, mobile vs web usage ratio, app store ratings

---

*— End of Document —*
