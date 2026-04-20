import { getDb } from '../utils/db.js'
import { TABLE_NAME, INSERT_COLUMNS, UPDATE_COLUMNS } from '../models/userModel.js'

export const userRepository = {
  insertUser(userData) {
    const db = getDb()
    const cols = INSERT_COLUMNS.join(', ')
    const placeholders = INSERT_COLUMNS.map(() => '?').join(', ')
    const values = INSERT_COLUMNS.map(col => userData[col])

    const result = db.prepare(
      `INSERT INTO ${TABLE_NAME} (${cols}) VALUES (${placeholders})`
    ).run(...values)

    return db.prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`).get(result.lastInsertRowid)
  },

  findByUsername(username) {
    return getDb().prepare(`SELECT * FROM ${TABLE_NAME} WHERE username = ?`).get(username)
  },

  findByEmail(email) {
    return getDb().prepare(`SELECT * FROM ${TABLE_NAME} WHERE email = ?`).get(email)
  },

  findAll() {
    return getDb().prepare(`SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`).all()
  },

  findById(id) {
    return getDb().prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`).get(id)
  },

  update(id, userData) {
    const db = getDb()
    const fields = UPDATE_COLUMNS.filter(col => userData[col] !== undefined)

    if (fields.length === 0) {
      return db.prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`).get(id)
    }

    const setClause = fields.map(col => `${col} = ?`).join(', ')
    const values = fields.map(col => userData[col])

    db.prepare(
      `UPDATE ${TABLE_NAME} SET ${setClause} WHERE id = ?`
    ).run(...values, id)

    return db.prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`).get(id)
  },

  remove(id) {
    const result = getDb().prepare(
      `DELETE FROM ${TABLE_NAME} WHERE id = ?`
    ).run(id)
    return result.changes > 0
  },
}
