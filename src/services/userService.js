import { userRepository } from '../repositories/userRepository.js'
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js'

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
    return userRepository.findAll()
  },

  updateUser(id, userData) {
    const user = userRepository.findById(id)
    if (!user) throw new NotFoundError('User')

    if (userData.username && userData.username !== user.username) {
      if (userRepository.findByUsername(userData.username)) {
        throw new ValidationError('Username already exists')
      }
    }

    if (userData.email && userData.email !== user.email) {
      if (userRepository.findByEmail(userData.email)) {
        throw new ValidationError('Email already exists')
      }
    }

    return userRepository.update(id, userData)
  },

  deleteUser(id) {
    const user = userRepository.findById(id)
    if (!user) throw new NotFoundError('User')

    return userRepository.remove(id)
  },
}
