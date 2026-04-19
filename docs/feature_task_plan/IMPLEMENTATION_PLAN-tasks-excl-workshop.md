# Implementation Plan — Task Breakdown (Excl. Workshop Gaps)

Source: [IMPLEMENTATION_PLAN-tasks.md](IMPLEMENTATION_PLAN-tasks.md)

20 tasks across 4 batches. Tasks within each batch are parallelizable (no merge conflicts).
Workshop gap tasks (T17-T24) excluded — tracked separately.

---

## Batch Dependency Diagram

```
BATCH 1: Scaffold (T1-T8) — no dependencies, all parallel
    │
    ├──► BATCH 2: POST Endpoint (T9-T12)
    │        │
    │        └──► BATCH 3: Wiring (T13-T16)
    │
    └────────────────────► BATCH 4: Testing (T25-T28) — after B2, all parallel
```

---

## Summary Table

| # | Batch | Title | Target Files | Deps | Parallel With |
|---|-------|-------|-------------|------|---------------|
| T1 | 1 | Create package.json | `package.json` | — | T2-T8 |
| T2 | 1 | Create DB connection singleton | `src/utils/db.js` | — | T1, T3-T8 |
| T3 | 1 | Create user model/schema constants | `src/models/userModel.js` | — | T1-T2, T4-T8 |
| T4 | 1 | Create error classes + middleware | `src/middleware/errorHandler.js` | — | T1-T3, T5-T8 |
| T5 | 1 | Create request validation middleware | `src/middleware/validateRequest.js` | — | T1-T4, T6-T8 |
| T6 | 1 | Create Jest config | `jest.config.js` | — | T1-T5, T7-T8 |
| T7 | 1 | Create static HTML frontend | `public/index.html` | — | T1-T6, T8 |
| T8 | 1 | Create .env.example | `.env.example` | — | T1-T7 |
| T9 | 2 | Create DB init script | `database/init.js` | T2, T3 | T10, T11, T12 |
| T10 | 2 | Create Express app | `src/app.js` | T4 | T9, T11, T12 |
| T11 | 2 | Create user repository | `src/repositories/userRepository.js` | T2, T3 | T9, T10, T12 |
| T12 | 2 | Create user service | `src/services/userService.js` | T4, T11 | T9, T10 |
| T13 | 3 | Create user controller | `src/controllers/userController.js` | T12 | T14 |
| T14 | 3 | Create user routes | `src/routes/userRoutes.js` | T5, T13 | T15 |
| T15 | 3 | Mount routes in app.js | `src/app.js` | T10, T14 | T16 |
| T16 | 3 | Create server entry point | `src/server.js` | T9, T15 | — |
| T25 | 4 | Repository unit tests | `src/repositories/userRepository.test.js` | T11 | T26, T27, T28 |
| T26 | 4 | Service unit tests | `src/services/userService.test.js` | T12 | T25, T27, T28 |
| T27 | 4 | Controller/HTTP integration tests | `src/controllers/userController.test.js` | T16 | T25, T26, T28 |
| T28 | 4 | Validation middleware tests | `src/middleware/validateRequest.test.js` | T5 | T25, T26, T27 |

---

## Developer Assignment Tracks

### Track A — Backend Core

```
B1: T1→T2→T3→T4→T5→T6→T8 (T7 parallel by Track B)
B2: T9+T11 parallel → T10+T12 parallel
B3: T13→T14→T15→T16
```

Est: ~2.5h

### Track B — Frontend + Early Tests

```
B1: T7 (while Track A does T1-T6, T8)
B4: T25+T28 (can start after T11 and T5 respectively)
```

Est: ~45min. Can start T7 immediately. Tests start mid-B2.

### Track C — QA / Tests

```
B4: T26 (after T12) + T27 (after T16)
```

Est: ~40min. Waits for B2/B3 to finish.

---

## Batch 1 — Scaffold (T1-T8)

No dependencies. All 8 tasks fully parallelizable.

---

### T1: Create package.json

**Description**: Create `package.json` with ESM support, all production and dev dependencies, and npm scripts.

