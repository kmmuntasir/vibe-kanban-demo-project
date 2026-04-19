import { validateRequest } from './validateRequest.js'
import { ValidationError } from './errorHandler.js'

const RULES = {
  username: { required: true, errorMessage: 'Username is required' },
  email: {
    required: true,
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    errorMessage: 'Invalid email format',
  },
  bio: { required: false, maxLength: 200, errorMessage: 'Bio too long' },
}

function createMock(res, next) {
  const _res = {}
  let _error = null
  const _next = (err) => { _error = err }
  return { res: _res, next: _next, getError: () => _error }
}

describe('validateRequest', () => {
  it('exports validateRequest function', () => {
    expect(typeof validateRequest).toBe('function')
  })

  it('throws ValidationError for missing required field', () => {
    const middleware = validateRequest(RULES)
    const { next, getError } = createMock()
    const req = { body: { email: 'test@test.com' } }

    middleware(req, {}, next)

    expect(getError()).toBeInstanceOf(ValidationError)
    expect(getError().message).toBe('Username is required')
    expect(getError().statusCode).toBe(400)
  })

  it('throws ValidationError for invalid pattern', () => {
    const middleware = validateRequest(RULES)
    const { next, getError } = createMock()
    const req = { body: { username: 'test', email: 'not-an-email' } }

    middleware(req, {}, next)

    expect(getError()).toBeInstanceOf(ValidationError)
    expect(getError().message).toBe('Invalid email format')
  })

  it('throws ValidationError when value exceeds maxLength', () => {
    const middleware = validateRequest(RULES)
    const { next, getError } = createMock()
    const req = { body: { username: 'test', email: 'test@test.com', bio: 'x'.repeat(201) } }

    middleware(req, {}, next)

    expect(getError()).toBeInstanceOf(ValidationError)
    expect(getError().message).toBe('Bio too long')
  })

  it('passes for optional empty field', () => {
    const middleware = validateRequest(RULES)
    const { next, getError } = createMock()
    const req = { body: { username: 'test', email: 'test@test.com' } }

    middleware(req, {}, next)

    expect(getError()).toBeNull()
    expect(next).toHaveBeenCalled()
  })

  it('calls next() when all fields are valid', () => {
    const middleware = validateRequest(RULES)
    const { next, getError } = createMock()
    const req = { body: { username: 'test', email: 'test@test.com', bio: 'short bio' } }

    middleware(req, {}, next)

    expect(getError()).toBeNull()
    expect(next).toHaveBeenCalledWith()
  })

  it('handles undefined req.body gracefully', () => {
    const middleware = validateRequest(RULES)
    const { next, getError } = createMock()
    const req = {}

    middleware(req, {}, next)

    expect(getError()).toBeInstanceOf(ValidationError)
    expect(getError().message).toBe('Username is required')
  })

  it('skips optional field with null value', () => {
    const middleware = validateRequest(RULES)
    const { next, getError } = createMock()
    const req = { body: { username: 'test', email: 'test@test.com', bio: null } }

    middleware(req, {}, next)

    expect(getError()).toBeNull()
  })

  it('uses default error message when errorMessage not provided', () => {
    const rules = { name: { required: true } }
    const middleware = validateRequest(rules)
    const { next, getError } = createMock()
    const req = { body: {} }

    middleware(req, {}, next)

    expect(getError()).toBeInstanceOf(ValidationError)
    expect(getError().message).toBe('name is required')
  })
})
