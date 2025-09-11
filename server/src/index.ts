import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { migrate } from './db'
import { products } from './routes/products'

const app = express()
const PORT = Number(process.env.PORT || 4000)
const ORIGIN = process.env.CORS_ORIGIN || '*'

app.use(cors({ origin: ORIGIN }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/products', products)

void (async () => {
  await migrate()
  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`))
})()


