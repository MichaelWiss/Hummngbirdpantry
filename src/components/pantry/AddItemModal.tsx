/**
 * AddItemModal - Clean implementation
 * Following style.md: single responsibility, clean error handling
 * Following requirements.md: Neon-first with immediate error surfacing
 */

import React, { useState, useEffect } from 'react'
import { X, Scan, Plus } from 'lucide-react'
import { usePantryActions } from '@/hooks/usePantryActions'
import { apiService } from '@/services/api.service'
import { lookupProductByBarcode } from '@/services/productLookup'
import type { ItemCategory, MeasurementUnit, Barcode } from '@/types'

interface AddItemModalProps {
  onClose: () => void
  onOpenScanner?: () => void
  initialData?: Partial<{
    name: string
    category: ItemCategory
    quantity: number
    unit: MeasurementUnit
    barcode: Barcode | ''
    notes: string
  }>
}

interface FormData {
  name: string
  category: ItemCategory
  quantity: number
  unit: MeasurementUnit
  barcode: string
  notes: string
}

type AutofillStatus = 'none' | 'loading' | 'found' | 'not-found'

const CATEGORIES: ItemCategory[] = ['dairy', 'meat', 'produce', 'bakery', 'pantry', 'frozen', 'beverages', 'snacks', 'spices', 'condiments', 'canned', 'other']
const UNITS: MeasurementUnit[] = ['pieces', 'lbs', 'kg', 'oz', 'g', 'cups', 'tbsp', 'tsp', 'ml', 'l', 'cans', 'bottles', 'packages']

export const AddItemModal = React.memo<AddItemModalProps>(({ 
  onClose, 
  onOpenScanner, 
  initialData = {} 
}) => {
  const { create } = usePantryActions()
  
  const [formData, setFormData] = useState<FormData>({
    name: initialData.name || '',
    category: initialData.category || 'other',
    quantity: initialData.quantity || 1,
    unit: initialData.unit || 'pieces',
    barcode: initialData.barcode || '',
    notes: initialData.notes || ''
  })
  
  const [autofillStatus, setAutofillStatus] = useState<AutofillStatus>('none')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-populate form when initialData changes
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        name: initialData.name || prev.name,
        category: initialData.category || prev.category,
        quantity: initialData.quantity || prev.quantity,
        unit: initialData.unit || prev.unit,
        barcode: initialData.barcode || prev.barcode,
        notes: initialData.notes || prev.notes
      }))
      
      // Trigger autofill if we have a barcode
      if (initialData.barcode) {
        tryAutofillFromBarcode(initialData.barcode)
      }
    }
  }, [initialData])

  // Simple autofill: Server first, then external lookup
  const tryAutofillFromBarcode = async (barcode: string) => {
    if (!barcode.trim()) return
    
    setAutofillStatus('loading')
    setError(null)

    try {
      // Try server first
      const serverResult = await apiService.getItemByBarcode(barcode as Barcode)
      
      if (serverResult.data) {
        setFormData(prev => ({
          ...prev,
          name: serverResult.data!.name,
          category: serverResult.data!.category,
          unit: serverResult.data!.unit || 'pieces',
          notes: serverResult.data!.brand ? `Brand: ${serverResult.data!.brand}` : prev.notes
        }))
        setAutofillStatus('found')
        return
      }

      // Try external lookup if not found on server
      const lookupResult = await lookupProductByBarcode(barcode as Barcode)
      
      if (lookupResult) {
        setFormData(prev => ({
          ...prev,
          name: lookupResult.name,
          category: lookupResult.category,
          notes: lookupResult.brand ? `Brand: ${lookupResult.brand}` : prev.notes
        }))
        setAutofillStatus('found')
      } else {
        setAutofillStatus('not-found')
      }
      
    } catch (err) {
      setError('Failed to lookup product information')
      setAutofillStatus('not-found')
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleBarcodeChange = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }))
    
    // Trigger autofill after short delay to avoid excessive API calls
    if (barcode.trim()) {
      const timeoutId = setTimeout(() => {
        tryAutofillFromBarcode(barcode)
      }, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setAutofillStatus('none')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Product name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const itemData: {
        name: string
        category: ItemCategory
        quantity: number
        unit: MeasurementUnit
        barcode?: string
        notes?: string
      } = {
        name: formData.name.trim(),
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit
      }

      if (formData.barcode.trim()) {
        itemData.barcode = formData.barcode.trim()
      }
      
      if (formData.notes.trim()) {
        itemData.notes = formData.notes.trim()
      }

      await create(itemData)
      
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAutofillStatusDisplay = () => {
    switch (autofillStatus) {
      case 'loading': return '🔄 Looking up product...'
      case 'found': return '✅ Product information found'
      case 'not-found': return '❌ Product not found'
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Item</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Barcode Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Barcode (Optional)
              </label>
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                  disabled={isSubmitting}
                >
                  <Scan size={16} />
                  Scan
                </button>
              )}
            </div>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => handleBarcodeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter barcode or scan"
              disabled={isSubmitting}
            />
            
            {/* Autofill Status */}
            {getAutofillStatusDisplay() && (
              <p className="text-xs text-gray-600">{getAutofillStatusDisplay()}</p>
            )}
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter product name"
              required
              disabled={isSubmitting}
              autoComplete="name"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              autoComplete="category"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional notes..."
              disabled={isSubmitting}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

// Add display name for debugging
AddItemModal.displayName = 'AddItemModal'