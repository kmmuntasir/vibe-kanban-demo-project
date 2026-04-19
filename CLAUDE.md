# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Workshop demo showcasing AI-assisted development velocity. Express.js backend + vanilla HTML frontend + SQLite. Intentionally partially built — some features are deliberately missing for live implementation during demos.

**PROJECTSLUG**: `VKD` (used in branch names, commit messages, ticket references)

## Architecture

Layered pattern — each layer talks only to its adjacent layer:

```
Routes → Controllers → Services → Repositories → DB (SQLite via better-sqlite3)
```

| Layer | Dir | Role |
|-------|-----|------|
| Routes | `src/routes/` | HTTP path → controller binding. No logic. |
| Controllers | `src/controllers/` | Parse req, call service, shape res. No business logic. |
| Services | `src/services/` | Business rules, validation. No HTTP details. |
| Repositories | `src/repositories/` | Raw SQL. Returns plain objects. |
| Models | `src/models/` | Schema/column/table definitions. Single source of truth. |
| Middleware | `src/middleware/` | Validation, error handling. |
| Utils | `src/utils/` | DB connection singleton (`db.js`). |

Frontend is a single `public/index.html` served by Express static middleware.

## Tech Stack

- Node.js 18+, Express.js, ES modules (`import`/`export`)
- SQLite via `better-sqlite3` (synchronous API, WAL mode)
- Vanilla HTML/CSS/JS — no frameworks, no build step
- Jest for tests (requires `--experimental-vm-modules` via `NODE_OPTIONS`)

## Commands

All commands should be prefixed with `rtk` for token efficiency.

```bash
rtk npm test                # Run all tests
rtk npm run dev             # Dev server with hot-reload
rtk npm run start           # Production server
rtk npm run lint            # ESLint
rtk npm run lint:fix        # ESLint auto-fix
NODE_OPTIONS=--experimental-vm-modules npx jest src/path.test.js   # Single test file
```

## Git Conventions

- **Never run git commands without user approval**
- Merge policy: Rebase and Merge only (no merge commits, no squash)
- Branch: `type/VKD-TICKET_NUMBER-description` (e.g., `feature/VKD-1-add-user-list`)
- Commit: `VKD-TICKET_NUMBER: message` (single line)

## Key Patterns

- Error classes: `AppError`, `NotFoundError`, `ValidationError` — all extend `Error` with `statusCode`
- DB: one connection per process, parameterized queries via `?` placeholders only
- Tests: co-located (`*.test.js`), SQLite in-memory for isolation, supertest for HTTP handlers
- AI-generated docs go in `./docs/ai_generated/`; permanent team docs in `./docs/references/`

## Intentional Gaps (Workshop Scope)

These features are deliberately unimplemented — they're meant to be built live:

1. `GET /api/users` endpoint (route, controller, service, repository)
2. Frontend fetch + table rendering on page load
3. "Add User" form refreshing the table after submission

## Database

Schema created on server startup via `database/init.js`. Single `users` table with: `id`, `username`, `full_name`, `email`, `phone`, `created_at`.

## PRD

Full specification at `docs/PRD.md` — refer to it for API contracts, validation rules, and acceptance criteria.
