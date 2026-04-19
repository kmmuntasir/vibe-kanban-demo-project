import { userService } from '../services/userService.js'

export const createUser = (req, res, next) => {
  const { username, full_name, email, phone } = req.body
  const user = userService.createUser({ username, full_name, email, phone })
  res.status(201).json({ data: user })
}

export const getAllUsers = (req, res, next) => {
  const users = userService.getAllUsers()
  res.json(users)
}
