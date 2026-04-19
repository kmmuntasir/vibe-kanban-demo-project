import { getDb } from '../utils/db.js'
import { TABLE_NAME, INSERT_COLUMNS } from '../models/userModel.js'

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
    // Workshop gap — implemented in Batch 4
    return []
  },
}
