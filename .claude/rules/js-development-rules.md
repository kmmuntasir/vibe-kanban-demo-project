# JavaScript Development Rules

## General

Node.js 18+ LTS, Express.js, ESM (`import`/`export`). No TypeScript.

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
- Minimal deps — Express, better-sqlite3, few utilities. No heavy frameworks, no ORM.
- Scripts: `start`, `dev`, `test`, `lint`.

### Error Handling

- Wrap async routes to catch rejected promises (`express-async-errors` or manual try/catch).
- Custom error classes: `NotFoundError`, `ValidationError`, `AuthError`.

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

- Centralized error middleware. No stack traces in production.

```js
app.use((err, req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});
```

- Status codes: 400 validation, 401 auth, 404 not found, 500 server.

### Logging

- Structured JSON logging in production. Use library or `console` wrapper with levels.
- Never log passwords, tokens, secrets.
- Log: server start, requests (debug), errors, auth failures.

### Concurrency

- Express uses Node event loop — no goroutine equivalents.
- `setImmediate` / `process.nextTick` only when needed.
- better-sqlite3 synchronous API serializes DB writes — no races.
- Avoid blocking event loop with heavy CPU work.

### Environment Configuration

All config via env vars. No config files.

| Variable | Required | Default |
|---|---|---|
| `PORT` | No | `3000` |
| `DATABASE_PATH` | No | `./data/kanban.db` |
| `SESSION_SECRET` | Yes | — |
| `NODE_ENV` | No | `development` |
| `LOG_LEVEL` | No | `info` |

### HTTP Server

- `http` + Express only. No alternative frameworks.
- CORS for appropriate origins.
- JSON body parser with size limits.

```js
app.use(express.json({ limit: '1mb' }));
```

- Rate limiting on API routes.
- Static file serving for `public/`.

### Security

- No secrets in code — env vars only.
- Parameterized queries only (better-sqlite3 `?` placeholders).
- Input validation at boundaries (express-validator or manual).
- HTTP-only, secure, same-site session cookies.
- Helmet.js for security headers.
- No `eval`, no unsanitized `innerHTML`.

### Database (SQLite)

- better-sqlite3 — synchronous API, no callback complexity.
- One connection per process (not thread-safe).
- Migrations as numbered SQL files in `src/db/migrations/`.
- Parameterized queries always — never string interpolation.

```js
// Good
db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);

// Bad — SQL injection risk
db.prepare(`SELECT * FROM boards WHERE id = '${boardId}'`).get();
```

- WAL mode for read concurrency.

```js
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```