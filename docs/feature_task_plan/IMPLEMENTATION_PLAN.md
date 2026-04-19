# Implementation Plan — Vibe Kanban Demo Project

## Status: Greenfield — zero source code exists

Full application build from scratch. Docs, rules, and PRD already in place.

---

## Architecture

Layered pattern per PRD:

```
Routes → Controllers → Services → Repositories → SQLite (better-sqlite3)
```

Frontend: single `public/index.html` served as static file.

---

## Build Sequence

Ordered by dependency — each phase produces runnable increments.

### Phase 1: Project Scaffold & DB Foundation

**Goal**: `npm install` works, DB initializes, server starts (returns 404s for now).

| # | Task | Files | Est. | Parallelizable |
|---|------|-------|------|----------------|
| 1.1 | Create `package.json` with ESM, dependencies, scripts | `package.json` | 5min | yes |
| 1.2 | Create DB connection singleton | `src/utils/db.js` | 5min | yes |
| 1.3 | Create user model (schema constants) | `src/models/userModel.js` | 5min | yes |
| 1.4 | Create DB init script (schema + seed) | `database/init.js` | 10min | depends on 1.2, 1.3 |
| 1.5 | Create error classes | `src/middleware/errorHandler.js` | 5min | yes |
| 1.6 | Create Express app (middleware, static, error handler) | `src/app.js` | 10min | depends on 1.5 |
| 1.7 | Create server entry point | `src/server.js` | 5min | depends on 1.4, 1.6 |
| 1.8 | Create `.env.example` | `.env.example` | 2min | yes |

**Validation**: `rtk npm run dev` starts server. `GET /` returns placeholder HTML (or 404). DB file created.

---

### Phase 2: POST /api/users (Pre-Built for Workshop)

**Goal**: Can create users via API with full validation.

| # | Task | Files | Est. | Parallelizable |
|---|------|-------|------|----------------|
| 2.1 | Create user repository (insert method) | `src/repositories/userRepository.js` | 10min | depends on 1.2 |
| 2.2 | Create user service (createUser + validation) | `src/services/userService.js` | 15min | depends on 2.1 |
| 2.3 | Create request validation middleware | `src/middleware/validateRequest.js` | 10min | yes (after 1.5) |
| 2.4 | Create user controller (createUser handler) | `src/controllers/userController.js` | 10min | depends on 2.2 |
| 2.5 | Create user routes (POST only) | `src/routes/userRoutes.js` | 5min | depends on 2.4 |
| 2.6 | Mount routes in app.js | `src/app.js` (edit) | 2min | depends on 2.5 |

**Validation**: `curl -X POST /api/users` with valid body returns 201. Invalid body returns 400. Duplicate returns 409.

**Validation rules** (per PRD):
- `username`: required, non-empty, alphanumeric + underscores
- `full_name`: required, non-empty
- `email`: required, valid email format
- `phone`: optional

---

### Phase 3: GET /api/users (Workshop Gap #1)

**Goal**: List all users sorted by created_at descending.

| # | Task | Files | Est. | Parallelizable |
|---|------|-------|------|----------------|
| 3.1 | Add `findAll` to user repository | `src/repositories/userRepository.js` (edit) | 5min | — |
| 3.2 | Add `getAllUsers` to user service | `src/services/userService.js` (edit) | 5min | depends on 3.1 |
| 3.3 | Add `getAllUsers` to user controller | `src/controllers/userController.js` (edit) | 5min | depends on 3.2 |
| 3.4 | Add GET route | `src/routes/userRoutes.js` (edit) | 2min | depends on 3.3 |

**Validation**: `GET /api/users` returns array of users, sorted by `created_at` desc, 200 status.

---

### Phase 4: Frontend — Static HTML (Pre-Built for Workshop)

**Goal**: Page loads with form and placeholder table.

| # | Task | Files | Est. | Parallelizable |
|---|------|-------|------|----------------|
| 4.1 | Create `public/index.html` with structure + CSS + JS | `public/index.html` | 30min | — |

