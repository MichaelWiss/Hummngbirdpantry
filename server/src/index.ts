import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { migrate, pool } from './db.js'
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

app.use(cors({ origin, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'], credentials: false }))
app.options('*', cors({ origin, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'], credentials: false }))
app.use(express.json())

app.get('/', (_req, res) =>
  res.json({
    name: 'HummingbirdPantry API',
    status: 'ok',
    endpoints: {
      health: '/health',
      products: '/api/products'
    }
  })
)

app.get('/health', async (_req, res) => {
  try {
    const r = await pool.query('select 1')
    res.json({ ok: true, dbOk: r.rowCount === 1 })
  } catch (err: any) {
    console.error('[server] health db check failed:', err?.message || err)
    res.json({ ok: true, dbOk: false })
  }
})
app.use('/api/products', products)

void (async () => {
  await migrate()
  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`))
})()


