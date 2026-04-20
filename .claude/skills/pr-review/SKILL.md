---
name: pr-review
description: Comprehensive JavaScript/Express.js PR review with async safety, error handling, security checks, and code quality assessment. Use when user requests to review a pull request or compare branches for code review.
---

# PR Review Skill

When user requests **PR review** or to **compare branches**:

### Branch Defaults

- **Source branch**: Current local branch. Determine with `git branch --show-current`.
- **Target branch**: `main`, unless user explicitly specifies different.
- If user specifies both branches, use those values.

### Pre-Review: Branch Synchronisation

Before review, both branches must be up-to-date, source rebased onto target (project uses **Rebase and Merge** on GitHub).

**Standard mode** (online):

```bash
# 1. Fetch all remotes
git fetch --all

# 2. Reset target to origin
git checkout <target-branch> && git reset --hard origin/<target-branch>

# 3. Reset source to origin
git checkout <source-branch> && git reset --hard origin/<source-branch>

# 4. Rebase source onto target
git rebase <target-branch>
```

**Offline mode**: If user says **"offline"**, skip steps 1-3. Only run rebase (step 4) against local target branch. Review purely local state without network.

**Conflict handling**: If rebase in step 4 produces merge conflicts, **stop review**. Abort rebase (`git rebase --abort`), inform user of conflicts, do not proceed.

**If rebase succeeds**: Proceed to review steps below.

### Parallel Subagent Strategy

Accelerate with **up to 3 parallel subagents** (via `Agent` tool). Split independent review tasks across subagents to save context window.

| Subagent | Scope | Agent Type |
|----------|-------|------------|
| 1 | Diff analysis + architecture review | `general-purpose` |
| 2 | JavaScript/Express.js-specific checks (async, error handling, security) | `general-purpose` |
| 3 | Test coverage assessment + code quality checklist | `general-purpose` |

**When to parallelise:** Always use parallel subagents for non-trivial diffs (>few files). For tiny diffs (1-2 files, cosmetic), single-pass review fine.

**How to parallelise:** Launch all subagents in single message using multiple `Agent` tool calls. Each subagent receives diff (via `git diff`) + specific review scope. After all return, synthesize findings into final review summary (step 6).

## 1. Run Complete Diff

Compare source vs target. Analyze **actual code changes**, not just commit messages.

```bash
git diff target..source
git log target..source --oneline
```

## 2. Identify Change Types

Determine what each change represents:
- Feature addition
- Bug fix
- Refactor
- Cleanup
- Potential breaking change

Note: missing tests, incomplete docs, inconsistencies.

## 3. Assess Code Quality & Impact

Evaluate:
- **Correctness**: Does code work as intended?
- **Readability**: Is code understandable?
- **Maintainability**: Easy to modify later?
- **Architectural Alignment**: Follows project patterns?
- **Performance Implications**: Any concerns?
- **Security Considerations**: Any vulnerabilities?

Check whether tests adequately cover changes.

## 4. JavaScript/Express.js Review Items

### Error Handling
- Async errors caught? Every `await` on fallible operation in try/catch or error-handling middleware?
- Global Express error-handling middleware (`(err, req, res, next) => { ... }`) with four parameters?
- Proper HTTP status codes (400 validation, 401 auth, 404 missing, 500 server)?
- No silently swallowed errors (no empty catch blocks)?
- Error responses structured as JSON with meaningful messages?

### Async Patterns
- All async functions properly marked `async`?
- `await` used consistently — no unhandled promise rejections?
- No callback hell — Promises or async/await throughout?
- `Promise.all()` / `Promise.allSettled()` for independent parallel operations?
- No fire-and-forget without `.catch()` — every returned Promise handled?

### Security
- User input validated/sanitized before use?
- SQL queries use parameterized placeholders (`?`) to prevent injection?
- XSS prevention in place (output encoding, CSP headers)?
- Auth middleware applied to protected routes?
- Secrets only from environment variables (`process.env`), never hardcoded?
- No sensitive values in responses or logs?

### Express Patterns
- Middleware ordered correctly (logging → auth → routes → error handler)?
- Routes organized logically (grouped by resource, `express.Router()`)?
- Express app created separate from server startup for testability?
- Route handlers thin — delegating to service functions for business logic?
- `express.json()` body parser before route handlers reading `req.body`?

### Resource Management
- Database connections closed on shutdown?
- File streams/resources cleaned up (`finally` blocks or try-with-resources)?
- Event listeners removed when no longer needed (prevent memory leaks)?
- Temporary files/directories cleaned up after use?

