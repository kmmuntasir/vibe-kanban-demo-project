# PRD — Vibe Kanban Demo Project

## Overview

Workshop demo for AI-assisted dev velocity. User Management app — Express backend + vanilla HTML frontend + SQLite. Intentionally partially built. Live workshop: AI agent completes missing pieces.

## Goals / Non-Goals

**Goals:**
- Working skeleton extensible via AI agent
- Demo AI reading PRD + shipping features end-to-end
- Simple tech stack — focus on process, not tooling
- Full CRUD: Add, List, Update, Delete users

**Non-Goals:**
- Production auth/security/deployment
- Responsive/cross-browser polish
- Multi-user/concurrent access
- Pagination/search/filter
- Tests (unless workshop demo)
- Docker/deploy config

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Backend | Express.js (Node) | Minimal, widely known |
| DB | SQLite (`better-sqlite3`) | Zero-config, file-based |
| Frontend | Vanilla HTML/CSS/JS | Single `index.html`, static |
| Styling | Plain CSS | Near-zero deps |

## Project Structure

```
src/
  app.js                      # Express setup (middleware, routes)
  server.js                   # Entry — starts HTTP server
  routes/userRoutes.js        # Path → controller binding
  controllers/userController.js # Parse req, call service, send res
  services/userService.js     # Business logic, validation
  repositories/userRepository.js # SQL queries only
  models/userModel.js         # Schema, columns, table defs
  middleware/
    errorHandler.js           # Global error handler
    validateRequest.js        # Request body validation
  utils/db.js                 # DB connection singleton
database/
  init.js                     # Schema + seed data
  app.db                      # SQLite file (runtime-generated)
public/index.html             # Single-page frontend
package.json
docs/PRD.md                   # This doc
README.md
```

### Layer Rules

| Layer | Role |
|-------|------|
| Routes | HTTP path + method → controller. No logic. |
| Controllers | Extract req params, call service, send res. No business logic. |
| Services | Business rules, validation. No HTTP details. |
| Repositories | Raw SQL. Plain objects. No business logic. |
| Models | Schema/column/table definitions. Single source of truth. |
| Middleware | Validation, error handling. Cross-cutting. |
| Utils | DB connection singleton. |

## Data Model

### `users` Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| username | TEXT | NOT NULL, UNIQUE |
| full_name | TEXT | NOT NULL |
| email | TEXT | NOT NULL, UNIQUE |
| phone | TEXT | — |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

Schema auto-created on startup if missing.

## API Spec

Full docs: [`docs/api-docs.md`](api-docs.md)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users` | Add User |
| GET | `/api/users` | List All Users |
| PUT | `/api/users/:id` | Update User |
| DELETE | `/api/users/:id` | Delete User |

All endpoints: Routes → Controllers → Services → Repositories → DB.

## Frontend Spec

Single `public/index.html`, served at `GET /`.

### User List

- Heading: **"User List"**
- `<table>` columns: ID, Username, Full Name, Email, Phone
- Starter: placeholder *"This feature is not implemented yet."*
- Workshop: replace with live table fetching `GET /api/users` on page load

### Add User Form

Below User List.

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| Username | text | Yes | "Username" |
| Full Name | text | Yes | "Full Name" |
| Email | email | Yes | "Email" |
| Phone | tel | No | "Phone" |

- Submit: **"Add User"**
- On submit: `POST /api/users` (JSON)
- Success (201): clear form, show message, refresh table
- Error: show error near form

## Out of Scope

Pagination/search, auth, tests (unless workshop), Docker/deploy
