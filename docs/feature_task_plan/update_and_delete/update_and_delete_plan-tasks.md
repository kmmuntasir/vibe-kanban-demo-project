# Update & Delete Feature — Task Breakdown

## Parallelization Strategy

3 batches, 9 tasks. All tasks within a batch touch different files — zero merge conflicts. Merge each batch before starting next.

### Batch Diagram

```
Batch 1 — Foundation (merge first)
  T1: Model ─────┐
  T2: Repository ─┼── T3: Repo tests
                  │
Batch 2 — Logic (merge after Batch 1) ────┐
  T4: Service ─────┬── T5: Service tests   │
  T6: Controller ──┘                       │
                                           │
Batch 3 — Wiring + UI (merge after Batch 2)
  T7: Routes ──────┬── T8: Controller tests
                   └── T9: Frontend UI
```

### Summary Table

| # | Batch | Target File | Dependencies | Can Parallel With |
|---|-------|-------------|--------------|-------------------|
| T1 | 1 | `src/models/userModel.js` | None | T2 |
| T2 | 1 | `src/repositories/userRepository.js` | T1 | T1 |
| T3 | 1 | `src/repositories/userRepository.test.js` | T2 | — |
| T4 | 2 | `src/services/userService.js` | T2 | T6 |
| T5 | 2 | `src/services/userService.test.js` | T4 | — |
| T6 | 2 | `src/controllers/userController.js` | T4 | T4 |
| T7 | 3 | `src/routes/userRoutes.js` | T1, T6 | — |
| T8 | 3 | `src/controllers/userController.test.js` | T7 | T9 |
| T9 | 3 | `public/index.html` | T7 | T8 |

### Merge Order

1. Merge T1 first (model exports needed by T2)
2. Merge T2 + T3 (repo methods + tests)
3. Merge T4 + T6 (service + controller, different files)
4. Merge T5 (service tests)
5. Merge T7 (routes)
6. Merge T8 + T9 (integration tests + frontend)

### Developer Assignment Tracks

- **Dev A (backend):** T1 → T2 → T3 → T4 → T6 → T7 → T8
- **Dev B (frontend/tests):** T5 → T9 (can start T5 once T4 merged, T9 once T7 merged)

---

## Batch 1 — Foundation

### Task 1: Add UPDATE_COLUMNS and UPDATE_VALIDATION_RULES to UserModel

**File:** `src/models/userModel.js`
**Dependencies:** None

**Description:**

Add two new exports after the existing `VALIDATION_RULES` (after line 44).

`UPDATE_COLUMNS` mirrors `INSERT_COLUMNS` — same array `['username', 'full_name', 'email', 'phone']`.

`UPDATE_VALIDATION_RULES` mirrors `VALIDATION_RULES` but with `required: false` on every field. Partial updates should not force client to resubmit unchanged fields. Existing `validateRequest` middleware already skips empty optional fields, so `required: false` means only present fields get pattern/maxLength checks.

```js
export const UPDATE_COLUMNS = ['username', 'full_name', 'email', 'phone']

export const UPDATE_VALIDATION_RULES = {
  username: { required: false, pattern: '^[a-zA-Z0-9_]+$', maxLength: 50 },
  full_name: { required: false, maxLength: 100 },
  email: { required: false, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', maxLength: 255 },
  phone: { required: false, maxLength: 20 },
}
```

**Acceptance Criteria:**
- [ ] `UPDATE_COLUMNS` exported as `['username', 'full_name', 'email', 'phone']`
- [ ] `UPDATE_VALIDATION_RULES` exported with all four fields having `required: false`
- [ ] Pattern and maxLength values match `VALIDATION_RULES` exactly
- [ ] Existing exports unchanged

---

### Task 2: Add findById, update, remove to UserRepository

**File:** `src/repositories/userRepository.js`
**Dependencies:** T1 (imports `UPDATE_COLUMNS`)

**Description:**

Add `UPDATE_COLUMNS` to the import from model (line 2). Add three methods to the existing `userRepository` object after `findAll`.

```js
// Import change — add UPDATE_COLUMNS
import { TABLE_NAME, INSERT_COLUMNS, UPDATE_COLUMNS } from '../models/userModel.js'

// New methods after findAll:
findById(id) {
  return getDb().prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`).get(id)
},

