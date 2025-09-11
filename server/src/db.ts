import 'dotenv/config'
import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL || ''
if (!DATABASE_URL) {
  console.warn('[server] DATABASE_URL missing; set it for Neon/Render deployment')
}

export const pool = new Pool({ connectionString: DATABASE_URL, max: 5 })

export async function migrate(): Promise<void> {
  await pool.query(`
    create table if not exists products (
      id text primary key,
      name text not null,
      brand text,
      category text not null,
      quantity integer not null default 1,
      unit text not null,
      barcode text unique,
      purchase_date timestamptz not null default now(),
      last_modified timestamptz not null default now(),
      notes text
    );
    create index if not exists idx_products_barcode on products(barcode);
  `)
}