**Details**:
- `"type": "module"` for ESM
- Dependencies: `express`, `better-sqlite3`, `express-async-errors`
- DevDependencies: `jest`, `supertest`, `eslint`
- Scripts:
  - `"start": "node src/server.js"`
  - `"dev": "node --watch src/server.js"`
  - `"test": "NODE_OPTIONS=--experimental-vm-modules jest"`
  - `"lint": "eslint src/"`
  - `"lint:fix": "eslint src/ --fix"`
- `"engines": { "node": ">=18.0.0" }`

**Acceptance Criteria**:
- [ ] `package.json` exists with `"type": "module"`
- [ ] All 5 scripts present
- [ ] `npm install` succeeds
- [ ] `express`, `better-sqlite3`, `express-async-errors` in dependencies

**Dependencies**: None
**Target Files**: `package.json` (create)

---

### T2: Create DB connection singleton

**Description**: Create `src/utils/db.js` — lazy-init singleton wrapping `better-sqlite3`. All repository modules import from here.

**Details**:
- Export `getDb(path?)` — returns cached `Database` instance, creates on first call
- Default path: `process.env.DATABASE_PATH || './data/kanban.db'`
- On creation: `db.pragma('journal_mode = WAL')` and `db.pragma('foreign_keys = ON')`
- Export `closeDb()` — closes connection, resets singleton
- Module-level `let db = null` holds singleton

**Acceptance Criteria**:
- [ ] Exports `getDb` and `closeDb`
- [ ] `getDb()` called twice returns same instance
- [ ] `getDb(':memory:')` creates in-memory DB for tests
- [ ] WAL mode and foreign keys enabled on new connections
- [ ] `closeDb()` resets singleton

**Dependencies**: None
**Target Files**: `src/utils/db.js` (create)

---

### T3: Create user model/schema constants

**Description**: Create `src/models/userModel.js` — single source of truth for `users` table schema. Other layers import from here.

