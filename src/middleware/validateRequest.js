import { ValidationError } from './errorHandler.js'

function validateRequest(rules) {
  return (req, res, next) => {
    const body = req.body ?? {}

    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field]

      const isEmpty = value === undefined || value === null || value === ''

      if (rule.required && isEmpty) {
        throw new ValidationError(rule.errorMessage || `${field} is required`)
      }

      if (isEmpty) continue

      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        throw new ValidationError(rule.errorMessage || `${field} format is invalid`)
      }

      if (rule.maxLength != null && String(value).length > rule.maxLength) {
        throw new ValidationError(rule.errorMessage || `${field} exceeds maximum length of ${rule.maxLength}`)
      }
    }

    next()
  }
}

export { validateRequest }
