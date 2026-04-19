# JavaScript Style Guide

## Formatting

- 2-space indentation
- Single quotes for strings
- No semicolons is fine but be consistent across the project
- Trailing commas in multi-line objects and arrays
- Line length: ~100-120 chars practical max
- Use Prettier if configured, otherwise follow these conventions

## Naming Conventions

### Variables & Functions

- camelCase for variables and functions: `getUserById`, `requestHandler`
- PascalCase for classes and constructor functions: `DatabaseManager`
- UPPER_SNAKE_CASE for constants that are truly constant: `MAX_RETRIES`, `DEFAULT_PORT`
- `_` prefix for intentionally unused variables (e.g., destructuring)

### Files

- kebab-case for file names: `user-routes.js`, `error-handler.js`
- `*.routes.js` for route files, `*.middleware.js` for middleware, `*.model.js` for data access

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

Groups separated by blank lines. Use `.js` extension in local imports (required for ESM resolution).

## Code Structure

### Functions

- Keep functions short and focused (<40 lines)
- One level of abstraction per function
- Early returns to reduce nesting
- Pure functions where possible — separate side effects from logic

### Async/Await

- Prefer async/await over `.then()` chains
- Always await async calls — never fire-and-forget without intent
- Use try/catch for error handling in async functions
- Don't wrap synchronous code in async functions unnecessarily

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

- Destructure objects and arrays when accessing multiple properties
- Destructure in function parameters for options objects

```js
const { PORT, DATABASE_PATH, NODE_ENV } = process.env

function createTask({ title, description, status = 'todo' }) { ... }
```

### Error Handling Patterns

- Always handle errors — never let promises go unhandled
- Create specific error classes that extend Error
- Use error cause for error chaining

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
- `==` / `!=` — always use `===` / `!==`
- Nested ternaries — use if/else or early returns
- Callbacks without async/await
- String concatenation for SQL queries
- `console.log` in production code — use proper logging
- Mutating function parameters
- Large functions that do multiple things
- Magic numbers/strings — extract to named constants

## Linting

```bash
npm run lint        # ESLint
npm run lint:fix    # Auto-fix where possible
```