**HTML structure**:
- Heading: "User List"
- Table placeholder: "This feature is not implemented yet."
- Add User form with fields: username, full_name, email, phone
- Submit button: "Add User"
- Status/message area for feedback
- Inline `<script>` with stub functions

**JS stubs to include**:
- `fetchUsers()` — empty, will be implemented in Phase 5
- `addUser(event)` — empty, will be implemented in Phase 5
- `renderUsers(users)` — empty, will be implemented in Phase 5
- `showError(message)` — empty

**Validation**: `GET /` loads page. Form visible. Placeholder message visible.

---

### Phase 5: Frontend — Dynamic Wiring (Workshop Gaps #2 & #3)

**Goal**: Table populates on load. Form submission creates user and refreshes table.

| # | Task | Files | Est. | Parallelizable |
|---|------|-------|------|----------------|
| 5.1 | Implement `fetchUsers()` — GET /api/users on page load | `public/index.html` (edit) | 10min | — |
| 5.2 | Implement `renderUsers(users)` — populate table rows | `public/index.html` (edit) | 10min | yes |
| 5.3 | Implement `addUser(event)` — POST + refresh + clear form | `public/index.html` (edit) | 15min | yes |
| 5.4 | Implement `showError(message)` — display validation errors | `public/index.html` (edit) | 5min | yes |
| 5.5 | Wire `DOMContentLoaded` → fetchUsers | `public/index.html` (edit) | 2min | depends on 5.1 |

**Validation**: Open browser → table shows seeded users. Submit form → user added, table refreshes. Bad input → error displayed.

---

### Phase 6: Testing

**Goal**: Core functionality covered by tests.

| # | Task | Files | Est. | Parallelizable |
|---|------|-------|------|----------------|
| 6.1 | Create jest config | `jest.config.js` | 5min | yes |
| 6.2 | Repository unit tests | `src/repositories/userRepository.test.js` | 20min | yes |
| 6.3 | Service unit tests | `src/services/userService.test.js` | 20min | yes |
| 6.4 | Controller/HTTP tests (supertest) | `src/controllers/userController.test.js` | 25min | yes |
| 6.5 | Validation middleware tests | `src/middleware/validateRequest.test.js` | 15min | yes |

**Coverage targets**: Services >80%, Routes >70%, Validation 100%.

---

## Dependency Graph

```
Phase 1 (scaffold)
    ├── Phase 2 (POST) ──── Phase 3 (GET)
    └── Phase 4 (HTML) ──── Phase 5 (wiring)
                                      │
                    Phase 6 (tests) ←─┘ (can start after Phase 2)
```

Phases 2+3 and 4+5 are independent tracks. Phase 6 starts after Phase 2.

---

## Workshop Flow

For the live demo, Phase 1-2 and Phase 4 should be **pre-built**. The facilitator builds Phase 3 and Phase 5 live:

1. **Show**: Working POST endpoint, static frontend with placeholder
2. **Build live**: GET endpoint (Phase 3)
3. **Build live**: Frontend wiring (Phase 5)
4. **Result**: Full working app

---

## File Manifest

All files to create, in build order:

```
package.json
.env.example
src/utils/db.js
src/models/userModel.js
src/middleware/errorHandler.js
database/init.js
src/app.js
src/server.js
src/repositories/userRepository.js
src/services/userService.js
src/middleware/validateRequest.js
src/controllers/userController.js
src/routes/userRoutes.js
public/index.html
jest.config.js
src/repositories/userRepository.test.js
src/services/userService.test.js
src/controllers/userController.test.js
src/middleware/validateRequest.test.js
```

---

## Acceptance Criteria (from PRD)

- [ ] `GET /api/users` returns all users as JSON, sorted by created_at desc
- [ ] `POST /api/users` creates user with full validation
- [ ] User List table populates automatically on page load
- [ ] Adding user via form immediately updates table
- [ ] Validation errors display meaningful messages in UI
- [ ] Duplicate username/email returns 409, not a crash
- [ ] All tests pass with `rtk npm test`
