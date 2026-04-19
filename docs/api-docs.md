# API Documentation — Vibe Kanban Demo Project

Base URL: `http://localhost:3000`

---

## Endpoints

### `POST /api/users` — Create a User

Creates a new user record.

#### Request

```
POST /api/users
Content-Type: application/json
```

```json
{
  "username": "jdoe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123"
}
```

#### Fields

| Field      | Type   | Required | Rules                        |
|------------|--------|----------|------------------------------|
| username   | string | Yes      | Non-empty, alphanumeric + `_` |
| full_name  | string | Yes      | Non-empty                    |
| email      | string | Yes      | Valid email format           |
| phone      | string | No       | —                            |

#### Responses

| Status | Meaning              | Body                                            |
|--------|----------------------|--------------------------------------------------|
| 201    | User created         | `{ "id": 1, "username": "jdoe", ... }`          |
| 400    | Validation error     | `{ "error": "username is required" }`            |
| 409    | Duplicate field      | `{ "error": "username already exists" }`         |

#### Example — Success

```json
// 201 Created
{
  "id": 1,
  "username": "jdoe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123"
}
```

#### Example — Validation Error

```json
// 400 Bad Request
{
  "error": "username is required"
}
```

#### Example — Duplicate

```json
// 409 Conflict
{
  "error": "username already exists"
}
```

---

### `GET /api/users` — List All Users

Returns all users sorted by `created_at` descending.

#### Request

```
GET /api/users
```

No parameters or request body.

#### Responses

| Status | Meaning       | Body                        |
|--------|---------------|------------------------------|
| 200    | Success       | Array of user objects        |

#### Example — Success

```json
// 200 OK
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

Returns empty array `[]` when no users exist.

---

## Error Response Format

All errors follow a consistent shape:

```json
{
  "error": "Description of what went wrong"
}
```

| Status | When                                |
|--------|--------------------------------------|
| 400    | Missing/invalid required fields      |
| 409    | Unique constraint violation (username or email) |
| 500    | Unexpected server error               |

---

## Data Model

### `users` Table

| Column     | Type    | Constraints                   |
|------------|---------|-------------------------------|
| id         | INTEGER | PRIMARY KEY, AUTOINCREMENT    |
| username   | TEXT    | NOT NULL, UNIQUE              |
| full_name  | TEXT    | NOT NULL                      |
| email      | TEXT    | NOT NULL, UNIQUE              |
| phone      | TEXT    | Nullable                      |
| created_at | TEXT    | DEFAULT CURRENT_TIMESTAMP     |

---

## Architecture

```
Routes (userRoutes.js)
  → Controllers (userController.js)
    → Services (userService.js)
      → Repositories (userRepository.js)
        → Database (SQLite via better-sqlite3)
```

Each layer has single responsibility. Routes bind paths to controllers, controllers parse requests and shape responses, services hold business logic, repositories execute SQL.
