# JavaScript Development Rules

## General

Node.js 18+ LTS, Express.js, ES modules (`import`/`export`). No TypeScript.

### Project Structure

```
src/
  index.js          # Entry point — creates Express app, starts server
  routes/           # Route handlers
  middleware/        # Custom middleware (auth, logging, error handling)
  models/           # Database models / data access layer
  db/               # SQLite connection setup and migrations
public/             # Static HTML/CSS/JS files served by Express
```

### Package Conventions

- `package.json` with `"type": "module"` for ESM.
- Dependencies minimal — Express, better-sqlite3, and a few utilities. No heavy frameworks, no ORM.
- Scripts: `start`, `dev`, `test`, `lint`.

### Error Handling

- Async route handlers wrapped to catch rejected promises (use `express-async-errors` or manual try/catch wrappers).
- Custom error classes for app-specific errors (`NotFoundError`, `ValidationError`, `AuthError`).

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}
```

- Centralized error handling middleware — never send stack traces in production.

```js
app.use((err, req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});
```

- HTTP status codes: 400 for validation, 401 for auth, 404 for not found, 500 for server errors.

### Logging

- Structured logging (JSON format in production). Use a logging library or a simple wrapper around `console` with levels.
- Never log sensitive data (passwords, tokens, session secrets).
- Log key events: server start, requests (at debug level), errors, auth failures.

### Concurrency

- Express handles concurrency via Node's event loop — no goroutine equivalents.
- Use `setImmediate` / `process.nextTick` only when needed, not as a general pattern.
- Database writes serialized via better-sqlite3's synchronous API (no race conditions).
- Avoid blocking the event loop with heavy CPU work.

### Environment Configuration

All config via environment variables. No config files.

| Variable | Required | Default |
|---|---|---|
| `PORT` | No | `3000` |
| `DATABASE_PATH` | No | `./data/kanban.db` |
| `SESSION_SECRET` | Yes | — |
| `NODE_ENV` | No | `development` |
| `LOG_LEVEL` | No | `info` |

### HTTP Server

- `http` + Express — no alternative frameworks.
- CORS configured for appropriate origins.
- JSON body parser with size limits.

```js
app.use(express.json({ limit: '1mb' }));
```

- Rate limiting for API routes.
- Static file serving for `public/` directory.

### Security

- No secrets in code — all via environment variables.
- Parameterized queries only (better-sqlite3 handles this via `?` placeholders).
- Input validation at system boundaries (express-validator or manual checks).
- HTTP-only, secure, same-site cookies for sessions.
- Helmet.js for security headers.
- No `eval`, no `innerHTML` without sanitization.

### Database (SQLite)

- Use better-sqlite3 (synchronous API, no callback complexity).
- One database connection per process (better-sqlite3 is not thread-safe).
- Migrations stored as numbered SQL files in `src/db/migrations/`.
- Always use parameterized queries — never string interpolation for SQL.

```js
// Good
db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);

// Bad — SQL injection risk
db.prepare(`SELECT * FROM boards WHERE id = '${boardId}'`).get();
```

- WAL mode for better read concurrency.

```js
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```
