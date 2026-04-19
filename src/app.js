import express from 'express'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(express.json({ limit: '1mb' }))
app.use(express.static('public'))

// Routes will be mounted here

app.use(errorHandler)

export default app
