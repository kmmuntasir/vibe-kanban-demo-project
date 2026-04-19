# Product Requirements Document — Vibe Kanban Demo Project

## 1. Overview

A lightweight demo application designed to showcase the velocity gains of Agentic AI-assisted development. The project is a minimal **User Management** interface — an Express.js backend serving a single-page HTML frontend, backed by an SQLite database.

The app is intentionally **partially implemented**. A live workshop will demonstrate how an AI agent completes the missing pieces in real time.

---

## 2. Goals & Non-Goals

### Goals
- Provide a working skeleton that workshop participants can extend using an AI agent.
- Demonstrate that AI agents can read a PRD, understand a partially-built codebase, and ship working features end-to-end.
- Keep the tech stack simple enough that the focus stays on the **development process**, not tooling complexity.

### Non-Goals
- Production-grade security, authentication, or deployment.
- Responsive design or cross-browser polish.
- Multi-user or concurrent access handling.

---

## 3. Tech Stack

| Layer      | Technology          | Rationale                                      |
|------------|---------------------|-------------------------------------------------|
| Backend    | Express.js (Node)   | Minimal setup, widely understood                |
| Database   | SQLite (via `better-sqlite3` or `sqlite3`) | Zero-config, file-based, no external DB server |
| Frontend   | Vanilla HTML/CSS/JS | Single `index.html` served as static file       |
| Styling    | Plain CSS (no framework) | Keep dependencies near zero                  |

### Project Structure (Expected)

The backend follows a **layered architecture** to showcase real-world API best practices. Each layer has a single responsibility and communicates only with its adjacent layers.

```
├── src/
│   ├── app.js                         # Express app setup (middleware, route mounting)
│   ├── server.js                      # Entry point — starts HTTP server
│   ├── routes/
│   │   └── userRoutes.js              # Route definitions (path → controller method)
│   ├── controllers/
│   │   └── userController.js          # Request parsing, response shaping, delegates to service
│   ├── services/
│   │   └── userService.js             # Business logic, validation, orchestration
│   ├── repositories/
│   │   └── userRepository.js          # Data access — all SQL queries live here
│   ├── models/
│   │   └── userModel.js               # Table schema, column definitions, constants
│   ├── middleware/
│   │   ├── errorHandler.js            # Global error-handling middleware
│   │   └── validateRequest.js         # Request body validation middleware
│   └── utils/
│       └── db.js                      # Database connection singleton
├── database/
│   ├── init.js                        # Schema creation & seed data
│   └── app.db                         # SQLite database file (generated at runtime)
├── public/
│   └── index.html                     # Single-page frontend
├── package.json
├── docs/
│   └── PRD.md                         # This document
└── README.md
```

#### Layer Responsibilities

| Layer | File(s) | Role |
|-------|---------|------|
| **Routes** | `routes/*.js` | Bind HTTP paths + methods to controller functions. No logic. |
| **Controllers** | `controllers/*.js` | Extract params from `req`, call service, send `res`. No business logic. |
| **Services** | `services/*.js` | Business rules, validation, error handling. Calls repository. No HTTP details. |
| **Repositories** | `repositories/*.js` | Raw SQL / ORM calls. Returns plain objects. No business logic. |
| **Models** | `models/*.js` | Schema definitions, column names, table names. Single source of truth for structure. |
| **Middleware** | `middleware/*.js` | Cross-cutting concerns — validation, error handling. |
| **Utils** | `utils/db.js` | Database connection singleton used by all repositories. |

---

## 4. Data Model

### `users` Table

| Column     | Type    | Constraints                   |
|------------|---------|-------------------------------|
| id         | INTEGER | PRIMARY KEY, AUTOINCREMENT    |
| username   | TEXT    | NOT NULL, UNIQUE              |
| full_name  | TEXT    | NOT NULL                      |
| email      | TEXT    | NOT NULL, UNIQUE              |
| phone      | TEXT    | —                             |
| created_at | TEXT    | DEFAULT CURRENT_TIMESTAMP     |

The schema is created on server startup if the table does not already exist.

---

## 5. API Specification

All endpoints are defined in `src/routes/userRoutes.js`, handled by `src/controllers/userController.js`, backed by `src/services/userService.js` and `src/repositories/userRepository.js`.

### 5.1 `POST /api/users` — Add a User

Creates a new user record.

**Request Body (JSON):**

```json
{
  "username": "jdoe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123"
}
```

**Responses:**

| Status | Meaning              | Body                                      |
|--------|----------------------|-------------------------------------------|
| 201    | User created         | `{ "id": 1, "username": "jdoe", ... }`   |
| 400    | Validation error     | `{ "error": "username is required" }`     |
| 409    | Duplicate username/email | `{ "error": "username already exists" }` |

**Validation Rules:**
- `username`: required, non-empty, alphanumeric + underscores
- `full_name`: required, non-empty
- `email`: required, valid email format
- `phone`: optional

### 5.2 `GET /api/users` — List All Users *(not implemented — workshop demo)*

Returns all users sorted by `created_at` descending.

**Response (200):**

```json
[
  {
    "id": 1,
    "username": "jdoe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "555-0123",
    "created_at": "2026-04-19T10:00:00Z"
  }
]
```

> **Note:** This endpoint is intentionally omitted from the starter code. It will be built live during the workshop.

---

## 6. Frontend Specification

The frontend is a single `public/index.html` file, served statically by Express at `GET /`.

### 6.1 User List Section

- Heading: **"User List"**
- Should contain an HTML `<table>` with columns: ID, Username, Full Name, Email, Phone
- **Starter state:** Instead of a populated table, display the message:
  > *"This feature is not implemented yet."*
- **Workshop goal:** Replace the placeholder with a live table that fetches data from `GET /api/users` on page load.

### 6.2 Add User Form

Positioned below the User List section.

| Field      | Input Type | Required | Placeholder / Label |
|------------|------------|----------|---------------------|
| Username   | text       | Yes      | "Username"          |
| Full Name  | text       | Yes      | "Full Name"         |
| Email      | email      | Yes      | "Email"             |
| Phone      | tel        | No       | "Phone"             |

**Behavior:**
- Submit button labeled **"Add User"**
- On submit: `POST /api/users` with JSON body
- On success (201): clear form, show success message, refresh user list table
- On error: display error message near the form

---

## 7. Intentional Gaps (Workshop Demo Scope)

These features are deliberately left unimplemented so they can be built live:

| #  | Gap                                          | Layer (files)                                                           |
|----|----------------------------------------------|-------------------------------------------------------------------------|
| 1  | `GET /api/users` endpoint                    | Backend — route, controller, service, repository all missing for GET   |
| 2  | Frontend fetch + table rendering on load     | Frontend                                                               |
| 3  | Wiring "Add User" form to refresh the table  | Frontend                                                               |

The workshop facilitator will use an AI coding agent to implement all three gaps in a live demonstration.

---

## 8. Acceptance Criteria

After the workshop demo, the application should satisfy:

- [ ] `GET /api/users` returns all users as JSON
- [ ] The User List table populates automatically on page load
- [ ] Adding a user via the form immediately updates the table
- [ ] Validation errors display meaningful messages in the UI
- [ ] Duplicate username/email returns a clear error, not a crash

---

## 9. Out of Scope / Future Considerations

- Delete or update user operations
- Pagination or search/filter
- User authentication or authorization
- Unit or integration tests (unless demonstrated as part of the workshop)
- Docker or deployment configuration