**Details**:
Export:
- `TABLE_NAME`: `'users'`
- `COLUMNS`: object mapping column names to properties (type, required, unique, etc.)
- `CREATE_TABLE_SQL`: DDL for `users` table with columns: `id` (INTEGER PK AUTOINCREMENT), `username` (TEXT NOT NULL UNIQUE), `full_name` (TEXT NOT NULL), `email` (TEXT NOT NULL UNIQUE), `phone` (TEXT), `created_at` (TEXT DEFAULT datetime('now'))
- `INSERT_COLUMNS`: `['username', 'full_name', 'email', 'phone']` — excludes `id` and `created_at`
- `VALIDATION_RULES`: per-field validation config consumed by `validateRequest` middleware:
  - `username`: required, pattern `^[a-zA-Z0-9_]+$`, maxLength 50
  - `full_name`: required, maxLength 100
  - `email`: required, pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`, maxLength 255
  - `phone`: optional, maxLength 20

**Acceptance Criteria**:
- [ ] Exports `TABLE_NAME`, `COLUMNS`, `VALIDATION_RULES`, `CREATE_TABLE_SQL`, `INSERT_COLUMNS`
- [ ] `CREATE_TABLE_SQL` is valid SQLite DDL
- [ ] `VALIDATION_RULES` covers all 4 input fields with correct patterns
- [ ] `INSERT_COLUMNS` excludes `id` and `created_at`

**Dependencies**: None
**Target Files**: `src/models/userModel.js` (create)

---

### T4: Create error classes + error handling middleware

**Description**: Create `src/middleware/errorHandler.js` — custom error hierarchy and centralized Express error middleware.

**Details**:
- `AppError extends Error`: constructor(message, statusCode = 500), sets `this.name`
- `NotFoundError extends AppError`: constructor(resource = 'Resource'), statusCode 404
- `ValidationError extends AppError`: constructor(message), statusCode 400
- `errorHandler(err, req, res, _next)`: extracts statusCode (default 500), responds `{ error: message }`. In non-production, includes `stack`.

**Acceptance Criteria**:
- [ ] Exports `AppError`, `NotFoundError`, `ValidationError`, `errorHandler`
- [ ] `NotFoundError('User')` → message "User not found", statusCode 404
- [ ] `ValidationError('Bad input')` → statusCode 400
- [ ] `errorHandler` returns JSON `{ error }` with correct status code
- [ ] Stack trace omitted when `NODE_ENV=production`

**Dependencies**: None
**Target Files**: `src/middleware/errorHandler.js` (create)

---

### T5: Create request validation middleware

**Description**: Create `src/middleware/validateRequest.js` — reusable middleware factory that validates `req.body` against rules from the model layer.

**Details**:
- Export `validateRequest(rules)` returning `(req, res, next) => ...`
- For each field in `rules`:
  - If `required: true` and value missing/empty → throw `ValidationError` with field's `errorMessage`
  - If `pattern` defined and value present → test against `new RegExp(pattern)`, throw on fail
  - If `maxLength` defined and value present → check length, throw on fail
  - Optional fields with empty/undefined value → skip
- Import `ValidationError` from `./errorHandler.js`

**Usage** (for later tasks):
```js
router.post('/', validateRequest(VALIDATION_RULES), userController.createUser)
```

**Acceptance Criteria**:
- [ ] Exports `validateRequest`
- [ ] Missing required field → `ValidationError`
- [ ] Invalid pattern → `ValidationError`
- [ ] Exceeds maxLength → `ValidationError`
- [ ] Optional empty field → passes
- [ ] All-valid body → `next()` called

**Dependencies**: None
**Target Files**: `src/middleware/validateRequest.js` (create)

---

### T6: Create Jest config

**Description**: Create `jest.config.js` with ESM-compatible settings.

**Details**:
```js
export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/src/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/server.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
}
```

**Acceptance Criteria**:
- [ ] `jest.config.js` exists with ESM-compatible settings
- [ ] `testMatch` finds co-located test files in `src/`
- [ ] `transform: {}` for native ESM via `NODE_OPTIONS` flag
- [ ] Coverage excludes test files and entry point

**Dependencies**: None
**Target Files**: `jest.config.js` (create)

---

### T7: Create static HTML frontend

**Description**: Create `public/index.html` — single-page frontend with user table, Add User form, and stub JS functions. No frameworks, no build step.

**Details**:

HTML structure:
- Page title and heading: "User Management"
- Table `#user-table` with columns: ID, Username, Full Name, Email, Phone, Created At
- Table body `#user-table-body` with placeholder row: "User list will appear here (not implemented yet)"
- Form `#add-user-form` with inputs: `username` (text, required), `full_name` (text, required), `email` (email, required), `phone` (tel, optional)
- Submit button: "Add User"
- Error div `#error-message` (hidden by default)
- Container max-width 800px, centered

Inline `<script>` with stubs:
- `fetchUsers()` — empty body with `// TODO: Implement in workshop`
- `addUser(event)` — calls `event.preventDefault()`, stub body
- `renderUsers(users)` — empty body with TODO comment
- `showError(message)` — empty body with TODO comment

Wire form `submit` → `addUser(event)`. Do NOT call `fetchUsers()` on load — that's a workshop gap.

**Acceptance Criteria**:
- [ ] Single self-contained HTML file
- [ ] Table has 6 columns (ID, Username, Full Name, Email, Phone, Created At)
- [ ] Table body shows "not implemented yet" placeholder
- [ ] Form has 4 inputs with correct types and required attributes
- [ ] Error div exists, hidden by default
- [ ] 4 stub functions defined
- [ ] No `fetchUsers()` call on page load

**Dependencies**: None
**Target Files**: `public/index.html` (create)

---

### T8: Create .env.example

**Description**: Create `.env.example` template with all environment variables.

**Details**:
```
PORT=3000
DATABASE_PATH=./data/kanban.db
NODE_ENV=development
```

**Acceptance Criteria**:
- [ ] `.env.example` exists with PORT, DATABASE_PATH, NODE_ENV
- [ ] Actual `.env` is gitignored

**Dependencies**: None
**Target Files**: `.env.example` (create)

---

## Batch 2 — POST Endpoint Foundation (T9-T12)

Depends on Batch 1. T9+T11 parallel, then T10+T12.

---

### T9: Create DB init script

**Description**: Create `database/init.js` — initializes schema and seeds data on startup.