update(id, userData) {
  const fields = UPDATE_COLUMNS.filter(col => userData[col] !== undefined)
  if (fields.length === 0) return this.findById(id)

  const setClause = fields.map(col => `${col} = ?`).join(', ')
  const values = fields.map(col => userData[col])

  getDb().prepare(`UPDATE ${TABLE_NAME} SET ${setClause} WHERE id = ?`).run(...values, id)
  return this.findById(id)
},

remove(id) {
  const result = getDb().prepare(`DELETE FROM ${TABLE_NAME} WHERE id = ?`).run(id)
  return result.changes > 0
},
```

**Key details:**
- `findById` returns row object or `undefined` — matches `findByUsername`/`findByEmail` pattern
- `update` dynamically builds SET clause from only fields present in `userData`. Empty update returns current row without executing SQL
- `remove` returns `true`/`false` based on `result.changes`

**Acceptance Criteria:**
- [ ] `UPDATE_COLUMNS` imported from model
- [ ] `findById(id)` returns user row or `undefined`
- [ ] `update(id, userData)` updates only fields present in `userData`
- [ ] `update(id, {})` returns current row without UPDATE
- [ ] `update(id, userData)` returns updated row via `findById`
- [ ] `remove(id)` returns `true` when deleted, `false` when not found
- [ ] All queries use parameterized `?` placeholders
- [ ] Existing methods unchanged

---

### Task 3: Repository Tests — findById, update, remove

**File:** `src/repositories/userRepository.test.js`
**Dependencies:** T2

**Description:**

Add three `describe` blocks inside the existing top-level `describe('userRepository', ...)`. Uses existing in-memory DB setup (`beforeEach`/`afterEach`).

Add helper inside top-level describe:

```js
function insertTestUser(overrides = {}) {
  return userRepository.insertUser({
    username: 'testuser',
    full_name: 'Test User',
    email: 'test@example.com',
    phone: '555-0000',
    ...overrides,
  })
}
```

**Test cases:**

```
describe('findById')
  - returns user when found
  - returns undefined when not found

describe('update')
  - updates single field, preserves others
  - updates multiple fields at once
  - returns current row unchanged when no fields provided
  - returns undefined when user not found

describe('remove')
  - deletes user and returns true
  - returns false when user not found
```

**Acceptance Criteria:**
- [ ] All 8 test cases listed above pass
- [ ] Tests use in-memory DB via existing setup
- [ ] `insertTestUser` helper for DRY setup
- [ ] Existing test blocks unchanged
- [ ] All pass with `NODE_OPTIONS=--experimental-vm-modules npx jest src/repositories/userRepository.test.js`

---

## Batch 2 — Business Logic

### Task 4: Add updateUser, deleteUser to UserService

**File:** `src/services/userService.js`
**Dependencies:** T2 (uses `findById`, `update`, `remove` from repository)

**Description:**

Add two methods to the `userService` object. `NotFoundError` and `ValidationError` are already imported (line 2).

```js
updateUser(id, userData) {
  const existing = userRepository.findById(id)
  if (!existing) throw new NotFoundError('User')

  if (userData.username && userData.username !== existing.username) {
    if (userRepository.findByUsername(userData.username)) {
      throw new ValidationError('Username already exists')
    }
  }

  if (userData.email && userData.email !== existing.email) {
    if (userRepository.findByEmail(userData.email)) {
      throw new ValidationError('Email already exists')
    }
  }

  return userRepository.update(id, userData)
},

