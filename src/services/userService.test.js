import { jest, describe, it, expect, beforeEach } from '@jest/globals'

const mockInsertUser = jest.fn()
const mockFindByUsername = jest.fn()
const mockFindByEmail = jest.fn()
const mockFindAll = jest.fn()
const mockFindById = jest.fn()
const mockUpdate = jest.fn()
const mockRemove = jest.fn()

jest.unstable_mockModule('../repositories/userRepository.js', () => ({
  userRepository: {
    insertUser: mockInsertUser,
    findByUsername: mockFindByUsername,
    findByEmail: mockFindByEmail,
    findAll: mockFindAll,
    findById: mockFindById,
    update: mockUpdate,
    remove: mockRemove,
  },
}))

const { userRepository } = await import('../repositories/userRepository.js')
const { userService } = await import('./userService.js')
const { ValidationError } = await import('../middleware/errorHandler.js')
const { NotFoundError } = await import('../middleware/errorHandler.js')

describe('userService', () => {
  describe('createUser', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('creates user with valid data and returns result', () => {
      const newUser = { id: 1, username: 'alice', email: 'a@b.com' }
      mockFindByUsername.mockReturnValue(undefined)
      mockFindByEmail.mockReturnValue(undefined)
      mockInsertUser.mockReturnValue(newUser)

      const result = userService.createUser({
        username: 'alice',
        full_name: 'Alice',
        email: 'a@b.com',
      })

      expect(result).toEqual(newUser)
      expect(mockInsertUser).toHaveBeenCalledWith({
        username: 'alice',
        full_name: 'Alice',
        email: 'a@b.com',
      })
    })

    it('throws ValidationError on duplicate username', () => {
      mockFindByUsername.mockReturnValue({ id: 1, username: 'alice' })

      expect(() =>
        userService.createUser({ username: 'alice', email: 'new@b.com' })
      ).toThrow(ValidationError)
      expect(() =>
        userService.createUser({ username: 'alice', email: 'new@b.com' })
      ).toThrow('Username already exists')
      expect(mockInsertUser).not.toHaveBeenCalled()
    })

    it('throws ValidationError on duplicate email', () => {
      mockFindByUsername.mockReturnValue(undefined)
      mockFindByEmail.mockReturnValue({ id: 2, email: 'a@b.com' })

      expect(() =>
        userService.createUser({ username: 'new', email: 'a@b.com' })
      ).toThrow(ValidationError)
      expect(() =>
        userService.createUser({ username: 'new', email: 'a@b.com' })
      ).toThrow('Email already exists')
      expect(mockInsertUser).not.toHaveBeenCalled()
    })

    it('passes phone through when provided', () => {
      mockFindByUsername.mockReturnValue(undefined)
      mockFindByEmail.mockReturnValue(undefined)
      mockInsertUser.mockReturnValue({ id: 1 })

      userService.createUser({
        username: 'alice',
        email: 'a@b.com',
        phone: '555-1234',
      })

      expect(mockInsertUser).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '555-1234' })
      )
    })

    it('passes phone as null when omitted', () => {
      mockFindByUsername.mockReturnValue(undefined)
      mockFindByEmail.mockReturnValue(undefined)
      mockInsertUser.mockReturnValue({ id: 1 })

      userService.createUser({
        username: 'alice',
        email: 'a@b.com',
      })

      const callArg = mockInsertUser.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('phone')
    })
  })

  describe('getAllUsers', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('returns all users from repository', () => {
      const users = [
        { id: 1, username: 'alice' },
        { id: 2, username: 'bob' },
      ]
      mockFindAll.mockReturnValue(users)

      expect(userService.getAllUsers()).toEqual(users)
    })

    it('returns empty array when repo returns empty', () => {
      mockFindAll.mockReturnValue([])

      expect(userService.getAllUsers()).toEqual([])
    })

    it('calls findAll exactly once', () => {
      mockFindAll.mockReturnValue([])

      userService.getAllUsers()

      expect(mockFindAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('updateUser', () => {
    const existingUser = { id: 1, username: 'alice', full_name: 'Alice', email: 'alice@test.com', phone: '555-0000' }
    const otherUser = { id: 2, username: 'bob', full_name: 'Bob', email: 'bob@test.com', phone: '555-0001' }

    beforeEach(() => {
      jest.clearAllMocks()
      mockFindById.mockReturnValue(existingUser)
    })

    it('updates user successfully and returns updated record', () => {
      const updated = { ...existingUser, full_name: 'Alice Updated' }
      mockUpdate.mockReturnValue(updated)

      const result = userService.updateUser(1, { full_name: 'Alice Updated' })

      expect(result).toEqual(updated)
      expect(mockUpdate).toHaveBeenCalledWith(1, { full_name: 'Alice Updated' })
    })

    it('throws NotFoundError for missing user', () => {
      mockFindById.mockReturnValue(undefined)

      expect(() => userService.updateUser(99, { full_name: 'Ghost' })).toThrow(NotFoundError)
      expect(() => userService.updateUser(99, { full_name: 'Ghost' })).toThrow('User not found')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('throws ValidationError for duplicate username', () => {
      mockFindByUsername.mockReturnValue(otherUser)

      expect(() => userService.updateUser(1, { username: 'bob' })).toThrow(ValidationError)
      expect(() => userService.updateUser(1, { username: 'bob' })).toThrow('Username already exists')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('throws ValidationError for duplicate email', () => {
      mockFindByEmail.mockReturnValue(otherUser)

      expect(() => userService.updateUser(1, { email: 'bob@test.com' })).toThrow(ValidationError)
      expect(() => userService.updateUser(1, { email: 'bob@test.com' })).toThrow('Email already exists')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('allows same username (unchanged) — no false error', () => {
      const updated = { ...existingUser, full_name: 'Alice Updated' }
      mockUpdate.mockReturnValue(updated)

      const result = userService.updateUser(1, { username: 'alice', full_name: 'Alice Updated' })

      expect(result).toEqual(updated)
      expect(mockFindByUsername).not.toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalledWith(1, { username: 'alice', full_name: 'Alice Updated' })
    })

    it('allows partial update (only phone changes)', () => {
      const updated = { ...existingUser, phone: '555-9999' }
      mockUpdate.mockReturnValue(updated)

      const result = userService.updateUser(1, { phone: '555-9999' })

      expect(result).toEqual(updated)
      expect(mockUpdate).toHaveBeenCalledWith(1, { phone: '555-9999' })
    })
  })

  describe('deleteUser', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('deletes user successfully', () => {
      mockFindById.mockReturnValue({ id: 1, username: 'alice' })
      mockRemove.mockReturnValue(true)

      const result = userService.deleteUser(1)

      expect(result).toBe(true)
      expect(mockRemove).toHaveBeenCalledWith(1)
    })

    it('throws NotFoundError for missing user', () => {
      mockFindById.mockReturnValue(undefined)

      expect(() => userService.deleteUser(99)).toThrow(NotFoundError)
      expect(() => userService.deleteUser(99)).toThrow('User not found')
      expect(mockRemove).not.toHaveBeenCalled()
    })
  })
})
