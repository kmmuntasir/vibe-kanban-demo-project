# JavaScript Style Guide

## Formatting

- 2-space indent
- Single quotes
- No semicolons OK, stay consistent
- Trailing commas in multi-line objects/arrays
- Line length: ~100-120 chars practical max
- Prettier if configured, else follow these conventions

## Naming Conventions

### Variables & Functions

- camelCase for variables/functions: `getUserById`, `requestHandler`
- PascalCase for classes/constructors: `DatabaseManager`
- UPPER_SNAKE_CASE for true constants: `MAX_RETRIES`, `DEFAULT_PORT`
- `_` prefix for intentionally unused vars (e.g., destructuring)

### Files

- kebab-case filenames: `user-routes.js`, `error-handler.js`
- `*.routes.js` routes, `*.middleware.js` middleware, `*.model.js` data access

### Directories

- lowercase, no underscores: `routes/`, `middleware/`, `db/`

## Import Organization

```js
// 1. Node.js built-ins
import path from 'node:path';
import { createServer } from 'node:http';

// 2. npm packages
import express from 'express';
import Database from 'better-sqlite3';

// 3. Local project modules
import { authMiddleware } from './middleware/auth.js';
import { createUser } from './models/user.js';
```

Groups separated by blank lines. `.js` extension in local imports (ESM resolution).

## Code Structure

### Functions

- Short, focused (<40 lines)
- One abstraction level per function
- Early returns to reduce nesting
- Pure functions where possible — separate side effects from logic

### Async/Await

- Prefer async/await over `.then()` chains
- Always await async calls — no fire-and-forget without intent
- try/catch for error handling in async functions
- Don't wrap sync code in async unnecessarily

```js
async function getUser(id) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!user) throw new NotFoundError(`User ${id} not found`)
    return user
  } catch (err) {
    throw new AppError('Failed to fetch user', { cause: err })
  }
}
```

### Destructuring

- Destructure objects/arrays when accessing multiple properties
- Destructure in function params for options objects

```js
const { PORT, DATABASE_PATH, NODE_ENV } = process.env

function createTask({ title, description, status = 'todo' }) { ... }
```

### Error Handling Patterns

- Always handle errors — no unhandled promises
- Specific error classes extending Error
- Use error cause for chaining

```js
class AppError extends Error {
  constructor(message, { statusCode = 500, cause } = {}) {
    super(message, { cause })
    this.statusCode = statusCode
    this.name = this.constructor.name
  }
}
```

## Things to Avoid

- `var` — use `const` or `let`
- `==` / `!=` — always `===` / `!==`
- Nested ternaries — use if/else or early returns
- Callbacks without async/await
- String concatenation for SQL queries
- `console.log` in production — use proper logging
- Mutating function parameters
- Large functions doing multiple things
- Magic numbers/strings — extract to named constants

## Linting

```bash
npm run lint        # ESLint
npm run lint:fix    # Auto-fix where possible
```