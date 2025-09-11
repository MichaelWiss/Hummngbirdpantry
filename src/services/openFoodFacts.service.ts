import type { Barcode, PantryItem, ItemCategory } from '@/types'

type OFFResponse = {
  status: number
  product?: {
    product_name?: string
    brands?: string
    categories?: string
    image_url?: string
    nutriments?: Record<string, unknown>
  }
}

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2'

const mapCategory = (offCategories?: string): ItemCategory => {
  const s = (offCategories || '').toLowerCase()
  if (s.includes('dairy')) return 'dairy'
  if (s.includes('meat')) return 'meat'
  if (s.includes('vegetable') || s.includes('fruit') || s.includes('produce')) return 'produce'
  if (s.includes('bakery') || s.includes('bread')) return 'bakery'
  if (s.includes('frozen')) return 'frozen'
  if (s.includes('beverage') || s.includes('drink')) return 'beverages'
  if (s.includes('snack')) return 'snacks'
  if (s.includes('spice')) return 'spices'
  if (s.includes('condiment') || s.includes('sauce')) return 'condiments'
  if (s.includes('canned') || s.includes('tin')) return 'canned'
  return 'pantry'
}

export const fetchProductByBarcode = async (barcode: Barcode): Promise<{ found: boolean; data: Partial<PantryItem> | null }> => {
  const url = `${OFF_BASE}/product/${barcode}.json?fields=product_name,brands,categories,image_url,nutriments`
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) return { found: false, data: null }
    const json = (await res.json()) as OFFResponse
    const p = json.product
    if (!p) return { found: false, data: null }
    const name = (p.product_name || '').trim()
    const brand = (p.brands || '').split(',')[0]?.trim()
    const category = mapCategory(p.categories)
    return {
      found: true,
      data: {
        name: name || 'Unknown Product',
        brand,
        category
      }
    }
  } catch {
    return { found: false, data: null }
  }
}


