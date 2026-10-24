import 'dotenv/config'
import 'express-async-errors'
import app from './app.js'

const PORT = process.env['PORT'] ?? '4200'

app.listen(PORT, () => {
  console.log(`[KEGIATAN-API] Server running on http://localhost:${PORT}`)
  console.log(`[KEGIATAN-API] Environment: ${process.env['NODE_ENV'] ?? 'development'}`)
})
