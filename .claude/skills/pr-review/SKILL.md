---
name: pr-review
description: Comprehensive JavaScript/Express.js PR review with async safety, error handling, security checks, and code quality assessment. Use when user requests to review a pull request or compare branches for code review.
---

# PR Review Skill

When the user requests a **PR review** or to **compare branches**:

### Branch Defaults

- **Source branch**: The current local branch. Determine with `git branch --show-current`.
- **Target branch**: `main`, unless the user explicitly specifies a different branch.
- If the user specifies both branches, use those values.

### Pre-Review: Branch Synchronisation

Before starting the review, both branches must be up-to-date and the source must be rebased onto the target (this project uses **Rebase and Merge** on GitHub).

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

**Offline mode**: If the user says **"offline"** when invoking this skill, skip steps 1-3 entirely. Only run the rebase (step 4) against the local copy of the target branch. This allows reviewing purely local state without network access.

**Conflict handling**: If the rebase in step 4 produces merge conflicts, **stop the entire review**. Abort the rebase (`git rebase --abort`), inform the user of the conflicts, and do not proceed with any review steps.

**If rebase succeeds**: Proceed to the review steps below.

### Parallel Subagent Strategy

This review can be accelerated using **up to 3 parallel subagents** (via the `Agent` tool). Instead of processing everything sequentially in the main context, split independent review tasks across subagents to save context window and speed up the process. Example parallelisation:

| Subagent | Scope | Agent Type |
|----------|-------|------------|
| 1 | Diff analysis + architecture review | `general-purpose` |
| 2 | JavaScript/Express.js-specific checks (async, error handling, security) | `general-purpose` |
| 3 | Test coverage assessment + code quality checklist | `general-purpose` |

**When to parallelise:** Always use parallel subagents when the diff is non-trivial (more than a few files). For tiny diffs (1-2 files, cosmetic changes), a single-pass review is fine.

**How to parallelise:** Launch all independent subagents in a single message using multiple `Agent` tool calls. Each subagent should receive the diff (via `git diff`) and its specific review scope. After all subagents return, synthesize their findings into the final review summary (step 6).

## 1. Run Complete Diff

Compare the source branch against the target branch and analyze the **actual code changes**, not just commit messages.

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
- **Correctness**: Does the code work as intended?
- **Readability**: Is the code understandable?
- **Maintainability**: Will this be easy to modify later?
- **Architectural Alignment**: Does it follow the project's patterns?
- **Performance Implications**: Any performance concerns?
- **Security Considerations**: Any vulnerabilities?

Check whether tests adequately cover the changes.

## 4. JavaScript/Express.js Review Items

### Error Handling
- Are async errors caught? Every `await` on a fallible operation wrapped in try/catch or handled by an error-handling middleware?
- Is there a global Express error-handling middleware (`(err, req, res, next) => { ... }`) with four parameters?
- Are proper HTTP status codes returned (400 for validation, 401 for auth, 404 for missing, 500 for server errors)?
- Are errors not silently swallowed (no empty catch blocks)?
- Are error responses structured as JSON with meaningful messages for clients?

### Async Patterns
- Are all async functions properly marked with `async`?
- Is `await` used consistently where needed — no unhandled promise rejections?
- Is there no callback hell — Promises or async/await used throughout?
- Are `Promise.all()` / `Promise.allSettled()` used for independent parallel operations?
- Is there no fire-and-forget without `.catch()` — every returned Promise handled?

### Security
- Is user input validated and sanitized before use?
- Are SQL queries using parameterized placeholders (`?`) to prevent injection?
- Is XSS prevention in place (output encoding, CSP headers)?
- Is authentication/authorization middleware applied to protected routes?
- Are secrets only read from environment variables (`process.env`), never hardcoded?
- Are there no sensitive values in responses or logs?

### Express Patterns
- Is middleware ordered correctly (logging before auth, auth before routes, error handler last)?
- Are routes organized logically (grouped by resource, using `express.Router()`)?
- Is the Express app created in a separate file from server startup for testability?
- Are route handlers thin — delegating to service functions for business logic?
- Is `express.json()` body parser used before route handlers that read `req.body`?

### Resource Management
- Are database connections properly closed on shutdown?
- Are file streams and other resources properly cleaned up (using `finally` blocks or `try-with-resources` patterns)?
- Are event listeners removed when no longer needed to prevent memory leaks?
- Are temporary files/directories cleaned up after use?

### Code Quality
- Is module system consistent throughout — all ESM (`import/export`) or all CommonJS (`require/module.exports`)?
- Are variables declared with `const` by default, `let` only when reassignment is needed — never `var`?
- Are functions kept short and focused (<50 lines)?
- Is early return used to reduce nesting?
- Is there no dead code or commented-out blocks in production?

### Logging
- Is structured logging used (e.g., `pino`, `winston`) instead of `console.log`?
- Are sensitive values (secrets, tokens, passwords) never logged?
- Are log levels used appropriately (error for failures, info for significant events, debug for tracing)?
- Is there no `console.log`, `console.error`, or `console.warn` left in production code?

## 5. Test Coverage

- Are tests written with Jest or Vitest using `describe`/`it` blocks?
- Are HTTP handlers tested with `supertest` against the Express app?
- Is SQLite using in-memory databases (`:memory:`) or temporary files for test isolation?
- Are async handlers tested for both success and error paths?
- Are mocks/stubs used for external dependencies (database, file system, HTTP calls)?
- Are edge cases covered (empty input, invalid input, missing fields, boundary values)?

## 6. Provide Senior-Level Review Summary

Offer direct, actionable feedback:
- Call out risks
- Highlight strengths
- Suggest improvements
- Indicate whether changes are ready to merge or need revisions

## 7. Aim for Practical, High-Value Feedback

The goal is to emulate a real PR review from an experienced engineer — clear, specific, and focused on what matters.

## 8. Write a comprehensive PR review report

Write a comprehensive PR review report in a markdown file and save it in the `./docs/ai_generated` directory. The report should include:
- Summary of changes
- Code quality assessment
- Performance considerations
- Security implications
- Testing coverage
- Recommendations
- Whether changes are ready to merge or need revisions

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