### Code Quality
- Module system consistent — all ESM (`import/export`) or all CommonJS (`require/module.exports`)?
- `const` by default, `let` only when reassignment needed — never `var`?
- Functions short, focused (<50 lines)?
- Early return used to reduce nesting?
- No dead code or commented-out blocks in production?

### Logging
- Structured logging (`pino`, `winston`) instead of `console.log`?
- Sensitive values (secrets, tokens, passwords) never logged?
- Log levels used appropriately (error failures, info significant events, debug tracing)?
- No `console.log`, `console.error`, or `console.warn` in production code?

## 5. Test Coverage

- Tests with Jest or Vitest using `describe`/`it` blocks?
- HTTP handlers tested with `supertest` against Express app?
- SQLite using in-memory (`:memory:`) or temp files for test isolation?
- Async handlers tested for both success and error paths?
- Mocks/stubs for external dependencies (database, file system, HTTP)?
- Edge cases covered (empty input, invalid input, missing fields, boundary values)?

## 6. Provide Senior-Level Review Summary

Direct, actionable feedback:
- Call out risks
- Highlight strengths
- Suggest improvements
- Indicate ready to merge or needs revisions

## 7. Aim for Practical, High-Value Feedback

Emulate real PR review from experienced engineer — clear, specific, focused on what matters.

## 8. Write PR Review Report

Write comprehensive PR review report in markdown, save in `./docs/ai_generated`. Include:
- Summary of changes
- Code quality assessment
- Performance considerations
- Security implications
- Testing coverage
- Recommendations
- Ready to merge or needs revisions

---

## JavaScript/Express.js Code Review Checklist

### Architecture & Design
- [ ] Follows standard project layout (routes, middleware, services, database)
- [ ] Proper separation of concerns (routes vs middleware vs business logic)
- [ ] Express app creation separated from server startup for testability
- [ ] Routes grouped by resource using `express.Router()`
- [ ] Route handlers are thin — business logic in service modules

### Error Handling
- [ ] All async operations wrapped in try/catch or handled by error middleware
- [ ] Global error-handling middleware defined with four parameters
- [ ] Proper HTTP status codes for different error types
- [ ] No empty catch blocks — errors are logged or propagated
- [ ] Structured JSON error responses with meaningful messages

### Async & Concurrency
- [ ] All async functions properly marked with `async` keyword
- [ ] No unhandled promise rejections
- [ ] `Promise.all()` used for independent parallel async operations
- [ ] No fire-and-forget promises — all promises handled
- [ ] Proper error handling for concurrent operations

### Performance
- [ ] No unnecessary synchronous file I/O blocking the event loop
- [ ] Database queries are efficient — no N+1 patterns
- [ ] Static assets served with caching headers
- [ ] No large payloads loaded entirely into memory — streaming where appropriate
- [ ] No unnecessary re-renders or redundant database calls

### Security
- [ ] No secrets in code — all via environment variables
- [ ] SQL queries use parameterized placeholders to prevent injection
- [ ] Input validation at API boundaries
- [ ] Authentication/authorization middleware on protected routes
- [ ] XSS prevention (output encoding, CSP headers)
- [ ] Sensitive data not exposed in API responses or logs

### Code Quality
- [ ] Consistent module system (all ESM or all CommonJS)
- [ ] `const` by default, `let` only when reassignment needed — no `var`
- [ ] Functions short and focused (<50 lines)
- [ ] Early returns to reduce nesting
- [ ] No dead code or commented-out blocks
- [ ] No `require()` mixed with `import` statements

### Logging
- [ ] Uses structured logging library (pino, winston) instead of `console.log`
- [ ] Appropriate log levels (error, warn, info, debug)
- [ ] Sensitive values never logged
- [ ] Request/response logging for debugging (with request IDs)
- [ ] No `console.log`, `console.error`, or `console.warn` in production code

### Testing
- [ ] Tests use Jest or Vitest with `describe`/`it` blocks
- [ ] HTTP handlers tested with `supertest`
- [ ] SQLite uses in-memory or temp databases for test isolation
- [ ] External dependencies mocked or stubbed
- [ ] Both success and error paths covered
- [ ] Edge cases tested (empty/invalid input, boundary values)

### Database
- [ ] All queries use parameterized placeholders
- [ ] Database connections closed on graceful shutdown
- [ ] Migrations or schema initialization handled properly
- [ ] Transactions used for multi-step operations that must be atomic
- [ ] No raw string interpolation in SQL queries
