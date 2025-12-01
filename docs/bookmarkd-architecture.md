# Bookmarkd

## Architecture Documentation

*System Architecture & Design Patterns*

**Version 1.0 | November 2025**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Technology Stack](#3-technology-stack)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Application Architecture](#5-application-architecture)
6. [Data Flow Architecture](#6-data-flow-architecture)
7. [Database Architecture](#7-database-architecture)
8. [Authentication Architecture](#8-authentication-architecture)
9. [API Architecture](#9-api-architecture)
10. [AI Integration Architecture](#10-ai-integration-architecture)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Mobile Architecture](#12-mobile-architecture)
13. [Security Architecture](#13-security-architecture)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Development Workflow](#15-development-workflow)

---

## 1. System Overview

Bookmarkd is a modern book tracking and reading companion platform built on the **Better-T Stack** - a full-stack TypeScript architecture optimized for end-to-end type safety, performance, and developer experience.

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│   │    Next.js      │    │      Expo       │    │  AI Assistant   │         │
│   │   Web App       │    │   Mobile App    │    │  (MCP Client)   │         │
│   │   (Port 3001)   │    │  (iOS/Android)  │    │                 │         │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│            │                      │                      │                   │
└────────────┼──────────────────────┼──────────────────────┼───────────────────┘
             │                      │                      │
             │     oRPC (Type-Safe RPC)                    │
             │     HTTP/REST (Auth, AI)                    │
             └──────────────────────┼──────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Elysia Server (Bun)                          │   │
│   │                           (Port 3000)                               │   │
│   │                                                                     │   │
│   │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│   │   │   oRPC    │  │  Better   │  │    AI     │  │   CORS    │       │   │
│   │   │  Handler  │  │   Auth    │  │ Endpoint  │  │ Middleware│       │   │
│   │   │  /rpc/*   │  │ /api/auth │  │   /ai     │  │           │       │   │
│   │   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └───────────┘       │   │
│   │         │              │              │                             │   │
│   │         └──────────────┴──────────────┘                             │   │
│   │                        │                                            │   │
│   └────────────────────────┼────────────────────────────────────────────┘   │
│                            │                                                 │
└────────────────────────────┼─────────────────────────────────────────────────┘
                             │
                             │ Drizzle ORM
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    PostgreSQL (Supabase)                            │   │
│   │                                                                     │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│   │   │   Auth   │  │   Book   │  │   User   │  │Character │           │   │
│   │   │  Tables  │  │  Tables  │  │  Tables  │  │  Tables  │           │   │
│   │   └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Architecture Style** | Monorepo with shared packages |
| **Communication** | Type-safe RPC (oRPC) + REST endpoints |
| **Runtime** | Bun (JavaScript/TypeScript) |
| **Type Safety** | End-to-end TypeScript with Zod validation |
| **State Management** | TanStack Query (server state) |
| **Database** | PostgreSQL with Drizzle ORM |

---

## 2. Architecture Principles

### 2.1 End-to-End Type Safety

Types flow seamlessly from database schema through API layer to client applications without code generation or manual type synchronization.

```
Database Schema (Drizzle) → API Router (oRPC) → Client Types (Auto-inferred)
```

### 2.2 Monorepo Architecture

Shared code is extracted into packages, enabling code reuse while maintaining clear boundaries between applications.

```
apps/           → Deployable applications
packages/       → Shared libraries and utilities
```

### 2.3 Schema-First Development

Database schema serves as the source of truth, with types derived from Drizzle schema definitions.

### 2.4 Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│  Presentation Layer    │  Components, Pages, UI Logic          │
├─────────────────────────────────────────────────────────────────┤
│  Application Layer     │  React Query, State Management        │
├─────────────────────────────────────────────────────────────────┤
│  API Layer             │  oRPC Procedures, Validation          │
├─────────────────────────────────────────────────────────────────┤
│  Domain Layer          │  Business Logic, Services             │
├─────────────────────────────────────────────────────────────────┤
│  Data Access Layer     │  Drizzle ORM, Database Queries        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Performance-First

- **Bun Runtime**: Faster startup and execution than Node.js
- **React Compiler**: Automatic memoization optimization
- **Turborepo Caching**: Incremental builds with remote caching
- **oRPC**: Lightweight RPC with minimal overhead

---

## 3. Technology Stack

### 3.1 Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Bun | 1.2.16 | JavaScript/TypeScript runtime, bundler, package manager |
| **Web Frontend** | Next.js | 16.0.0 | React framework with App Router, Server Components |
| **Mobile Frontend** | Expo | 54.0.23 | React Native framework with managed workflow |
| **Backend** | Elysia | 1.4.16 | Bun-native web framework |
| **API Layer** | oRPC | 1.10.0 | End-to-end type-safe RPC |
| **Database** | PostgreSQL | - | Relational database (Supabase hosted) |
| **ORM** | Drizzle | 0.44.2 | Type-safe ORM with SQL-like syntax |
| **Authentication** | Better-Auth | 1.4.0 | Modern auth library |
| **AI** | Vercel AI SDK | 5.0.49 | AI integration with streaming |

### 3.2 Frontend Dependencies

| Category | Technology | Purpose |
|----------|------------|---------|
| **UI Framework** | React 19 | Component-based UI |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Components** | Radix UI / shadcn/ui | Accessible component primitives |
| **State** | TanStack Query 5 | Server state management |
| **Forms** | TanStack Form | Form state management |
| **Validation** | Zod 4 | Runtime type validation |

### 3.3 Mobile Dependencies

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | React Native 0.81 | Cross-platform native apps |
| **Navigation** | Expo Router 6 | File-based routing |
| **Styling** | NativeWind 1.0 | Tailwind for React Native |
| **Storage** | Expo SecureStore | Secure token storage |
| **Animations** | React Native Reanimated | Performant animations |

### 3.4 Development Tools

| Tool | Purpose |
|------|---------|
| **Turborepo** | Monorepo build orchestration |
| **Biome** | Linting and formatting |
| **TypeScript 5.8** | Static type checking |
| **Drizzle Kit** | Database migrations |

---

## 4. Monorepo Structure

### 4.1 Directory Layout

```
bookmarkd/
├── apps/
│   ├── web/                    # Next.js 16 web application
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   └── utils/          # Client utilities
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── native/                 # Expo React Native application
│   │   ├── app/                # Expo Router screens
│   │   ├── components/         # React Native components
│   │   ├── lib/                # Mobile utilities
│   │   ├── utils/              # Shared utilities
│   │   └── package.json
│   │
│   └── server/                 # Elysia backend API
│       ├── src/
│       │   └── index.ts        # Server entry point
│       └── package.json
│
├── packages/
│   ├── api/                    # oRPC router definitions
│   │   └── src/
│   │       ├── index.ts        # Procedure definitions
│   │       ├── context.ts      # Request context
│   │       └── routers/        # Domain routers
│   │
│   ├── auth/                   # Better-Auth configuration
│   │   └── src/
│   │       └── index.ts        # Auth setup
│   │
│   ├── db/                     # Drizzle ORM & schema
│   │   ├── src/
│   │   │   ├── index.ts        # Database client
│   │   │   └── schema/         # Table definitions
│   │   └── drizzle.config.ts
│   │
│   └── config/                 # Shared configuration
│
├── docs/                       # Documentation
├── turbo.json                  # Turborepo config
├── biome.json                  # Biome linter config
└── package.json                # Root workspace
```

### 4.2 Workspace Configuration

```json
// package.json (root)
{
  "workspaces": ["apps/*", "packages/*"],
  "catalog": {
    // Centralized dependency versions
  }
}
```

### 4.3 Turborepo Task Pipeline

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "check-types": {}
  }
}
```

---

## 5. Application Architecture

### 5.1 Web Application (Next.js)

```
apps/web/
├── src/
│   ├── app/                    # App Router
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── todos/              # Feature routes
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   │
│   ├── components/
│   │   ├── ui/                 # Base UI components (shadcn)
│   │   ├── header.tsx          # App header
│   │   └── providers.tsx       # Context providers
│   │
│   └── utils/
│       ├── orpc.ts             # oRPC client setup
│       └── auth-client.ts      # Better-Auth client
```

**Key Configuration:**
- React Compiler enabled for automatic optimization
- Server-side rendering with App Router
- Cookie-based authentication with credentials

### 5.2 Mobile Application (Expo)

```
apps/native/
├── app/                        # Expo Router
│   ├── (drawer)/               # Drawer navigation
│   │   ├── (tabs)/             # Tab navigation
│   │   │   ├── index.tsx       # Home tab
│   │   │   ├── todos.tsx       # Todos tab
│   │   │   └── ai.tsx          # AI chat tab
│   │   └── _layout.tsx
│   ├── (auth)/                 # Auth screens
│   └── _layout.tsx             # Root layout
│
├── components/                 # React Native components
├── lib/
│   └── auth-client.ts          # Expo auth client
└── utils/
    └── orpc.ts                 # oRPC client setup
```

**Key Configuration:**
- Expo Router for file-based navigation
- NativeWind for Tailwind CSS support
- SecureStore for token persistence

### 5.3 Server Application (Elysia)

```
apps/server/
├── src/
│   └── index.ts                # Server entry & routes
└── package.json
```

**Route Structure:**
```typescript
const app = new Elysia()
  .use(cors({ origin: process.env.CORS_ORIGIN }))
  .get("/", () => "OK")                           // Health check
  .all("/rpc/*", oRPCHandler)                     // oRPC endpoints
  .all("/api/auth/*", betterAuthHandler)          // Auth endpoints
  .post("/ai", aiStreamHandler);                  // AI streaming
```

---

## 6. Data Flow Architecture

### 6.1 Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Web/Mobile)                                │
│                                                                              │
│   1. Component calls orpc.todo.getAll.queryOptions()                        │
│   2. TanStack Query manages caching, refetching                             │
│   3. oRPC client serializes request                                         │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTP POST /rpc/todo.getAll
                                 │ Headers: Cookie (session)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER (Elysia)                                    │
│                                                                              │
│   4. oRPC handler receives request                                          │
│   5. Context middleware extracts session from Better-Auth                   │
│   6. Procedure validates input with Zod                                     │
│   7. Handler executes business logic                                        │
│   8. Drizzle ORM queries database                                           │
│   9. Response serialized and returned                                       │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (PostgreSQL)                              │
│                                                                              │
│   10. SQL query executed                                                    │
│   11. Results returned to ORM                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Type Flow

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Drizzle Schema │───▶│   oRPC Router    │───▶│   Client Types   │
│                  │    │                  │    │                  │
│  - Table defs    │    │  - Procedures    │    │  - Auto-inferred │
│  - Relations     │    │  - Input schemas │    │  - Query options │
│  - Types         │    │  - Output types  │    │  - Mutations     │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### 6.3 State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                      TanStack Query                              │
│                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│   │  Query Cache │   │  Mutations   │   │ Invalidation │        │
│   │              │   │              │   │              │        │
│   │ - Stale time │   │ - Optimistic │   │ - On success │        │
│   │ - GC time    │   │ - Rollback   │   │ - Manual     │        │
│   │ - Refetch    │   │ - Side effs  │   │ - Partial    │        │
│   └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Database Architecture

### 7.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION                                     │
│                                                                              │
│   ┌────────────┐      ┌────────────┐      ┌────────────┐                    │
│   │    user    │──1:N─│  session   │      │  account   │                    │
│   │            │──1:N─│            │      │   (OAuth)  │                    │
│   │ - id       │      │ - id       │      │ - id       │                    │
│   │ - email    │      │ - token    │      │ - provider │                    │
│   │ - name     │      │ - userId   │      │ - userId   │                    │
│   │ - image    │      │ - expiresAt│      │ - tokens   │                    │
│   └────────────┘      └────────────┘      └────────────┘                    │
│         │                                                                    │
│         │                                                                    │
└─────────┼────────────────────────────────────────────────────────────────────┘
          │
          │ Future Extensions
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BOOK DOMAIN                                        │
│                                                                              │
│   ┌────────────┐      ┌────────────┐      ┌────────────┐                    │
│   │    book    │──1:N─│ character  │──1:N─│   alias    │                    │
│   │            │      │            │      │            │                    │
│   │ - id       │      │ - id       │      │ - id       │                    │
│   │ - title    │      │ - name     │      │ - name     │                    │
│   │ - isbn     │      │ - bookId   │      │ - charId   │                    │
│   │ - synopsis │      │ - desc     │      │            │                    │
│   └────────────┘      └────────────┘      └────────────┘                    │
│         │                    │                                               │
│         │ 1:N                │ N:N                                           │
│         ▼                    ▼                                               │
│   ┌────────────┐      ┌────────────┐                                        │
│   │  chapter   │      │relationship│                                        │
│   │            │      │            │                                        │
│   │ - id       │      │ - charId1  │                                        │
│   │ - title    │      │ - charId2  │                                        │
│   │ - number   │      │ - type     │                                        │
│   └────────────┘      └────────────┘                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Current Schema (MVP)

**Authentication Tables (Better-Auth managed):**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user` | User identity | id, email, name, image, createdAt |
| `session` | Active sessions | id, token, userId, expiresAt, ipAddress |
| `account` | OAuth connections | id, providerId, userId, accessToken |
| `verification` | Email tokens | id, identifier, value, expiresAt |

**Application Tables:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `todo` | Demo todo items | id, text, completed |

### 7.3 Drizzle Configuration

```typescript
// packages/db/drizzle.config.ts
export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 7.4 Database Commands

| Command | Purpose |
|---------|---------|
| `bun run db:push` | Push schema to database (dev) |
| `bun run db:generate` | Generate migration files |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:studio` | Open Drizzle Studio GUI |

---

## 8. Authentication Architecture

### 8.1 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW (Web)                                  │
│                                                                           │
│   1. User submits credentials                                            │
│   2. authClient.signIn.email() called                                    │
│   3. Request to /api/auth/sign-in/email                                  │
│   4. Better-Auth validates credentials                                   │
│   5. Session created in database                                         │
│   6. HTTP-only cookie set                                                │
│   7. Client redirects to dashboard                                       │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW (Mobile)                               │
│                                                                           │
│   1. User submits credentials                                            │
│   2. authClient.signIn.email() called                                    │
│   3. Request to /api/auth/sign-in/email                                  │
│   4. Better-Auth validates credentials                                   │
│   5. Session created in database                                         │
│   6. Token stored in SecureStore                                         │
│   7. App navigates to home screen                                        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Session Management

```typescript
// packages/auth/src/index.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  advanced: {
    cookiePrefix: "bookmarkd",
    cookies: {
      session_token: {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      },
    },
  },
  trustedOrigins: [
    process.env.CORS_ORIGIN!,
    "mybettertapp://",
    "exp://",
  ],
});
```

### 8.3 Protected Procedures

```typescript
// packages/api/src/index.ts
export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    if (!context.session?.user) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({
      context: {
        session: context.session,
      },
    });
  }
);
```

---

## 9. API Architecture

### 9.1 oRPC Structure

```
packages/api/src/
├── index.ts              # Procedure definitions
│   ├── publicProcedure   # No auth required
│   └── protectedProcedure# Auth required
│
├── context.ts            # Request context setup
│   └── createContext()   # Session extraction
│
└── routers/
    ├── index.ts          # AppRouter export
    │   ├── healthCheck   # Health check endpoint
    │   ├── privateData   # Protected example
    │   └── todo          # Todo router
    │
    └── todo.ts           # Todo CRUD operations
        ├── getAll        # List todos
        ├── create        # Create todo
        ├── toggle        # Toggle completion
        └── delete        # Delete todo
```

### 9.2 Procedure Pattern

```typescript
// Public procedure - no authentication required
const getAll = publicProcedure
  .handler(async () => {
    return db.select().from(todo);
  });

// Protected procedure - requires authenticated session
const create = protectedProcedure
  .input(z.object({ text: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const { session } = context;
    // User is authenticated, session.user available
    return db.insert(todo).values({ text: input.text });
  });
```

### 9.3 Client Integration

**Web (Next.js):**
```typescript
// apps/web/src/utils/orpc.ts
const client = createORPCClient<AppRouter>({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/rpc`,
  fetch: (url, init) => fetch(url, { ...init, credentials: "include" }),
});
```

**Mobile (Expo):**
```typescript
// apps/native/utils/orpc.ts
const client = createORPCClient<AppRouter>({
  baseURL: `${process.env.EXPO_PUBLIC_SERVER_URL}/rpc`,
  headers: async () => ({
    cookie: await authClient.getCookie(),
  }),
});
```

### 9.4 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/rpc/*` | ALL | oRPC handler |
| `/api/auth/*` | ALL | Better-Auth handler |
| `/api` | GET | OpenAPI documentation |
| `/ai` | POST | AI streaming endpoint |

---

## 10. AI Integration Architecture

### 10.1 Current Implementation

```typescript
// apps/server/src/index.ts
app.post("/ai", async ({ body }) => {
  const { prompt } = body;

  const result = streamText({
    model: google("gemini-2.5-flash-preview-04-17"),
    prompt,
  });

  return result.toDataStreamResponse();
});
```

### 10.2 AI SDK Integration

| Component | Technology | Purpose |
|-----------|------------|---------|
| SDK | Vercel AI SDK 5.0 | Streaming, tool use |
| Provider | @ai-sdk/google | Google Gemini models |
| Model | gemini-2.5-flash | Fast inference |
| Client | @ai-sdk/react | React hooks |

### 10.3 MCP Architecture (Planned)

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Assistant                              │
│                       (MCP Client)                               │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    MCP Tools                             │   │
│   │                                                          │   │
│   │  • get_current_book     • search_characters             │   │
│   │  • get_character        • create_character              │   │
│   │  • generate_image                                       │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ Tool Calls
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Bookmarkd API                             │
│                                                                  │
│   /api/users/:id/currently-reading                              │
│   /api/books/:id/characters                                     │
│   /api/images/generate                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Frontend Architecture

### 11.1 Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         Root Layout                              │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     Providers                            │   │
│   │   • QueryClientProvider (TanStack Query)                │   │
│   │   • ThemeProvider (next-themes)                         │   │
│   │   • ORPCProvider (React Query integration)              │   │
│   │                                                          │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │                  Page Layout                     │   │   │
│   │   │   • Header                                       │   │   │
│   │   │   • Main Content                                 │   │   │
│   │   │   • Toaster (Sonner)                            │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 UI Component System

Based on **shadcn/ui** with Radix UI primitives:

| Category | Components |
|----------|------------|
| **Layout** | Card, Separator, Scroll Area |
| **Forms** | Button, Input, Checkbox, Select |
| **Feedback** | Toast (Sonner), Skeleton |
| **Navigation** | Tabs, Navigation Menu |
| **Overlay** | Dialog, Dropdown Menu, Popover |

### 11.3 Styling Architecture

```
Tailwind CSS 4
    │
    ├── Global Styles (globals.css)
    │   └── CSS Variables (--background, --foreground, etc.)
    │
    ├── Component Variants (CVA)
    │   └── class-variance-authority
    │
    └── Utility Composition
        └── clsx + tailwind-merge (cn function)
```

---

## 12. Mobile Architecture

### 12.1 Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        Root Navigator                            │
│                     (Expo Router Stack)                          │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   Drawer Navigator                       │   │
│   │                                                          │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │               Tab Navigator                      │   │   │
│   │   │                                                  │   │   │
│   │   │   ┌───────┐  ┌───────┐  ┌───────┐              │   │   │
│   │   │   │ Home  │  │ Todos │  │  AI   │              │   │   │
│   │   │   └───────┘  └───────┘  └───────┘              │   │   │
│   │   │                                                  │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Auth Screens                          │   │
│   │   • Sign In                                             │   │
│   │   • Sign Up                                             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Mobile-Specific Patterns

| Pattern | Implementation |
|---------|----------------|
| **Secure Storage** | Expo SecureStore for tokens |
| **Deep Linking** | Expo Router with scheme |
| **Offline** | TanStack Query persistence (planned) |
| **Push Notifications** | Expo Notifications (planned) |

---

## 13. Security Architecture

### 13.1 Authentication Security

| Layer | Measure |
|-------|---------|
| **Password** | Hashed with bcrypt (Better-Auth) |
| **Session** | HTTP-only, Secure, SameSite cookies |
| **Token** | Cryptographically signed session tokens |
| **Mobile** | Expo SecureStore (Keychain/Keystore) |

### 13.2 API Security

| Layer | Measure |
|-------|---------|
| **CORS** | Configured origin whitelist |
| **Input** | Zod validation on all inputs |
| **Auth** | Protected procedures for sensitive endpoints |
| **Rate Limiting** | Planned with Elysia plugins |

### 13.3 Data Security

| Layer | Measure |
|-------|---------|
| **Transport** | HTTPS everywhere |
| **Database** | Supabase managed security |
| **Secrets** | Environment variables (never committed) |

---

## 14. Deployment Architecture

### 14.1 Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PRODUCTION                                        │
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│   │     Vercel      │    │   Railway/Fly   │    │    Supabase     │         │
│   │                 │    │                 │    │                 │         │
│   │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │         │
│   │  │  Next.js  │  │    │  │  Elysia   │  │    │  │PostgreSQL │  │         │
│   │  │    Web    │──┼────┼─▶│  Server   │──┼────┼─▶│    DB     │  │         │
│   │  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │         │
│   │                 │    │                 │    │                 │         │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐                                │
│   │   App Store     │    │   Play Store    │                                │
│   │                 │    │                 │                                │
│   │  ┌───────────┐  │    │  ┌───────────┐  │                                │
│   │  │    iOS    │  │    │  │  Android  │  │                                │
│   │  │    App    │  │    │  │    App    │  │                                │
│   │  └───────────┘  │    │  └───────────┘  │                                │
│   │                 │    │                 │                                │
│   └─────────────────┘    └─────────────────┘                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 14.2 Deployment Targets

| Component | Platform | Method |
|-----------|----------|--------|
| **Web** | Vercel | Git push (auto-deploy) |
| **Server** | Railway / Fly.io | Docker container |
| **Database** | Supabase | Managed PostgreSQL |
| **iOS** | App Store | Expo EAS Build |
| **Android** | Play Store | Expo EAS Build |

### 14.3 Environment Configuration

**Server (.env):**
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...
CORS_ORIGIN=...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

**Web (.env.local):**
```bash
NEXT_PUBLIC_SERVER_URL=...
```

**Mobile (.env):**
```bash
EXPO_PUBLIC_SERVER_URL=...
```

---

## 15. Development Workflow

### 15.1 Setup Commands

```bash
# Install dependencies
bun install

# Start all apps in development
bun run dev

# Start individual apps
bun run dev:web      # Web on :3001
bun run dev:server   # Server on :3000
bun run dev:native   # Expo dev server
```

### 15.2 Database Commands

```bash
bun run db:push      # Push schema to DB
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

### 15.3 Code Quality

```bash
bun run check        # Biome lint + format check
bun run check-types  # TypeScript type check
```

### 15.4 Build Commands

```bash
bun run build        # Build all apps
```

### 15.5 Git Workflow

```
main
  │
  ├── feature/xyz    # Feature branches
  │
  └── fix/abc        # Bug fix branches
```

---

## Appendix: Quick Reference

### Ports

| Service | Port |
|---------|------|
| Web (Next.js) | 3001 |
| Server (Elysia) | 3000 |
| Drizzle Studio | 4983 |

### Package Dependencies

| Package | Depends On |
|---------|------------|
| `apps/web` | `packages/api`, `packages/auth` |
| `apps/native` | `packages/api`, `packages/auth` |
| `apps/server` | `packages/api`, `packages/auth`, `packages/db` |
| `packages/api` | `packages/db` |
| `packages/auth` | `packages/db` |

### Key Files

| File | Purpose |
|------|---------|
| `turbo.json` | Turborepo task configuration |
| `biome.json` | Linter/formatter rules |
| `packages/db/drizzle.config.ts` | Database configuration |
| `packages/auth/src/index.ts` | Authentication setup |
| `packages/api/src/routers/index.ts` | API router definitions |

---

*— End of Document —*
