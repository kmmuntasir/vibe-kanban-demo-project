import { jest } from '@jest/globals'
import { validateRequest } from './validateRequest.js'
import { ValidationError } from './errorHandler.js'

const rules = {
  username: {
    required: true,
    pattern: '^[a-zA-Z0-9_]+$',
    errorMessage: 'username is required',
  },
  full_name: {
    required: true,
    errorMessage: 'full_name is required',
  },
  email: {
    required: true,
    pattern: '^[^@]+@[^@]+\\.[^@]+$',
    errorMessage: 'email is required',
  },
  phone: {
    required: false,
  },
}

const validPayload = {
  username: 'jdoe',
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0123',
}

describe('validateRequest', () => {
  let mockReq
  let mockRes
  let mockNext

  beforeEach(() => {
    mockNext = jest.fn()
    mockRes = {}
  })

  function invoke(body) {
    mockReq = { body }
    return validateRequest(rules)(mockReq, mockRes, mockNext)
  }

  it('calls next() for valid complete payload', () => {
    invoke(validPayload)
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('calls next() when phone omitted (optional)', () => {
    const { phone, ...noPhone } = validPayload
    invoke(noPhone)
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('calls next() for valid alphanumeric+underscore username', () => {
    invoke({ ...validPayload, username: 'user_name_123' })
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('throws ValidationError when username missing', () => {
    const { username, ...rest } = validPayload
    expect(() => invoke(rest)).toThrow(ValidationError)
  })

  it('throws ValidationError when username empty string', () => {
    expect(() => invoke({ ...validPayload, username: '' })).toThrow(ValidationError)
  })

  it('throws ValidationError when username has spaces', () => {
    expect(() => invoke({ ...validPayload, username: 'john doe' })).toThrow(ValidationError)
  })

  it('throws ValidationError when username has special chars', () => {
    expect(() => invoke({ ...validPayload, username: 'john$doe' })).toThrow(ValidationError)
  })

  it('throws ValidationError when full_name missing', () => {
    const { full_name, ...rest } = validPayload
    expect(() => invoke(rest)).toThrow(ValidationError)
  })

  it('throws ValidationError when full_name empty string', () => {
    expect(() => invoke({ ...validPayload, full_name: '' })).toThrow(ValidationError)
  })

  it('throws ValidationError when email missing', () => {
    const { email, ...rest } = validPayload
    expect(() => invoke(rest)).toThrow(ValidationError)
  })

  it('throws ValidationError when email has no @', () => {
    expect(() => invoke({ ...validPayload, email: 'invalidemail' })).toThrow(ValidationError)
  })

  it('throws ValidationError when email has no domain', () => {
    expect(() => invoke({ ...validPayload, email: 'user@' })).toThrow(ValidationError)
  })

  it('throws ValidationError when email has no local part', () => {
    expect(() => invoke({ ...validPayload, email: '@example.com' })).toThrow(ValidationError)
  })

  it('throws ValidationError for empty body {}', () => {
    expect(() => invoke({})).toThrow(ValidationError)
  })

  it('throws ValidationError when value exceeds maxLength', () => {
    const rulesWithLength = {
      ...rules,
      username: { ...rules.username, maxLength: 3 },
    }
    mockReq = { body: validPayload }
    expect(() => validateRequest(rulesWithLength)(mockReq, mockRes, mockNext)).toThrow(ValidationError)
  })

  it('error message identifies failed fields', () => {
    try {
      invoke({})
    } catch (err) {
      expect(err.message).toContain('username')
    }
  })
})