**Details**:
- Import `getDb` from `../src/utils/db.js`, `CREATE_TABLE_SQL` + `INSERT_COLUMNS` + `TABLE_NAME` from `../src/models/userModel.js`
- Export `initDatabase()`:
  1. Call `getDb()` to get connection
  2. Execute `CREATE_TABLE_SQL` via `db.exec()`
  3. Check if table empty: `SELECT COUNT(*) as count FROM users`
  4. If empty, insert 3 seed users via `db.transaction()`:
     - `('jdoe', 'John Doe', 'john@example.com', '555-0101')`
     - `('asmith', 'Alice Smith', 'alice@example.com', '555-0102')`
     - `('bwong', 'Bob Wong', 'bob@example.com', null)`
  5. Return db instance
- Use `?` placeholders. No string interpolation in SQL.

**Acceptance Criteria**:
- [ ] Exports `initDatabase`
- [ ] Creates `users` table on first run
- [ ] Inserts exactly 3 seed users when table empty
- [ ] Does NOT re-insert if table has rows
- [ ] Uses parameterized queries + `db.transaction()`
- [ ] Returns db instance

**Dependencies**: T2, T3
**Target Files**: `database/init.js` (create)

---

### T10: Create Express app

**Description**: Create `src/app.js` — Express app factory with middleware. Does NOT start server (separated for testability with supertest).

**Details**:
- Import `express`, `errorHandler` from `./middleware/errorHandler.js`
- Configure:
  1. `app.use(express.json({ limit: '1mb' }))`
  2. `app.use(express.static('public'))`
  3. Route mount placeholder: `// Routes will be mounted here`
  4. `app.use(errorHandler)` — must be last
- Export `app` as default export

**Acceptance Criteria**:
- [ ] Exports Express app as default export
- [ ] JSON body parser with 1mb limit
- [ ] Static file serving for `public/`
- [ ] Error handler registered last
- [ ] Route mount point has clear placeholder comment
- [ ] No `listen()` call — separated for supertest

**Dependencies**: T4
**Target Files**: `src/app.js` (create)

---

### T11: Create user repository

**Description**: Create `src/repositories/userRepository.js` — data access layer with raw SQL only, no business logic.

**Details**:
- Import `getDb` from `../utils/db.js`, `TABLE_NAME` + `INSERT_COLUMNS` from `../models/userModel.js`
- Export `userRepository` object with:

**`insertUser(userData)`**:
- Takes `{ username, full_name, email, phone }`
- INSERT using `INSERT_COLUMNS` dynamically, `?` placeholders
- Returns full user row via `SELECT * FROM users WHERE id = ?` with `lastInsertRowid`

**`findByUsername(username)`**:
- `SELECT * FROM users WHERE username = ?`
- Returns user object or `undefined`

**`findAll()`**:
- Stub: `return []` with comment `// Workshop gap — implemented in Batch 4`

**`findByEmail(email)`**:
- `SELECT * FROM users WHERE email = ?`
- Returns user object or `undefined`

**Acceptance Criteria**:
- [ ] Exports `userRepository` with `insertUser`, `findByUsername`, `findByEmail`, `findAll`
- [ ] `insertUser` uses `?` placeholders, returns full row with `id` and `created_at`
- [ ] `findByUsername` returns user or `undefined`
- [ ] `findAll` is stub returning `[]`
- [ ] No business logic — only SQL and data return

**Dependencies**: T2, T3
**Target Files**: `src/repositories/userRepository.js` (create)

---

### T12: Create user service

**Description**: Create `src/services/userService.js` — business logic layer with validation and duplicate checks. No HTTP details.

**Details**:
- Import `userRepository` from `../repositories/userRepository.js`, `ValidationError` from `../middleware/errorHandler.js`
- Export `userService` object with:

**`createUser(userData)`**:
- Check duplicate username via `userRepository.findByUsername()` — if found, throw `ValidationError('Username already exists')`
- Check duplicate email via `userRepository.findByEmail()` — if found, throw `ValidationError('Email already exists')`
- Call `userRepository.insertUser(userData)`, return result

**`getAllUsers()`**:
- Pass-through to `userRepository.findAll()` — stub until Batch 4

