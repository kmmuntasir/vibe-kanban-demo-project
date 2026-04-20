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

export const updateUser = (req, res, next) => {
  const { id } = req.params
  const user = userService.updateUser(id, req.body)
  res.json({ data: user })
}

export const deleteUser = (req, res, next) => {
  const { id } = req.params
  userService.deleteUser(id)
  res.status(204).send()
}
