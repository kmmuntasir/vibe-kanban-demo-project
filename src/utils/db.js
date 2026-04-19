import Database from 'better-sqlite3'

let db = null

export function getDb(path) {
  if (db) return db

  const dbPath = path ?? process.env.DATABASE_PATH ?? './data/kanban.db'
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
