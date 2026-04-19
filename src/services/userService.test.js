import { jest, describe, it, expect, beforeEach } from '@jest/globals'

const mockInsertUser = jest.fn()
const mockFindByUsername = jest.fn()
const mockFindByEmail = jest.fn()
const mockFindAll = jest.fn()

jest.unstable_mockModule('../repositories/userRepository.js', () => ({
  userRepository: {
    insertUser: mockInsertUser,
    findByUsername: mockFindByUsername,
    findByEmail: mockFindByEmail,
    findAll: mockFindAll,
  },
}))

const { userRepository } = await import('../repositories/userRepository.js')
const { userService } = await import('./userService.js')
const { ValidationError } = await import('../middleware/errorHandler.js')

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
})