**Acceptance Criteria**:
- [ ] Exports `userService` with `createUser`, `getAllUsers`
- [ ] `createUser` checks duplicate username → throws `ValidationError`
- [ ] `createUser` checks duplicate email → throws `ValidationError`
- [ ] `createUser` delegates to `userRepository.insertUser`
- [ ] `getAllUsers` is pass-through stub
- [ ] No HTTP concerns (no req/res/status)

**Dependencies**: T4, T11
**Target Files**: `src/services/userService.js` (create)

---

## Batch 3 — Wiring (T13-T16)

Depends on Batch 2. T13→T14→T15→T16 sequential (each builds on previous).

---

### T13: Create user controller

**Description**: Create `src/controllers/userController.js` — parses request, calls service, shapes response. No business logic.

**Details**:
- Import `userService` from `../services/userService.js`
- Export `createUser(req, res, next)`:
  - Extract `username`, `full_name`, `email`, `phone` from `req.body`
  - Call `userService.createUser({ username, full_name, email, phone })`
  - Respond `res.status(201).json({ data: user })`
  - Let errors propagate to centralized handler (no try/catch needed with `express-async-errors`)

**Acceptance Criteria**:
- [ ] Exports `createUser` as named export
- [ ] Extracts fields from `req.body`
- [ ] Calls `userService.createUser()`
- [ ] Returns `201` with `{ data: user }`
- [ ] No business logic — pure delegation

**Dependencies**: T12
**Target Files**: `src/controllers/userController.js` (create)

---

### T14: Create user routes

**Description**: Create `src/routes/userRoutes.js` — HTTP path → controller binding. No logic.

**Details**:
- Import `Router` from `express`, `userController` from `../controllers/userController.js`, `validateRequest` from `../middleware/validateRequest.js`, `VALIDATION_RULES` from `../models/userModel.js`
- `router.post('/', validateRequest(VALIDATION_RULES), userController.createUser)`
- Export router as default

**Acceptance Criteria**:
- [ ] Maps `POST /` to `userController.createUser` with validation middleware
- [ ] Exports router as default
- [ ] No business logic

**Dependencies**: T5, T13
**Target Files**: `src/routes/userRoutes.js` (create)

---

### T15: Mount routes in app.js

**Description**: Edit `src/app.js` to mount user routes at `/api/users`.

**Details**:
- Import `userRoutes` from `./routes/userRoutes.js`
- Add `app.use('/api/users', userRoutes)` after JSON body parser, before error handler
- Remove placeholder comment

**Acceptance Criteria**:
- [ ] `src/app.js` imports and mounts `userRoutes` at `/api/users`
- [ ] Mount point after `express.json()`, before `errorHandler`
- [ ] Existing middleware intact

**Dependencies**: T10, T14
**Target Files**: `src/app.js` (edit)

---

### T16: Create server entry point

**Description**: Create `src/server.js` — starts server after DB initialization.

**Details**:
- Import `app` from `./app.js`, `initDatabase` from `../database/init.js`
- Read `PORT` from env, default `3000`
- Call `initDatabase()` then `app.listen(PORT, callback)`
- Log startup message

**Acceptance Criteria**:
- [ ] Reads PORT from env with default 3000
- [ ] Calls `initDatabase()` before `app.listen()`
- [ ] Logs startup message
- [ ] Server fails to start if DB init fails

**Dependencies**: T9, T15
**Target Files**: `src/server.js` (create)

**Validation**: After T16, `npm run dev` starts server. `POST /api/users` with valid body returns 201. Invalid body returns 400. Duplicate returns 400 (validation error from service).

---

## Batch 4 — Testing (T25-T28)

Depends on Batch 2+. All 4 test tasks fully parallelizable.

---

### T25: Repository unit tests

**Description**: Test `src/repositories/userRepository.js` in isolation with fresh in-memory SQLite per test.

**Test Cases**:

`describe('userRepository')`:

`describe('insertUser')`:
- inserts user, returns full record with `id` and `created_at`
- inserts user with null phone
- throws on duplicate username (UNIQUE constraint)
- throws on duplicate email (UNIQUE constraint)
- throws when required field missing