deleteUser(id) {
  const existing = userRepository.findById(id)
  if (!existing) throw new NotFoundError('User')
  return userRepository.remove(id)
},
```

**Uniqueness logic:** Only check if value changed from current. Allows user to PUT their own unchanged username/email.

**Acceptance Criteria:**
- [ ] `updateUser` throws `NotFoundError('User')` when id not found
- [ ] `updateUser` throws `ValidationError('Username already exists')` when username taken by another user
- [ ] `updateUser` throws `ValidationError('Email already exists')` when email taken by another user
- [ ] `updateUser` allows unchanged username/email (no false duplicate error)
- [ ] `updateUser` calls `userRepository.update(id, userData)` and returns result
- [ ] `deleteUser` throws `NotFoundError('User')` when id not found
- [ ] `deleteUser` calls `userRepository.remove(id)` and returns result
- [ ] No new imports needed

---

### Task 5: Service Tests — updateUser, deleteUser

**File:** `src/services/userService.test.js`
**Dependencies:** T4

**Description:**

Add two `describe` blocks. Use in-memory DB setup matching existing test pattern. Seed users via `userRepository.insertUser` directly.

**Test cases:**

```
describe('updateUser')
  - updates user successfully, returns updated record
  - throws NotFoundError for missing user
  - throws ValidationError for duplicate username (different user)
  - throws ValidationError for duplicate email (different user)
  - allows same username (unchanged) — no false error
  - allows partial update (only phone changes)

describe('deleteUser')
  - deletes user successfully
  - throws NotFoundError for missing user
```

Each test: seed user(s) via `insertUser`, call service method, assert result/error. Fresh DB per test.

**Acceptance Criteria:**
- [ ] All 8 test cases pass
- [ ] Duplicate checks seed TWO users — update second to conflict with first
- [ ] "Same username" test updates user with their own username + different field
- [ ] "Partial update" test sends only one field, verifies others unchanged
- [ ] Existing test blocks unchanged
- [ ] All pass with `NODE_OPTIONS=--experimental-vm-modules npx jest src/services/userService.test.js`

---

### Task 6: Add updateUser, deleteUser Controllers

**File:** `src/controllers/userController.js`
**Dependencies:** T4 (calls service methods)

**Description:**

Add two exports following existing pattern. No try/catch — errors bubble to global error middleware. No business logic in controller.

```js
export const updateUser = (req, res, next) => {
  const { id } = req.params
  const { username, full_name, email, phone } = req.body
  const user = userService.updateUser(id, { username, full_name, email, phone })
  res.json({ data: user })
}

export const deleteUser = (req, res, next) => {
  const { id } = req.params
  userService.deleteUser(id)
  res.status(204).send()
}
```

**Pattern matches existing:** Same signature `(req, res, next)`, same destructuring, same response shaping.

**Acceptance Criteria:**
- [ ] `updateUser` extracts `id` from `req.params`, fields from `req.body`
- [ ] `updateUser` returns 200 with `{ data: user }`
- [ ] `deleteUser` extracts `id` from `req.params`
- [ ] `deleteUser` returns 204 with no body
- [ ] No try/catch — errors propagate to `next`
- [ ] Pattern consistent with existing `createUser`/`getAllUsers`

---

## Batch 3 — Wiring + Frontend

### Task 7: Wire PUT and DELETE Routes

**File:** `src/routes/userRoutes.js`
**Dependencies:** T1 (`UPDATE_VALIDATION_RULES`), T6 (`updateUser`, `deleteUser` controller exports)

**Description:**

Update imports and add two routes. Full file becomes:

```js
import { Router } from 'express'
import { createUser, getAllUsers, updateUser, deleteUser } from '../controllers/userController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { VALIDATION_RULES, UPDATE_VALIDATION_RULES } from '../models/userModel.js'

const router = Router()

router.post('/', validateRequest(VALIDATION_RULES), createUser)
router.get('/', getAllUsers)
router.put('/:id', validateRequest(UPDATE_VALIDATION_RULES), updateUser)
router.delete('/:id', deleteUser)

export default router
```

`validateRequest(UPDATE_VALIDATION_RULES)` validates only fields present in body (all optional for update). DELETE has no body, so no validation middleware needed.

**Acceptance Criteria:**
- [ ] `updateUser` and `deleteUser` imported from controller
- [ ] `UPDATE_VALIDATION_RULES` imported from model
- [ ] `PUT /:id` registered with validation middleware
- [ ] `DELETE /:id` registered without validation middleware
- [ ] Existing POST and GET routes unchanged

---

### Task 8: Controller Integration Tests — PUT and DELETE

**File:** `src/controllers/userController.test.js`
**Dependencies:** T7 (routes wired)

**Description:**

Add two `describe` blocks using supertest against the Express app. Use existing `createTestDb` setup (in-memory SQLite, `beforeEach`/`afterEach`). Each test creates a user via POST first.

**Note on response shape:** `POST` wraps in `{ data: user }`, so created user ID is at `created.body.data.id`. `GET /api/users` returns array directly (no wrapper).

**Test cases:**

```
describe('PUT /api/users/:id')
  - 200 with updated user (change full_name + email, verify response)
  - 404 for nonexistent user
  - 400 for invalid email format
  - 409 for duplicate username

