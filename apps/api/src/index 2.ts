import 'express-async-errors'
import app from './app.js'

const PORT = process.env.PORT ?? '4000'

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`)
  console.log(`[API] Environment: ${process.env.NODE_ENV ?? 'development'}`)
})
