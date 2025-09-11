import React from 'react'
import type { ItemCategory } from '@/types'
import { usePantryStore } from '@/stores/pantry.store'
import { Calendar } from 'lucide-react'

interface CategoryItemsProps {
  category: ItemCategory
  onBack: () => void
}

const CategoryItems: React.FC<CategoryItemsProps> = ({ category, onBack }) => {
  const { items } = usePantryStore()
  const list = React.useMemo(() => items.filter(i => i.category === category), [items, category])

  return (
    <div className="w-full">
      <div className="px-4 py-4 border-b border-neutral-200 bg-white flex items-center justify-between">
        <button onClick={onBack} className="text-primary-600 hover:text-primary-700">Back</button>
        <h2 className="text-lg font-semibold text-neutral-900">{category}</h2>
        <div className="w-12" />
      </div>

      <ul className="divide-y divide-neutral-200 bg-white">
        {list.length === 0 && (
          <li className="px-4 py-4 text-neutral-500">No items in this category.</li>
        )}
        {list.map(item => (
          <li key={item.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-neutral-900 font-medium">{item.name}</div>
              <div className="text-neutral-600 text-sm">{item.quantity}</div>
            </div>
            <div className="flex items-center space-x-2 text-neutral-500 text-xs mt-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(item.purchaseDate).toLocaleDateString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CategoryItems