describe('DELETE /api/users/:id')
  - 204 for successful delete (verify user gone via GET)
  - 404 for nonexistent user
```

**Acceptance Criteria:**
- [ ] 6 tests: PUT (200, 404, 400, 409), DELETE (204, 404)
- [ ] Duplicate test seeds two users, updates second to conflict with first
- [ ] Each test self-contained — creates own data
- [ ] Existing POST/GET tests unchanged
- [ ] All pass with `rtk npm test`

---

### Task 9: Frontend — Edit and Delete UI

**File:** `public/index.html`
**Dependencies:** T7 (PUT/DELETE endpoints available)

**Description:**

Four changes to the existing page.

**1. Add state variables** (line 70, before `fetchUsers`):

```js
let currentUsers = []
let editingUserId = null
```

**2. Modify `fetchUsers`** — cache response data:

```js
// After const users = await res.json()
currentUsers = users
```

**3. Add Actions column** to table:

Header (after `<th>Created At</th>`):
```html
<th>Actions</th>
```

In `renderUsers`, update colspan from 6 to 7 for placeholder rows. In the row-building loop, change from `tr.innerHTML = ...` to building string with `data-id` and actions cell:

```js
tr.innerHTML = `<td>${u.id}</td><td>${u.username}</td><td>${u.full_name}</td><td>${u.email}</td><td>${u.phone ?? ''}</td><td>${date}</td><td><button class="edit-btn" onclick="editUser(${u.id})">Edit</button><button class="delete-btn" onclick="deleteUser(${u.id})">Delete</button></td>`
```

**4. Add `editUser` function** (after `renderUsers`):

```js
function editUser(id) {
  const user = currentUsers.find(u => u.id === id)
  if (!user) return
  document.getElementById('username').value = user.username || ''
  document.getElementById('full_name').value = user.full_name || ''
  document.getElementById('email').value = user.email || ''
  document.getElementById('phone').value = user.phone || ''
  editingUserId = id
  document.querySelector('#add-user-form button[type="submit"]').textContent = 'Update User'
}
```

**5. Add `deleteUser` function** (after `editUser`):

```js
async function deleteUser(id) {
  if (!confirm('Delete this user?')) return
  try {
    const res = await fetch('/api/users/' + id, { method: 'DELETE' })
    if (res.status === 204) { fetchUsers(); return }
    const err = await res.json()
    showError(err.error || 'Failed to delete user')
  } catch (err) {
    showError(err.message)
  }
}
```

**6. Modify `addUser`** — branch on `editingUserId`:

```js
async function addUser(event) {
  event.preventDefault()
  const form = event.target
  const data = Object.fromEntries(new FormData(form))

  let url = '/api/users'
  let method = 'POST'

  if (editingUserId) {
    url = '/api/users/' + editingUserId
    method = 'PUT'
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to save user')
    }
    editingUserId = null
    document.querySelector('#add-user-form button[type="submit"]').textContent = 'Add User'
    form.reset()
    hideError()
    fetchUsers()
  } catch (err) {
    showError(err.message)
  }
}
```

**7. CSS additions** (in `<style>` block):

```css
.edit-btn { margin-right: 4px; }
.delete-btn { background: #dc3545; }
.delete-btn:hover { background: #c82333; }
```

**Acceptance Criteria:**
- [ ] Table has Actions column header; each row has Edit + Delete buttons
- [ ] `currentUsers` caches fetched data
- [ ] Edit populates form, sets `editingUserId`, changes button to "Update User"
- [ ] Submit while editing sends PUT; submit normally sends POST
- [ ] After successful PUT: form resets, `editingUserId` clears, button reverts to "Add User"
- [ ] Delete shows confirm dialog, sends DELETE, refreshes table on success
- [ ] Existing add-user flow (POST) works unchanged when not editing
- [ ] Delete button styled red, edit button has right margin
