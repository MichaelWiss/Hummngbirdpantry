import { Router } from 'express'
import { pool } from '../db.js'
import { z } from 'zod'

export const products = Router()

const upsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().min(1),
  quantity: z.coerce.number().int().min(0).default(1),
  unit: z.string().min(1),
  barcode: z.string().optional(),
  notes: z.string().optional()
})

products.get('/', async (_req, res) => {
  try {
    const r = await pool.query('select * from products order by last_modified desc limit 200')
    res.json(r.rows)
  } catch (err: any) {
    console.error('GET /api/products failed:', err?.message || err)
    res.status(500).json({ error: 'server_error' })
  }
})

products.get('/:barcode', async (req, res) => {
  try {
    const r = await pool.query('select * from products where barcode = $1', [req.params.barcode])
    if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' })
    res.json(r.rows[0])
  } catch (err: any) {
    console.error('GET /api/products/:barcode failed:', err?.message || err)
    res.status(500).json({ error: 'server_error' })
  }
})

products.post('/', async (req, res) => {
  try {
    const body = upsertSchema.parse(req.body)
    const now = new Date().toISOString()

    // Upsert by barcode (if present) else by id
    if (body.barcode) {
      const existing = await pool.query('select * from products where barcode = $1', [body.barcode])
      if (existing.rowCount) {
        const q = await pool.query(
          'update products set quantity = quantity + $1, last_modified = $2 where barcode = $3 returning *',
          [body.quantity ?? 1, now, body.barcode]
        )
        return res.json(q.rows[0])
      }
    }

    const id = body.id || crypto.randomUUID()
    const q = await pool.query(
      'insert into products (id, name, brand, category, quantity, unit, barcode, purchase_date, last_modified, notes) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *',
      [id, body.name, body.brand ?? null, body.category, body.quantity ?? 1, body.unit, body.barcode ?? null, now, now, body.notes ?? null]
    )
    res.status(201).json(q.rows[0])
  } catch (err: any) {
    const message = err?.message || 'bad_request'
    console.error('POST /api/products failed:', message)
    res.status(400).json({ error: 'bad_request', message })
  }
})

products.patch('/:barcode/increment', async (req, res) => {
  try {
    const by = z.coerce.number().int().parse(req.body?.by ?? 1)
    const now = new Date().toISOString()
    const q = await pool.query('update products set quantity = quantity + $1, last_modified = $2 where barcode = $3 returning *', [by, now, req.params.barcode])
    if (q.rowCount === 0) return res.status(404).json({ error: 'not_found' })
    res.json(q.rows[0])
  } catch (err: any) {
    const message = err?.message || 'bad_request'
    console.error('PATCH /api/products/:barcode/increment failed:', message)
    res.status(400).json({ error: 'bad_request', message })
  }
})

products.put('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const body = upsertSchema.partial().parse(req.body)
    const now = new Date().toISOString()
    const q = await pool.query(
      `update products set
        name = coalesce($1, name),
        brand = coalesce($2, brand),
        category = coalesce($3, category),
        quantity = coalesce($4, quantity),
        unit = coalesce($5, unit),
        barcode = coalesce($6, barcode),
        notes = coalesce($7, notes),
        last_modified = $8
       where id = $9 returning *`,
      [body.name ?? null, body.brand ?? null, body.category ?? null, body.quantity ?? null, body.unit ?? null, body.barcode ?? null, body.notes ?? null, now, id]
    )
    if (q.rowCount === 0) return res.status(404).json({ error: 'not_found' })
    res.json(q.rows[0])
  } catch (err: any) {
    const message = err?.message || 'bad_request'
    console.error('PUT /api/products/:id failed:', message)
    res.status(400).json({ error: 'bad_request', message })
  }
})

products.delete('/:id', async (req, res) => {
  try {
    const q = await pool.query('delete from products where id = $1', [req.params.id])
    res.json({ deleted: q.rowCount })
  } catch (err: any) {
    console.error('DELETE /api/products/:id failed:', err?.message || err)
    res.status(500).json({ error: 'server_error' })
  }
})


