# Update & Delete Feature — Task Plan

## Scope

Implement `PUT /api/users/:id` and `DELETE /api/users/:id` across all layers + frontend UI.

Create and Read already done. Patterns established. Follow them exactly.

---

## Current State

| Layer | Create | Read | Update | Delete |
|-------|--------|------|--------|--------|
| Routes | ✅ | ✅ | ❌ | ❌ |
| Controller | ✅ | ✅ | ❌ | ❌ |
| Service | ✅ | ✅ | ❌ | ❌ |
| Repository | ✅ | ✅ | ❌ | ❌ |
| Frontend | ✅ | ✅ | ❌ | ❌ |
| Tests | ✅ | ✅ | ❌ | ❌ |

---

## Task Breakdown

### Task 1: Repository — Add `findById`, `update`, `delete`

**File:** `src/repositories/userRepository.js`

Add three methods to existing `userRepository` object:

```js
findById(id) {
  return getDb().prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`).get(id)
},

update(id, userData) {
  const db = getDb()
  const fields = []
  const values = []

  for (const col of UPDATE_COLUMNS) {
    if (userData[col] !== undefined) {
      fields.push(`${col} = ?`)
      values.push(userData[col])
    }
  }

  if (fields.length === 0) return db.prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`).get(id)

  values.push(id)
  db.prepare(`UPDATE ${TABLE_NAME} SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return db.prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`).get(id)
},

remove(id) {
  const result = getDb().prepare(`DELETE FROM ${TABLE_NAME} WHERE id = ?`).run(id)
  return result.changes > 0
},
```

**File:** `src/models/userModel.js`

Add export:

```js
export const UPDATE_COLUMNS = ['username', 'full_name', 'email', 'phone']
```

`INSERT_COLUMNS` already has same array. Can reuse or alias. Either works.

**Dependencies:** None. Start here.

---

### Task 2: Service — Add `updateUser`, `deleteUser`

**File:** `src/services/userService.js`

Add to `userService` object:

```js
updateUser(id, userData) {
  const existing = userRepository.findById(id)
  if (!existing) throw new NotFoundError('User')

  if (userData.username && userData.username !== existing.username) {
    const dup = userRepository.findByUsername(userData.username)
    if (dup) throw new ValidationError('Username already exists')
  }

  if (userData.email && userData.email !== existing.email) {
    const dup = userRepository.findByEmail(userData.email)
    if (dup) throw new ValidationError('Email already exists')
  }

  return userRepository.update(id, userData)
},

deleteUser(id) {
  const existing = userRepository.findById(id)
  if (!existing) throw new NotFoundError('User')
  return userRepository.remove(id)
},
```

**Validation logic for update:**
- Only check uniqueness if field value changed
- Allow partial updates (only sent fields)
- 404 if user not found

**Dependencies:** Task 1

---

### Task 3: Controller — Add `updateUser`, `deleteUser`

**File:** `src/controllers/userController.js`

Add exports:

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

**Notes:**
- Update returns 200 with updated user
- Delete returns 204 (no body)
- Both extract `id` from `req.params`

**Dependencies:** Task 2

---

### Task 4: Routes — Wire PUT and DELETE

**File:** `src/routes/userRoutes.js`

Add two routes:

```js
router.put('/:id', validateRequest(VALIDATION_RULES), updateUser)
router.delete('/:id', deleteUser)
```

Update imports to include `updateUser`, `deleteUser` from controller.

**Validation note:** `validateRequest` middleware validates all required fields. For update, fields should be optional (partial update). Need UPDATE_VALIDATION_RULES where required=false for all fields, or modify validateRequest to skip required when value absent.

**Decision needed:** Current `VALIDATION_RULES` marks `username`, `full_name`, `email` as required. For PUT, PRD says update accepts partial data. Options:

1. Create `UPDATE_VALIDATION_RULES` with `required: false` on all fields
2. Modify `validateRequest` to accept an `options` param for partial mode
3. Only validate fields present in body (current middleware already skips if empty AND not required)

**Recommended:** Option 1. Add `UPDATE_VALIDATION_RULES` to `userModel.js` with same patterns/maxLength but `required: false`. Cleanest separation.

**Dependencies:** Task 3

---

### Task 5: Frontend — Edit and Delete UI

**File:** `public/index.html`

#### 5a. Table action columns

Add "Actions" column to table header. Each row gets Edit + Delete buttons:

```html
<th>Actions</th>
```

```js
// In renderUsers(), add cell per row:
<td>
  <button class="edit-btn" onclick="editUser(${user.id})">Edit</button>
  <button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button>
</td>
```

#### 5b. Delete function

```js
async function deleteUser(id) {
  if (!confirm('Delete this user?')) return
  try {
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    fetchUsers()
  } catch (err) {
    showError('Failed to delete user: ' + err.message)
  }
}
```

#### 5c. Edit function

Two approaches:

**A) Inline edit:** Click Edit → row becomes editable → Save/Cancel buttons
**B) Form reuse:** Click Edit → populate Add form with user data → change button to "Update User" → submit PUT