`describe('findAll')`:
- returns `[]` when no users
- returns users sorted by `created_at DESC`
- returns correct count
- returns objects with all expected columns

`describe('findByUsername')`:
- returns user when found
- returns `undefined` when not found

**Isolation**: `beforeEach` creates in-memory DB + users table. `afterEach` closes DB.

**Acceptance Criteria**:
- [ ] All tests pass with `npx jest src/repositories/userRepository.test.js`
- [ ] Fresh in-memory DB per test
- [ ] No shared mutable state
- [ ] Coverage >= 90%

**Dependencies**: T11
**Target Files**: `src/repositories/userRepository.test.js` (create)

---

### T26: Service unit tests

**Description**: Test `src/services/userService.js` with mocked repository. Pure unit tests.

**Test Cases**:

`describe('userService')`:

`describe('createUser')`:
- creates user with valid data, returns result
- throws `ValidationError` on duplicate username
- throws `ValidationError` on duplicate email
- passes phone through when provided
- passes phone as null when omitted

`describe('getAllUsers')`:
- returns all users from repository
- returns empty array when repo returns empty
- calls `findAll` exactly once

**Isolation**: `jest.mock('../repositories/userRepository.js')`. No real DB.

**Acceptance Criteria**:
- [ ] All tests pass with `npx jest src/services/userService.test.js`
- [ ] Repository fully mocked
- [ ] No real DB access
- [ ] Coverage >= 85%

**Dependencies**: T12
**Target Files**: `src/services/userService.test.js` (create)

---

### T27: Controller/HTTP integration tests

**Description**: Test full HTTP cycle with `supertest`. Import `app`, not server. Fresh in-memory DB per suite.

**Test Cases**:

`describe('POST /api/users')`:
- 201 with valid payload
- 400 when username missing
- 400 when email invalid
- 400 when full_name missing
- 400 on duplicate username
- 400 on duplicate email
- 400 for empty body

`describe('GET /api/users')`:
- 200 with empty array on fresh DB
- 200 with users sorted by created_at DESC
- 200 with correct object shape

`describe('Error handling')`:
- 404 for unknown routes returns JSON error
- JSON error format consistent across all errors

**Isolation**: `beforeEach` in-memory DB + schema. `afterEach` close. Import `app` for supertest.

**Acceptance Criteria**:
- [ ] All tests pass with `npx jest src/controllers/userController.test.js`
- [ ] Uses `supertest` with Express `app` export
- [ ] Tests full stack: routes → controller → service → repository → DB
- [ ] Coverage >= 80%

**Dependencies**: T16
**Target Files**: `src/controllers/userController.test.js` (create)

---

### T28: Validation middleware tests

**Description**: Test `src/middleware/validateRequest.js` as pure unit with mock req/res/next. Target 100% coverage.

**Test Cases**:

`describe('validateRequest')`:
- calls `next()` for valid complete payload
- calls `next()` when phone omitted (optional)
- calls `next()` for valid alphanumeric+underscore username
- `ValidationError` when username missing
- `ValidationError` when username empty string
- `ValidationError` when username has spaces
- `ValidationError` when username has special chars
- `ValidationError` when full_name missing
- `ValidationError` when full_name empty string
- `ValidationError` when email missing
- `ValidationError` when email has no @
- `ValidationError` when email has no domain
- `ValidationError` when email has no local part
- `ValidationError` for empty body `{}`
- Error message identifies failed fields

**Isolation**: Mock `req`/`res`/`next`. No Express or supertest.

**Acceptance Criteria**:
- [ ] All tests pass with `npx jest src/middleware/validateRequest.test.js`
- [ ] Mock req/res/next only
- [ ] Covers every PRD validation rule
- [ ] Coverage = 100%

**Dependencies**: T5
**Target Files**: `src/middleware/validateRequest.test.js` (create)

---

## Merge Order

1. **B1** (T1-T8) → merge first, no conflicts (all new files)
2. **B2** (T9-T12) → merge after B1, no conflicts (all new files)
3. **B3** (T13-T16) → merge after B2. T15 edits `app.js` — only editor of that file in B3
4. **B4** (T25-T28) → merge last. All new test files, no conflicts
