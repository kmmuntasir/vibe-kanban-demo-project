import { Router } from 'express'
import { createUser, getAllUsers, updateUser, deleteUser } from '../controllers/userController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { VALIDATION_RULES, UPDATE_VALIDATION_RULES } from '../models/userModel.js'

const router = Router()

router.post('/', validateRequest(VALIDATION_RULES), createUser)
router.get('/', getAllUsers)
router.put('/:id', validateRequest(UPDATE_VALIDATION_RULES), updateUser)
router.delete('/:id', deleteUser)

export default router
