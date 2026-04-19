class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = this.constructor.name
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400)
  }
}

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500
  const response = { error: err.message || 'Internal server error' }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}

export { AppError, NotFoundError, ValidationError, errorHandler }
