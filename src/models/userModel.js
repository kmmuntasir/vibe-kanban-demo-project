export const TABLE_NAME = 'users';

export const COLUMNS = {
  id: { type: 'INTEGER', required: false, unique: false, autoIncrement: true },
  username: { type: 'TEXT', required: true, unique: true },
  full_name: { type: 'TEXT', required: true, unique: false },
  email: { type: 'TEXT', required: true, unique: true },
  phone: { type: 'TEXT', required: false, unique: false },
  created_at: { type: 'TEXT', required: false, unique: false },
};

export const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`;

export const INSERT_COLUMNS = ['username', 'full_name', 'email', 'phone'];

export const UPDATE_COLUMNS = ['username', 'full_name', 'email', 'phone'];

export const VALIDATION_RULES = {
  username: {
    required: true,
    pattern: '^[a-zA-Z0-9_]+$',
    maxLength: 50,
  },
  full_name: {
    required: true,
    maxLength: 100,
  },
  email: {
    required: true,
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    maxLength: 255,
  },
  phone: {
    required: false,
    maxLength: 20,
  },
};

export const UPDATE_VALIDATION_RULES = {
  username: { required: false, pattern: '^[a-zA-Z0-9_]+$', maxLength: 50 },
  full_name: { required: false, maxLength: 100 },
  email: { required: false, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', maxLength: 255 },
  phone: { required: false, maxLength: 20 },
};
