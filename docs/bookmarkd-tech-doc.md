# Bookmarkd

## Technical Architecture Document

*Better-T Stack Implementation Guide*

**Version 1.1 | November 2025**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Architecture (Next.js)](#4-frontend-architecture-nextjs)
5. [Mobile Architecture (Expo + NativeWind)](#5-mobile-architecture-expo--nativewind)
6. [Backend Architecture (Elysia)](#6-backend-architecture-elysia)
7. [API Layer (oRPC)](#7-api-layer-orpc)
8. [Database Layer (Drizzle + PostgreSQL)](#8-database-layer-drizzle--postgresql)
9. [Authentication (Better-Auth)](#9-authentication-better-auth)
10. [AI Integration (MCP)](#10-ai-integration-mcp)
11. [Development Workflow](#11-development-workflow)
12. [Deployment Strategy](#12-deployment-strategy)
13. [Environment Configuration](#13-environment-configuration)

---

## 1. Architecture Overview

Bookmarkd follows a modern monorepo architecture using Turborepo, with clear separation between frontend and backend applications. The system is designed for end-to-end type safety using oRPC, with PostgreSQL as the primary data store managed through Drizzle ORM.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐          │
│  │  Next.js    │  │   Expo      │  │   AI Assistant  │          │
│  │  (Web)      │  │  (Mobile)   │  │   (MCP Client)  │          │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘          │
└─────────┼────────────────┼──────────────────┼───────────────────┘
          │                │                  │
          └────────────────┼──────────────────┘
                           │ oRPC (Type-Safe)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Elysia (Bun)                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  oRPC    │  │  Better  │  │   MCP    │  │  Routes  │ │   │
│  │  │  Router  │  │   Auth   │  │  Server  │  │  /api/*  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └─────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ Drizzle ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Supabase)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

- **End-to-End Type Safety:** oRPC provides compile-time type checking from client to server
- **Monorepo Architecture:** Turborepo manages shared dependencies and build caching
- **Bun Runtime:** Fast execution, native TypeScript support, built-in bundler
- **Schema-First Database:** Drizzle ORM provides type-safe queries and migrations
- **MCP Integration:** AI tools interact with API via standardized protocol

---

## 2. Technology Stack

### Core Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| Runtime | **Bun** | JavaScript/TypeScript runtime, package manager, bundler |
| Frontend | **Next.js 14+** | React framework with SSR, App Router, Server Components |
| Backend | **Elysia** | Bun-native web framework, ergonomic API, high performance |
| API Layer | **oRPC** | End-to-end type-safe RPC, lighter alternative to tRPC |
| Database | **PostgreSQL** | Relational database hosted on Supabase |
| ORM | **Drizzle** | Type-safe ORM, SQL-like syntax, lightweight |
| Authentication | **Better-Auth** | Modern auth library, email/password, OAuth providers |
| AI Integration | **MCP** | Model Context Protocol for AI tool calling |
| Mobile | **Expo** | React Native framework, managed workflow, OTA updates |
| Mobile Styling | **NativeWind** | Tailwind CSS for React Native, shared styles with web |

### Development Tools

| Tool | Version | Usage |
|------|---------|-------|
| Turborepo | Latest | Monorepo build system, task caching |
| Biome | Latest | Linting and formatting (replaces ESLint + Prettier) |
| TypeScript | 5.x | Static typing across entire codebase |
| Drizzle Kit | Latest | Database migrations, schema push, studio |

---

## 3. Project Structure

The project follows a monorepo structure managed by Turborepo, with clear separation between applications and shared packages.

### Directory Layout

```
my-better-t-app/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── app/                # App Router pages and layouts
│   │   │   ├── (auth)/         # Auth route group
│   │   │   ├── (dashboard)/    # Protected routes
│   │   │   ├── api/            # API route handlers
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Home page
│   │   ├── components/         # React components
│   │   │   ├── ui/             # Base UI components
│   │   │   ├── features/       # Feature-specific components
│   │   │   └── layouts/        # Layout components
│   │   ├── lib/                # Utilities and clients
│   │   │   ├── orpc.ts         # oRPC client setup
│   │   │   ├── auth-client.ts  # Better-Auth client
│   │   │   └── utils.ts        # Helper functions
│   │   ├── hooks/              # Custom React hooks
│   │   ├── styles/             # Global styles
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── native/                 # Expo React Native application
│   │   ├── app/                # Expo Router screens
│   │   │   ├── (tabs)/         # Tab navigation screens
│   │   │   ├── (auth)/         # Auth screens
│   │   │   ├── book/[id]/      # Book detail screens
│   │   │   ├── _layout.tsx     # Root layout
│   │   │   └── index.tsx       # Home screen
│   │   ├── components/         # React Native components
│   │   │   ├── ui/             # Base UI components
│   │   │   └── features/       # Feature-specific components
│   │   ├── lib/                # Utilities and clients
│   │   │   ├── orpc.ts         # oRPC client setup
│   │   │   └── auth-client.ts  # Better-Auth client
│   │   ├── hooks/              # Custom React hooks
│   │   ├── app.json            # Expo configuration
│   │   ├── tailwind.config.ts  # NativeWind config
│   │   └── package.json
│   │
│   └── server/                 # Elysia backend application
│       ├── src/
│       │   ├── index.ts        # Server entry point
│       │   ├── routers/        # oRPC routers
│       │   │   ├── index.ts    # Root router
│       │   │   ├── books.ts    # Book procedures
│       │   │   ├── characters.ts
│       │   │   ├── notes.ts
│       │   │   ├── vocabulary.ts
│       │   │   └── users.ts
│       │   ├── db/             # Database layer
│       │   │   ├── index.ts    # Drizzle client
│       │   │   ├── schema.ts   # Schema definitions
│       │   │   └── migrations/ # SQL migrations
│       │   ├── lib/            # Server utilities
│       │   │   ├── auth.ts     # Better-Auth setup
│       │   │   └── orpc.ts     # oRPC server setup
│       │   └── mcp/            # MCP server
│       │       ├── server.ts   # MCP server setup
│       │       └── tools/      # MCP tool definitions
│       ├── drizzle.config.ts
│       └── package.json
│
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types.ts        # Shared TypeScript types
│   │   │   └── validators.ts   # Zod schemas
│   │   └── package.json
│   └── ui/                     # Shared UI components (optional)
│
├── turbo.json                  # Turborepo configuration
├── biome.json                  # Biome linter/formatter config
├── package.json                # Root package.json
└── bun.lockb                   # Bun lockfile
```

---

## 4. Frontend Architecture (Next.js)

### App Router Structure

The frontend uses Next.js 14+ with the App Router, leveraging React Server Components for improved performance and SEO.

#### Route Groups

| Route Group | Description |
|-------------|-------------|
| `(auth)` | Login, register, forgot password pages |
| `(dashboard)` | Protected routes requiring authentication |
| `(marketing)` | Public pages (landing, about, pricing) |

#### Key Pages

```
/                         # Landing page
/login                    # Authentication
/register                 # User registration
/dashboard                # User dashboard
/books                    # Book discovery/search
/books/[id]               # Book details
/books/[id]/characters    # Character glossary
/books/[id]/notes         # User notes
/books/[id]/vocabulary    # Vocabulary list
/my-books                 # User's shelves
/profile                  # User profile
```

### oRPC Client Setup

The oRPC client is configured in `lib/orpc.ts` and provides type-safe API calls:

```typescript
// lib/orpc.ts
import { createORPCClient } from '@orpc/client';
import type { AppRouter } from '@bookmarkd/server';

export const orpc = createORPCClient<AppRouter>({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
```

---

## 5. Mobile Architecture (Expo + NativeWind)

### Expo Configuration

The mobile app uses Expo with Expo Router for file-based navigation, mirroring the Next.js App Router pattern.

#### Key Screens

```
(tabs)/
├── index.tsx           # Home / Dashboard
├── search.tsx          # Book search
├── my-books.tsx        # User's shelves
└── profile.tsx         # User profile

(auth)/
├── login.tsx           # Login screen
└── register.tsx        # Registration screen

book/[id]/
├── index.tsx           # Book details
├── characters.tsx      # Character glossary
├── notes.tsx           # User notes
└── vocabulary.tsx      # Vocabulary list
```

### NativeWind Setup

NativeWind enables Tailwind CSS classes in React Native, allowing style sharing between web and mobile:

```typescript
// tailwind.config.ts (native)
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

### oRPC Client (Mobile)

```typescript
// lib/orpc.ts
import { createORPCClient } from '@orpc/client';
import type { AppRouter } from '@bookmarkd/server';

export const orpc = createORPCClient<AppRouter>({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});
```

### Auth Client (Mobile)

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  storage: {
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value),
    removeItem: (key) => SecureStore.deleteItemAsync(key),
  },
});
```

### Running the Mobile App

```bash
# Start Expo development server
cd apps/native
bun start

# Run on iOS simulator
bun ios

# Run on Android emulator
bun android

# Run on physical device (scan QR code)
bun start --tunnel
```

---

## 6. Backend Architecture (Elysia)

### Server Entry Point

The Elysia server is configured in `src/index.ts`:

```typescript
// src/index.ts
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { orpcHandler } from './lib/orpc';
import { auth } from './lib/auth';

const app = new Elysia()
  .use(cors())
  .use(auth.handler)              // Better-Auth routes
  .all('/api/orpc/*', orpcHandler) // oRPC routes
  .listen(3001);

console.log(`Server running on ${app.server?.port}`);
```

### Router Organization

oRPC routers are organized by domain, each handling a specific resource:

| Router | File | Procedures |
|--------|------|------------|
| books | `routers/books.ts` | search, getById, create, update |
| characters | `routers/characters.ts` | list, getById, create, approve |
| notes | `routers/notes.ts` | list, create, update, delete |
| vocabulary | `routers/vocabulary.ts` | list, add, markLearned, delete |
| userBooks | `routers/userBooks.ts` | getShelves, updateStatus, updateProgress |
| reviews | `routers/reviews.ts` | list, create, vote |

---

## 7. API Layer (oRPC)

### Why oRPC?

oRPC provides end-to-end type safety similar to tRPC but with a lighter footprint. Types flow from server to client without code generation.

### Router Example

```typescript
// routers/books.ts
import { router, procedure } from '../lib/orpc';
import { z } from 'zod';
import { db } from '../db';
import { books } from '../db/schema';

export const booksRouter = router({
  search: procedure
    .input(z.object({ query: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return db.select().from(books)
        .where(ilike(books.title, `%${input.query}%`))
        .limit(input.limit);
    }),

  getById: procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(books)
        .where(eq(books.id, input.id))
        .limit(1);
    }),
});
```

### Client Usage

```typescript
// In a React component
const results = await orpc.books.search({ query: 'Game of Thrones' });
// TypeScript knows results is Book[]
```

---

## 8. Database Layer (Drizzle + PostgreSQL)

### Drizzle Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Database Client

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### Migration Commands

```bash
# Generate migration from schema changes
bun drizzle-kit generate

# Push schema directly (development)
bun drizzle-kit push

# Run migrations (production)
bun drizzle-kit migrate

# Open Drizzle Studio (GUI)
bun drizzle-kit studio
```

### Supabase Connection

The database is hosted on Supabase. Connection string format:

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## 9. Authentication (Better-Auth)

### Server Configuration

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

### Client Configuration

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
```

### Auth Tables (Auto-generated)

- **user** - Core user identity (id, email, name, image)
- **session** - Active sessions with tokens
- **account** - OAuth provider connections
- **verification** - Email verification tokens

---

## 10. AI Integration (MCP)

### MCP Server Setup

The MCP server exposes API endpoints as tools that AI assistants can call:

```typescript
// src/mcp/server.ts
import { MCPServer } from '@modelcontextprotocol/server';
import { characterTools } from './tools/characters';
import { bookTools } from './tools/books';

export const mcpServer = new MCPServer({
  name: 'bookmarkd',
  version: '1.0.0',
  tools: [...characterTools, ...bookTools],
});
```

### Tool Definitions

| Tool | Parameters | Returns |
|------|------------|---------|
| `get_current_book` | userId: string | Book \| null |
| `search_characters` | bookId: number, query: string | Character[] |
| `get_character` | characterId: number | Character |
| `create_character` | bookId, name, description, ... | Character |
| `generate_image` | prompt: string | { imageUrl: string } |

---

## 11. Development Workflow

### Getting Started

1. **Clone the repository:** `git clone <repo-url>`
2. **Install dependencies:** `bun install`
3. **Copy environment file:** `cp .env.example .env`
4. **Push database schema:** `bun db:push`
5. **Start development:** `bun dev`

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start all apps in development mode |
| `bun build` | Build all apps for production |
| `bun lint` | Run Biome linter across all packages |
| `bun format` | Format code with Biome |
| `bun db:push` | Push schema changes to database |
| `bun db:generate` | Generate SQL migration files |
| `bun db:studio` | Open Drizzle Studio GUI |
| `bun native:start` | Start Expo development server |
| `bun native:ios` | Run mobile app on iOS simulator |
| `bun native:android` | Run mobile app on Android emulator |

### Turborepo Task Pipeline

```json
// turbo.json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "check-types": { "dependsOn": ["^build"] }
  }
}
```

---

## 12. Deployment Strategy

### Recommended Deployment Targets

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Native Next.js support, edge functions |
| Backend | Railway / Fly.io | Docker support, Bun runtime |
| Database | Supabase | Managed PostgreSQL, auto backups |
| Mobile (iOS) | App Store | Via Expo EAS Build |
| Mobile (Android) | Play Store | Via Expo EAS Build |
| Mobile (OTA) | Expo Updates | Over-the-air updates for JS bundles |

### Mobile Deployment (Expo EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android

# Push OTA update (no app store review needed)
eas update --branch production
```

### EAS Configuration

```json
// eas.json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### Docker Configuration (Backend)

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]
```

---

## 13. Environment Configuration

### Required Environment Variables

#### Server (.env)

```bash
# Database
DATABASE_URL=postgresql://...

# Better-Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3001

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# AI/External APIs
OPENAI_API_KEY=...
GOOGLE_BOOKS_API_KEY=...
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Mobile (.env)

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_APP_NAME=Bookmarkd
```

### Security Best Practices

- Never commit .env files to version control
- Use different secrets for development/staging/production
- Rotate BETTER_AUTH_SECRET periodically
- Use environment variable managers (Doppler, Infisical) for teams
- Restrict OAuth callback URLs in provider settings

---

*— End of Document —*
