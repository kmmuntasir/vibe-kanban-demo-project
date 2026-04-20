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

  describe('findById', () => {
    it('returns user when found', () => {
      const inserted = userRepository.insertUser({
        username: 'byid',
        full_name: 'By Id',
        email: 'byid@example.com',
        phone: null,
      })

      const user = userRepository.findById(inserted.id)
      expect(user).toBeDefined()
      expect(user.id).toBe(inserted.id)
      expect(user.username).toBe('byid')
    })

    it('returns undefined when not found', () => {
      const user = userRepository.findById(9999)
      expect(user).toBeUndefined()
    })
  })

  describe('update', () => {
    it('updates specified fields only', () => {
      const inserted = userRepository.insertUser({
        username: 'update1',
        full_name: 'Original Name',
        email: 'update1@example.com',
        phone: '555-0000',
      })

      const updated = userRepository.update(inserted.id, { full_name: 'New Name' })
      expect(updated.full_name).toBe('New Name')
      expect(updated.username).toBe('update1')
      expect(updated.email).toBe('update1@example.com')
      expect(updated.phone).toBe('555-0000')
    })

    it('updates multiple fields', () => {
      const inserted = userRepository.insertUser({
        username: 'multi',
        full_name: 'Multi',
        email: 'multi@example.com',
        phone: null,
      })

      const updated = userRepository.update(inserted.id, {
        full_name: 'Changed',
        phone: '555-9999',
      })
      expect(updated.full_name).toBe('Changed')
      expect(updated.phone).toBe('555-9999')
    })

    it('returns current row when no fields provided', () => {
      const inserted = userRepository.insertUser({
        username: 'noop',
        full_name: 'Noop',
        email: 'noop@example.com',
        phone: null,
      })

      const result = userRepository.update(inserted.id, {})
      expect(result.id).toBe(inserted.id)
      expect(result.username).toBe('noop')
    })

    it('returns undefined for non-existent id', () => {
      const result = userRepository.update(9999, { full_name: 'Ghost' })
      expect(result).toBeUndefined()
    })
  })

  describe('remove', () => {
    it('deletes user and returns true', () => {
      const inserted = userRepository.insertUser({
        username: 'delete1',
        full_name: 'Delete Me',
        email: 'delete1@example.com',
        phone: null,
      })

      const result = userRepository.remove(inserted.id)
      expect(result).toBe(true)
      expect(userRepository.findById(inserted.id)).toBeUndefined()
    })

    it('returns false for non-existent id', () => {
      const result = userRepository.remove(9999)
      expect(result).toBe(false)
    })
  })
})
