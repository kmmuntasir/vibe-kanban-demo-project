import { jest } from '@jest/globals'
import Database from 'better-sqlite3'
import { CREATE_TABLE_SQL } from '../models/userModel.js'

let db

jest.unstable_mockModule('../utils/db.js', () => ({
  getDb: () => db,
  closeDb: () => {},
}))

const { userRepository } = await import('./userRepository.js')

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(CREATE_TABLE_SQL)
})

afterEach(() => {
  db.close()
})

describe('userRepository', () => {
  describe('insertUser', () => {
    it('inserts user, returns full record with id and created_at', () => {
      const user = userRepository.insertUser({
        username: 'jdoe',
        full_name: 'John Doe',
        email: 'jdoe@example.com',
        phone: '555-1234',
      })

      expect(user.id).toBeDefined()
      expect(user.username).toBe('jdoe')
      expect(user.full_name).toBe('John Doe')
      expect(user.email).toBe('jdoe@example.com')
      expect(user.phone).toBe('555-1234')
      expect(user.created_at).toBeDefined()
    })

    it('inserts user with null phone', () => {
      const user = userRepository.insertUser({
        username: 'nophone',
        full_name: 'No Phone',
        email: 'nophone@example.com',
        phone: null,
      })

      expect(user.phone).toBeNull()
      expect(user.username).toBe('nophone')
    })

    it('throws on duplicate username (UNIQUE constraint)', () => {
      userRepository.insertUser({
        username: 'dup',
        full_name: 'First',
        email: 'first@example.com',
        phone: null,
      })

      expect(() =>
        userRepository.insertUser({
          username: 'dup',
          full_name: 'Second',
          email: 'second@example.com',
          phone: null,
        })
      ).toThrow()
    })

    it('throws on duplicate email (UNIQUE constraint)', () => {
      userRepository.insertUser({
        username: 'user1',
        full_name: 'User One',
        email: 'same@example.com',
        phone: null,
      })

      expect(() =>
        userRepository.insertUser({
          username: 'user2',
          full_name: 'User Two',
          email: 'same@example.com',
          phone: null,
        })
      ).toThrow()
    })

    it('throws when required field missing', () => {
      expect(() =>
        userRepository.insertUser({
          username: 'missing',
          email: 'missing@example.com',
          phone: null,
        })
      ).toThrow()
    })
  })

  describe('findAll', () => {
    it('returns [] when no users', () => {
      const users = userRepository.findAll()
      expect(users).toEqual([])
    })
  })

  describe('findByUsername', () => {
    it('returns user when found', () => {
      userRepository.insertUser({
        username: 'findme',
        full_name: 'Find Me',
        email: 'findme@example.com',
        phone: null,
      })

      const user = userRepository.findByUsername('findme')
      expect(user).toBeDefined()
      expect(user.username).toBe('findme')
      expect(user.full_name).toBe('Find Me')
      expect(user.email).toBe('findme@example.com')
    })

    it('returns undefined when not found', () => {
      const user = userRepository.findByUsername('ghost')
      expect(user).toBeUndefined()
    })
  })
})
