import { userRepository } from '../repositories/userRepository.js'
import { ValidationError } from '../middleware/errorHandler.js'

export const userService = {
  createUser(userData) {
    if (userRepository.findByUsername(userData.username)) {
      throw new ValidationError('Username already exists')
    }

    if (userRepository.findByEmail(userData.email)) {
      throw new ValidationError('Email already exists')
    }

    return userRepository.insertUser(userData)
  },

  getAllUsers() {
    // Stub — implemented in Batch 4
    return userRepository.findAll()
  },
}
