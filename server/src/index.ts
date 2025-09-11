import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { migrate } from './db.js'
import { products } from './routes/products.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)
const rawOrigin = process.env.CORS_ORIGIN || '*'
const origin =
  rawOrigin === '*'
    ? '*'
    : rawOrigin
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

app.use(cors({ origin }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/products', products)

void (async () => {
  await migrate()
  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`))
})()


