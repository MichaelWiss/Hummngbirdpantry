import React from 'react'
import type { ItemCategory } from '@/types'
import { usePantryStore } from '@/stores/pantry.store'

interface CategoryListProps {
  onSelect: (category: ItemCategory) => void
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const CategoryList: React.FC<CategoryListProps> = ({ onSelect }) => {
  const { items } = usePantryStore()

  const counts = React.useMemo(() => {
    const map = new Map<ItemCategory, number>()
    items.forEach(i => {
      const cat = i.category as ItemCategory
      const qty = typeof i.quantity === 'number' ? i.quantity : 0
      map.set(cat, (map.get(cat) || 0) + qty)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  return (
    <div className="w-full">
      <div className="px-4 py-4 border-b border-neutral-200 bg-white">
        <h2 className="text-lg font-semibold text-neutral-900">Category List</h2>
      </div>

      <ul className="divide-y divide-neutral-200 bg-white">
        {counts.length === 0 && (
          <li className="px-4 py-4 text-neutral-500">No items yet.</li>
        )}
        {counts.map(([category, count]) => (
          <li key={category} className="px-4 py-4 flex items-center justify-between hover:bg-neutral-50" onClick={() => onSelect(category)}>
            <span className="text-neutral-900">{titleCase(category)}</span>
            <span className="text-neutral-500">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CategoryList


