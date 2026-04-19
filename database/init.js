import { getDb } from '../src/utils/db.js'
import { CREATE_TABLE_SQL, INSERT_COLUMNS, TABLE_NAME } from '../src/models/userModel.js'

const SEED_USERS = [
  ['jdoe', 'John Doe', 'john@example.com', '555-0101'],
  ['asmith', 'Alice Smith', 'alice@example.com', '555-0102'],
  ['bwong', 'Bob Wong', 'bob@example.com', null],
]

export function initDatabase() {
  const db = getDb()

  db.exec(CREATE_TABLE_SQL)

  const { count } = db.prepare(`SELECT COUNT(*) as count FROM ${TABLE_NAME}`).get()

  if (count === 0) {
    const insert = db.prepare(
      `INSERT INTO ${TABLE_NAME} (${INSERT_COLUMNS.join(', ')}) VALUES (?, ?, ?, ?)`
    )

    const seed = db.transaction((users) => {
      for (const user of users) {
        insert.run(...user)
      }
    })

    seed(SEED_USERS)
  }

  return db
}
