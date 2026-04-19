import express from 'express'
import { errorHandler } from './middleware/errorHandler.js'
import userRoutes from './routes/userRoutes.js'

const app = express()

app.use(express.json({ limit: '1mb' }))
app.use(express.static('public'))

app.use('/api/users', userRoutes)

app.use(errorHandler)

export default app
