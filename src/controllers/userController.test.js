import request from 'supertest'
import app from '../app.js'
import { getDb, closeDb } from '../utils/db.js'
import { CREATE_TABLE_SQL, INSERT_COLUMNS, TABLE_NAME } from '../models/userModel.js'

function createTestDb() {
  closeDb()
  const db = getDb(':memory:')
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(CREATE_TABLE_SQL)
  return db
}

function insertTestUser(overrides = {}) {
  const user = { username: 'testuser', full_name: 'Test User', email: 'test@example.com', phone: '555-0000', ...overrides }
  const cols = INSERT_COLUMNS.join(', ')
  const placeholders = INSERT_COLUMNS.map(() => '?').join(', ')
  getDb().prepare(`INSERT INTO ${TABLE_NAME} (${cols}) VALUES (${placeholders})`).run(...INSERT_COLUMNS.map(c => user[c]))
  return user
}

beforeEach(() => {
  createTestDb()
})

afterEach(() => {
  closeDb()
})

describe('POST /api/users', () => {
  const validPayload = { username: 'jdoe', full_name: 'John Doe', email: 'john@example.com' }

  it('201 with valid payload', async () => {
    const res = await request(app)
      .post('/api/users')
      .send(validPayload)
      .expect(201)

    expect(res.body.data).toMatchObject({
      username: 'jdoe',
      full_name: 'John Doe',
      email: 'john@example.com',
    })
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.created_at).toBeDefined()
  })

  it('400 when username missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ full_name: 'John Doe', email: 'john@example.com' })
      .expect(400)

    expect(res.body.error).toMatch(/username/i)
  })

  it('400 when email invalid', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'jdoe', full_name: 'John Doe', email: 'not-an-email' })
      .expect(400)

    expect(res.body.error).toMatch(/email/i)
  })

  it('400 when full_name missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'jdoe', email: 'john@example.com' })
      .expect(400)

    expect(res.body.error).toMatch(/full_name/i)
  })

  it('400 on duplicate username', async () => {
    insertTestUser({ username: 'jdoe', email: 'original@example.com' })

    const res = await request(app)
      .post('/api/users')
      .send({ username: 'jdoe', full_name: 'Jane Doe', email: 'jane@example.com' })
      .expect(400)

    expect(res.body.error).toMatch(/username/i)
  })

  it('400 on duplicate email', async () => {
    insertTestUser({ username: 'original', email: 'john@example.com' })

    const res = await request(app)
      .post('/api/users')
      .send({ username: 'jane', full_name: 'Jane Doe', email: 'john@example.com' })
      .expect(400)

    expect(res.body.error).toMatch(/email/i)
  })

  it('400 for empty body', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({})
      .expect(400)

    expect(res.body.error).toBeDefined()
  })
})

describe('GET /api/users', () => {
  it('200 with empty array on fresh DB', async () => {
    const res = await request(app)
      .get('/api/users')
      .expect(200)

    expect(res.body).toEqual([])
  })

  it('200 with users sorted by created_at DESC', async () => {
    insertTestUser({ username: 'user1', full_name: 'First', email: 'first@example.com' })
    insertTestUser({ username: 'user2', full_name: 'Second', email: 'second@example.com' })

    const res = await request(app)
      .get('/api/users')
      .expect(200)

    expect(res.body).toHaveLength(2)
    const timestamps = res.body.map(u => u.created_at)
    expect(new Date(timestamps[0]).getTime()).toBeGreaterThanOrEqual(new Date(timestamps[1]).getTime())
  })

  it('200 with correct object shape', async () => {
    insertTestUser({ username: 'shapeuser', full_name: 'Shape Test', email: 'shape@example.com' })

    const res = await request(app)
      .get('/api/users')
      .expect(200)

    expect(res.body).toHaveLength(1)
    const user = res.body[0]
    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('username')
    expect(user).toHaveProperty('full_name')
    expect(user).toHaveProperty('email')
    expect(user).toHaveProperty('created_at')
  })
})

describe('PUT /api/users/:id', () => {
  it('200 with updated user', async () => {
    const created = await request(app)
      .post('/api/users')
      .send({ username: 'original', full_name: 'Original User', email: 'original@example.com' })
      .expect(201)

    const res = await request(app)
      .put(`/api/users/${created.body.data.id}`)
      .send({ full_name: 'Updated Name', phone: '555-1234' })
      .expect(200)

    expect(res.body.data).toMatchObject({
      username: 'original',
      full_name: 'Updated Name',
      email: 'original@example.com',
      phone: '555-1234',
    })
  })

  it('404 for nonexistent user', async () => {
    const res = await request(app)
      .put('/api/users/99999')
      .send({ full_name: 'Ghost' })
      .expect(404)

    expect(res.body.error).toMatch(/not found/i)
  })

  it('400 for invalid email format', async () => {
    const created = await request(app)
      .post('/api/users')
      .send({ username: 'emailtest', full_name: 'Email Test', email: 'email@example.com' })
      .expect(201)

    const res = await request(app)
      .put(`/api/users/${created.body.data.id}`)
      .send({ email: 'not-an-email' })
      .expect(400)

    expect(res.body.error).toMatch(/email/i)
  })

  it('409 for duplicate username', async () => {
    await request(app)
      .post('/api/users')
      .send({ username: 'taken', full_name: 'Taken User', email: 'taken@example.com' })
      .expect(201)

    const created = await request(app)
      .post('/api/users')
      .send({ username: 'updater', full_name: 'Updater', email: 'updater@example.com' })
      .expect(201)

    const res = await request(app)
      .put(`/api/users/${created.body.data.id}`)
      .send({ username: 'taken' })
      .expect(400)

    expect(res.body.error).toMatch(/username/i)
  })
})

describe('DELETE /api/users/:id', () => {
  it('204 successful delete and verifies user gone via GET', async () => {
    const created = await request(app)
      .post('/api/users')
      .send({ username: 'doomed', full_name: 'Doomed User', email: 'doomed@example.com' })
      .expect(201)

    await request(app)
      .delete(`/api/users/${created.body.data.id}`)
      .expect(204)

    const list = await request(app).get('/api/users').expect(200)
    expect(list.body.find(u => u.id === created.body.data.id)).toBeUndefined()
  })

  it('404 for nonexistent user', async () => {
    const res = await request(app)
      .delete('/api/users/99999')
      .expect(404)

    expect(res.body.error).toMatch(/not found/i)
  })
})

describe('Error handling', () => {
  it('404 for unknown routes returns JSON error', async () => {
    const res = await request(app)
      .get('/api/nonexistent')
      .expect(404)

    expect(res.body.error).toBeDefined()
  })

  it('JSON error format consistent across all errors', async () => {
    const validationRes = await request(app)
      .post('/api/users')
      .send({})
      .expect(400)

    expect(validationRes.headers['content-type']).toMatch(/json/)
    expect(validationRes.body.error).toBeDefined()
    expect(typeof validationRes.body.error).toBe('string')

    const notFoundRes = await request(app)
      .get('/api/does-not-exist')
      .expect(404)

    expect(notFoundRes.headers['content-type']).toMatch(/json/)
    expect(notFoundRes.body.error).toBeDefined()
    expect(typeof notFoundRes.body.error).toBe('string')
  })
})
