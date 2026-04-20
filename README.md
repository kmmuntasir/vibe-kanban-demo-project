# Vibe Kanban Demo Project

Workshop demo showcasing AI-assisted development velocity. Express.js backend + vanilla HTML frontend + SQLite. Intentionally partially built — some features are deliberately missing for live implementation during demos.

## Tech Stack

- **Runtime**: Node.js 18+ (ES modules)
- **Backend**: Express.js with async error handling
- **Database**: SQLite via `better-sqlite3` (WAL mode, synchronous API)
- **Frontend**: Vanilla HTML/CSS/JS — no frameworks, no build step
- **Testing**: Jest + supertest, SQLite in-memory for isolation

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start dev server (hot-reload)
npm run dev

# Start production server
npm start
```

App runs at `http://localhost:3000`.

## Architecture

```
Routes → Controllers → Services → Repositories → DB (SQLite)
```

| Layer | Directory | Role |
|-------|-----------|------|
| Routes | `src/routes/` | HTTP path → controller binding |
| Controllers | `src/controllers/` | Parse req, call service, shape res |
| Services | `src/services/` | Business rules, validation |
| Repositories | `src/repositories/` | Raw SQL, plain objects |
| Models | `src/models/` | Schema/column/table definitions |
| Middleware | `src/middleware/` | Validation, error handling |
| Database | `src/database/` | Schema init, migrations |
| Utils | `src/utils/` | DB connection singleton |

Frontend is a single `public/index.html` served by Express static middleware.

## Commands

```bash
npm run dev          # Dev server with hot-reload
npm start            # Production server
npm test             # Run all tests
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
```

## Project Structure

```
src/
  app.js             # Express app setup
  server.js          # Entry point, starts server
  controllers/       # Request handlers
  database/          # Schema init
  middleware/        # Validation, error handling
  models/            # Table/column definitions
  repositories/      # Data access (SQL)
  routes/            # Route bindings
  services/          # Business logic
  utils/             # DB connection singleton
public/
  index.html         # Frontend SPA
docs/
  PRD.md             # Product requirements
  ai_generated/      # AI-generated documentation
  references/        # Permanent team docs
```

## Database

Single `users` table: `id`, `username`, `full_name`, `email`, `phone`, `created_at`. Schema auto-created on startup via `src/database/init.js`.

## License

ISC
