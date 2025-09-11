// AddItemModal Component - Enhanced with barcode scanning integration
// Provides comprehensive item addition with manual entry and barcode scanning

import React, { useState } from 'react'
import { X, Scan, Plus, AlertCircle, CheckCircle } from 'lucide-react'
// import { usePantry } from '@/hooks/usePantry'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
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

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onOpenScanner, initialData }) => {
  // const { addItem } = usePantry()
  const barcodeScanner = useBarcodeScanner()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || ('pantry' as ItemCategory),
    quantity: initialData?.quantity ?? 1,
    unit: initialData?.unit || ('pieces' as MeasurementUnit),
    barcode: (initialData?.barcode as Barcode | '') || ('' as Barcode | ''),
    notes: initialData?.notes || ''
  })

  React.useEffect(() => {
    if (!initialData) return
    setFormData(prev => ({
      ...prev,
      name: initialData.name ?? prev.name,
      category: initialData.category ?? prev.category,
      quantity: initialData.quantity ?? prev.quantity,
      unit: initialData.unit ?? prev.unit,
      barcode: (initialData.barcode as Barcode | '') ?? prev.barcode,
      notes: initialData.notes ?? prev.notes
    }))
  }, [initialData])

  // Barcode handling is centralized; this modal requests scanner via onOpenScanner

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Please enter an item name')
      return
    }

    setIsSubmitting(true)

    try {
      const { ProductRepository } = await import('@/services/ProductRepository')
      await ProductRepository.upsert({
        name: formData.name.trim(),
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        barcode: formData.barcode || undefined,
        notes: formData.notes.trim() || undefined,
        purchaseDate: new Date(),
        status: 'fresh',
        tags: []
      } as any)

      console.log('✅ Item added successfully:', formData.name)
      onClose()
    } catch (error) {
      console.error('❌ Failed to add item:', error)
      alert('Failed to add item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Scanner modal is centralized at App level. This modal requests it via onOpenScanner.

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary-600" />
              <h3 className="text-xl font-bold text-neutral-900">Add Pantry Item</h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 text-2xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Success message for scanned products */}
          {barcodeScanner.lookupResult?.found && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Product Found!</span>
              </div>
              <p className="text-green-700 text-sm">
                &quot;{barcodeScanner.lookupResult.productData?.name}&quot; has been auto-filled below.
                Review and adjust the details as needed.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                placeholder="e.g., Organic Milk"
              />
            </div>

            {/* Barcode Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Barcode (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenScanner && onOpenScanner() }}
                  className="flex items-center space-x-2 bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  <Scan size={16} />
                  <span>Scan</span>
                </button>
              </div>

              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="Enter barcode manually or scan"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />

              {barcodeScanner.error && (
                <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{barcodeScanner.error}</span>
                </div>
              )}

              {formData.barcode && (
                <div className="mt-2 text-xs text-neutral-500">
                  Format: {barcodeScanner.getBarcodeInfo(formData.barcode as Barcode)?.format || 'Unknown'}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as ItemCategory)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="produce">Produce</option>
                <option value="bakery">Bakery</option>
                <option value="pantry">Pantry</option>
                <option value="frozen">Frozen</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="spices">Spices</option>
                <option value="condiments">Condiments</option>
                <option value="canned">Canned</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value as MeasurementUnit)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value="pieces">Pieces</option>
                  <option value="lbs">Pounds</option>
                  <option value="kg">Kilograms</option>
                  <option value="oz">Ounces</option>
                  <option value="g">Grams</option>
                  <option value="cups">Cups</option>
                  <option value="tbsp">Tablespoons</option>
                  <option value="tsp">Teaspoons</option>
                  <option value="ml">Milliliters</option>
                  <option value="l">Liters</option>
                  <option value="cans">Cans</option>
                  <option value="bottles">Bottles</option>
                  <option value="packages">Packages</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                placeholder="Any additional notes about this item..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2 rounded-lg font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Item'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddItemModal
