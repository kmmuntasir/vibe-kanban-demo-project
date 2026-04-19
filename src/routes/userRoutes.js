import { Router } from 'express'
import { createUser } from '../controllers/userController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { VALIDATION_RULES } from '../models/userModel.js'

const router = Router()

router.post('/', validateRequest(VALIDATION_RULES), createUser)

export default router