**Recommended:** Option B. Less DOM manipulation, reuses existing form. Add hidden field for edit-mode user ID.

```js
let editingUserId = null

function editUser(id) {
  // Fetch user, populate form, change button text
  const row = document.querySelector(`tr[data-id="${id}"]`)
  // or fetch from cached data
  const user = currentUsers.find(u => u.id === id)
  if (!user) return

  document.getElementById('username').value = user.username || ''
  document.getElementById('full_name').value = user.full_name || ''
  document.getElementById('email').value = user.email || ''
  document.getElementById('phone').value = user.phone || ''

  editingUserId = id
  document.querySelector('button[type="submit"]').textContent = 'Update User'
}
```

Modify existing form submit handler: if `editingUserId` set, send PUT instead of POST.

```js
if (editingUserId) {
  response = await fetch(`/api/users/${editingUserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, full_name, email, phone })
  })
  editingUserId = null
  document.querySelector('button[type="submit"]').textContent = 'Add User'
} else {
  response = await fetch('/api/users', {
    method: 'POST',
    ...
  })
}
```

#### 5d. CSS

Minimal styling for action buttons:

```css
.edit-btn { margin-right: 4px; }
.delete-btn { color: red; }
```

**Dependencies:** Tasks 1-4 (backend must be ready)

---

### Task 6: Tests

#### 6a. Repository tests

**File:** `src/repositories/userRepository.test.js`

Add test cases:

```
describe('findById')
  - returns user when found
  - returns undefined when not found

describe('update')
  - updates single field
  - updates multiple fields
  - returns updated user
  - returns user unchanged when no fields provided

describe('remove')
  - deletes user and returns true
  - returns false when user not found
```

#### 6b. Service tests

**File:** `src/services/userService.test.js`

Add test cases:

```
describe('updateUser')
  - updates user successfully
  - throws NotFoundError for missing user
  - throws ValidationError for duplicate username
  - throws ValidationError for duplicate email
  - allows same username/email (no change)
  - allows partial update (only username)

describe('deleteUser')
  - deletes user successfully
  - throws NotFoundError for missing user
```

#### 6c. Controller/integration tests

**File:** `src/controllers/userController.test.js`

Add test cases using supertest:

```
describe('PUT /api/users/:id')
  - 200 with updated user
  - 404 for missing user
  - 400 for invalid email format
  - 409 for duplicate username

describe('DELETE /api/users/:id')
  - 204 for successful delete
  - 404 for missing user
```

**Dependencies:** Tasks 1-4

---

## Execution Order

```
Task 1 (Repository + Model)
  ↓
Task 2 (Service)
  ↓
Task 3 (Controller)
  ↓
Task 4 (Routes)
  ↓
Task 5 (Frontend) ← can start UI once backend wired
  ↓
Task 6 (Tests) ← can write alongside each layer
```

Tasks 1-4 are sequential (each depends on previous). Task 5 and 6 can overlap with backend work.

**Suggested parallel execution:**

- Dev A: Tasks 1 → 2 → 3 → 4 (backend)
- Dev B: Task 5 (frontend, once backend endpoints documented)

Task 6 can be written per-layer as each completes.

---

## Files Modified

| File | Change |
|------|--------|
| `src/models/userModel.js` | Add `UPDATE_VALIDATION_RULES` |
| `src/repositories/userRepository.js` | Add `findById`, `update`, `remove` |
| `src/services/userService.js` | Add `updateUser`, `deleteUser` |
| `src/controllers/userController.js` | Add `updateUser`, `deleteUser` exports |
| `src/routes/userRoutes.js` | Add PUT and DELETE routes |
| `public/index.html` | Add edit/delete buttons, form reuse, JS functions, CSS |
| `src/repositories/userRepository.test.js` | Add tests for new methods |
| `src/services/userService.test.js` | Add tests for new methods |
| `src/controllers/userController.test.js` | Add integration tests for PUT/DELETE |

**New files:** None. All changes to existing files.

---

## API Contracts

### PUT /api/users/:id

**Request:**
```json
{
  "username": "jdoe_updated",
  "full_name": "John Doe Jr.",
  "email": "john.updated@example.com",
  "phone": "555-0199"
}
```

All fields optional. Only sent fields get updated. Pattern/maxLength validation on present fields.

**Responses:**
- `200` — `{ "data": { id, username, full_name, email, phone, created_at } }`
- `400` — `{ "error": "validation message" }`
- `404` — `{ "error": "User not found" }`
- `409` — `{ "error": "Username already exists" }` (or Email)

### DELETE /api/users/:id

**Request:** No body.

**Responses:**
- `204` — No body
- `404` — `{ "error": "User not found" }`

---

## Edge Cases

1. **Partial update:** Only fields in request body get updated. Empty body = no-op, returns current user.
2. **Uniqueness on update:** Check only if value changed from current. Allows user to PUT their own unchanged username.
3. **Delete non-existent:** Return 404, not 204.
4. **Invalid ID format:** `req.params.id` is string. Cast to Number for SQLite. Non-numeric ID → `findById` returns undefined → 404.
5. **Empty phone:** `phone` is optional. Empty string should store as null or empty — match current insert behavior.
