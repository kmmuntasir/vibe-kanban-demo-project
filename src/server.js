import app from './app.js'
import { initDatabase } from './database/init.js'

const PORT = process.env.PORT || 3000

try {
  initDatabase()
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
} catch (err) {
  console.error('Failed to initialize database:', err.message)
  process.exit(1)
}
