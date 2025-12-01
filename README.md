# bookmarkd

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Elysia, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Elysia** - Type-safe, high-performance framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:
```bash
bun run db:push
```


Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
The API is running at [http://localhost:3000](http://localhost:3000).







## Project Structure

```
bookmarkd/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Backend API (Elysia, ORPC)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run dev:native`: Start the React Native/Expo development server
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting

---

v2
Started supabase local development setup.

╭──────────────────────────────────────╮
│ 🛠️  Development Tools                 │
├─────────┬────────────────────────────┤
│ Studio  │ http://127.0.0.1:54323     │
│ Mailpit │ http://127.0.0.1:54324     │
│ MCP     │ http://127.0.0.1:54321/mcp │
╰─────────┴────────────────────────────╯

╭──────────────────────────────────────────────────────╮
│ 🌐 APIs                                              │
├────────────────┬─────────────────────────────────────┤
│ Project URL    │ http://127.0.0.1:54321              │
│ REST           │ http://127.0.0.1:54321/rest/v1      │
│ GraphQL        │ http://127.0.0.1:54321/graphql/v1   │
│ Edge Functions │ http://127.0.0.1:54321/functions/v1 │
╰────────────────┴─────────────────────────────────────╯

╭───────────────────────────────────────────────────────────────╮
│ 🗄️  Database                                                   │
├─────┬─────────────────────────────────────────────────────────┤
│ URL │ postgresql://postgres:postgres@127.0.0.1:54322/postgres │
╰─────┴─────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│ 🔑 Authentication Keys                                       │
├─────────────┬────────────────────────────────────────────────┤
│ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │
│ Secret      │ sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz      │
╰─────────────┴────────────────────────────────────────────────╯

╭───────────────────────────────────────────────────────────────────────────────╮
│ 📦 Storage (S3)                                                               │
├────────────┬──────────────────────────────────────────────────────────────────┤
│ URL        │ http://127.0.0.1:54321/storage/v1/s3                             │
│ Access Key │ 625729a08b95bf1b7ff351a663f3a23c                                 │
│ Secret Key │ 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907 │
│ Region     │ local                                                            │
╰────────────┴──────────────────────────────────────────────────────────────────╯

│
■  Supabase started, but could not extract DB URL automatically.
│
●  "Manual Supabase Setup Instructions:"
│  1. Ensure Docker is installed and running.
│  2. Install the Supabase CLI (e.g., `npm install -g supabase`).
│  3. Run `supabase init` in your project's `packages/db` directory.
│  4. Run `supabase start` in your project's `packages/db` directory.
│  5. Copy the 'DB URL' from the output.
│  Relevant output from `supabase start`:
│  ╭──────────────────────────────────────╮
│  │ 🛠️  Development Tools                 │
│  ├─────────┬────────────────────────────┤
│  │ Studio  │ http://127.0.0.1:54323     │
│  │ Mailpit │ http://127.0.0.1:54324     │
│  │ MCP     │ http://127.0.0.1:54321/mcp │
│  ╰─────────┴────────────────────────────╯

│  ╭──────────────────────────────────────────────────────╮
│  │ 🌐 APIs                                              │
│  ├────────────────┬─────────────────────────────────────┤
│  │ Project URL    │ http://127.0.0.1:54321              │
│  │ REST           │ http://127.0.0.1:54321/rest/v1      │
│  │ GraphQL        │ http://127.0.0.1:54321/graphql/v1   │
│  │ Edge Functions │ http://127.0.0.1:54321/functions/v1 │
│  ╰────────────────┴─────────────────────────────────────╯

│  ╭───────────────────────────────────────────────────────────────╮
│  │ 🗄️  Database                                                   │
│  ├─────┬─────────────────────────────────────────────────────────┤
│  │ URL │ postgresql://postgres:postgres@127.0.0.1:54322/postgres │
│  ╰─────┴─────────────────────────────────────────────────────────╯

│  ╭──────────────────────────────────────────────────────────────╮
│  │ 🔑 Authentication Keys                                       │
│  ├─────────────┬────────────────────────────────────────────────┤
│  │ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │
│  │ Secret      │ sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz      │
│  ╰─────────────┴────────────────────────────────────────────────╯

│  ╭───────────────────────────────────────────────────────────────────────────────╮
│  │ 📦 Storage (S3)                                                               │
│  ├────────────┬──────────────────────────────────────────────────────────────────┤
│  │ URL        │ http://127.0.0.1:54321/storage/v1/s3                             │
│  │ Access Key │ 625729a08b95bf1b7ff351a663f3a23c                                 │
│  │ Secret Key │ 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907 │
│  │ Region     │ local                                                            │
│  ╰────────────┴──────────────────────────────────────────────────────────────────╯

│  
│  6. Add the DB URL to the .env file in `packages/db/.env` as `DATABASE_URL`:
│           DATABASE_URL="your_supabase_db_url"
│
◆  Project template successfully scaffolded!
│
◒  Running bun inswarn: incorrect peer dependency "@sinclair/typebox@0.27.8"
◇  Dependencies installed successfully

╭───────────────────────────────────────────────────────────────────────────╮
│                                                                           │
│  Next steps                                                               │
│  1. cd bookmarkd                                                          │
│  2. bun run dev                                                           │
│  Your project will be available at:                                       │
│  • Frontend: http://localhost:3001                                        │
│  • Backend API: http://localhost:3000                                     │
│  • OpenAPI (Scalar UI): http://localhost:3000/api-reference               │
│                                                                           │
│  NOTE: For Expo connectivity issues, update                               │
│     apps/native/.env with your local IP address:                          │
│     EXPO_PUBLIC_SERVER_URL=http://<YOUR_LOCAL_IP>:3000                    │
│                                                                           │
│  Database commands:                                                       │
│  • Apply schema: bun run db:push                                          │
│  • Database UI: bun run db:studio                                         │
│                                                                           │
│  Linting and formatting:                                                  │
│  • Format and lint fix: bun run check                                     │
│                                                                           │
│  WARNING: 'bun' might cause issues with web + native apps in a monorepo.  │
│     Use 'pnpm' if problems arise.                                         │
│                                                                           │
│  Like Better-T-Stack? Please consider giving us a star                    │
│     on GitHub:                                                            │
│  https://github.com/AmanVarshney01/create-better-t-stack                  │
│                                                                           │
╰───────────────────────────────────────────────────────────────────────────╯

│
◆  You can reproduce this setup with the following command:
│  bun create better-t-stack@latest bookmarkd --frontend next native-uniwind --backend elysia --runtime bun --database postgres --orm drizzle --api orpc --auth better-auth --payments none --addons biome turborepo --examples ai todo --db-setup supabase --web-deploy none --server-deploy none --git --package-manager bun --install
│
└  Project created successfully in 44.27 seconds!