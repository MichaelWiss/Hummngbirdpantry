// AddItemModal Component - Enhanced with barcode scanning integration
// Provides comprehensive item addition with manual entry and barcode scanning

import React, { useState } from 'react'
import { X, Scan, Plus, CheckCircle } from 'lucide-react'
import { usePantryActions } from '@/hooks/usePantryActions'
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
  const { create } = usePantryActions()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autofillStatus, setAutofillStatus] = useState<'none' | 'loading' | 'found' | 'not-found'>('none')

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
    console.log('🔄 AddItemModal: Updating form with initialData:', initialData)
    setFormData(prev => {
      const newData = {
        ...prev,
        name: initialData.name ?? prev.name,
        category: initialData.category ?? prev.category,
        quantity: initialData.quantity ?? prev.quantity,
        unit: initialData.unit ?? prev.unit,
        barcode: (initialData.barcode as Barcode | '') ?? prev.barcode,
        notes: initialData.notes ?? prev.notes
      }
      console.log('🔄 AddItemModal: New form data:', newData)
      return newData
    })
    setAutofillStatus(initialData.name ? 'found' : 'none')
  }, [initialData])

  // Enhanced autofill: Try NeonDB first, then local storage for barcode lookups
  const tryAutofillFromBarcode = React.useCallback(async (barcode: string) => {
    if (!barcode.trim()) return
    
    setAutofillStatus('loading')
    try {
      const { ProductRepository } = await import('@/services/ProductRepository')
      // Try NeonDB first (via server)
      const existingItem = await ProductRepository.getByBarcode(barcode as Barcode)
      
      if (existingItem) {
        console.log('✅ Found existing item in NeonDB:', existingItem.name)
        setFormData(prev => ({
          ...prev,
          name: existingItem.name,
          category: existingItem.category,
          unit: existingItem.unit,
          ...(existingItem.brand ? { notes: `Brand: ${existingItem.brand}` } : {}),
          quantity: 1 // Always default to 1 for new additions
        }))
        setAutofillStatus('found')
      } else {
        console.log('ℹ️ Item not found in NeonDB, checking product lookup')
        // Fall back to external product lookup
        try {
          const { lookupProductByBarcode } = await import('@/services/productLookup')
          const productData = await lookupProductByBarcode(barcode as Barcode)
          
          if (productData) {
            console.log('✅ Found product via lookup:', productData.name)
            setFormData(prev => ({
              ...prev,
              name: productData.name,
              category: productData.category,
              unit: 'pieces' as MeasurementUnit,
              ...(productData.brand ? { notes: `Brand: ${productData.brand}` } : {}),
              quantity: 1
            }))
            setAutofillStatus('found')
          } else {
            setAutofillStatus('not-found')
          }
        } catch (lookupError) {
          console.warn('Product lookup failed:', lookupError)
          setAutofillStatus('not-found')
        }
      }
    } catch (error) {
      console.error('Autofill failed:', error)
      setAutofillStatus('not-found')
    }
  }, [])

  // Trigger autofill when barcode changes
  React.useEffect(() => {
    if (formData.barcode && !initialData?.name) {
      // Only autofill if we don't already have initial data and barcode is present
      tryAutofillFromBarcode(formData.barcode)
    }
  }, [formData.barcode, tryAutofillFromBarcode, initialData?.name])

  // Barcode handling is centralized; this modal requests scanner via onOpenScanner

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Please enter an item name')
      return
    }

    setIsSubmitting(true)

    try {
      await create({
        name: formData.name.trim(),
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        ...(formData.barcode ? { barcode: formData.barcode } : {}),
        ...(formData.notes.trim() ? { notes: formData.notes.trim() } : {})
      })

      console.log('✅ Item added successfully:', formData.name)
      onClose()
    } catch (error: any) {
      console.error('❌ Failed to add item:', error)
      // Enhanced error messages that don't prevent saving
      const errorMessage = error?.message || 'Failed to add item'
      if (errorMessage.includes('saved locally')) {
        // This is actually a success with a warning
        alert(`Item saved! ${errorMessage}`)
        onClose() // Still close the modal
      } else {
        alert(`Error: ${errorMessage}. Please try again.`)
      }
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

          {/* Enhanced success message for autofilled products */}
          {autofillStatus === 'found' && formData.name && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Product Found!</span>
              </div>
              <p className="text-green-700 text-sm">
                &quot;{formData.name}&quot; has been auto-filled from {initialData?.name ? 'your scan' : 'NeonDB'}.
                Review and adjust the details as needed.
              </p>
            </div>
          )}
          
          {autofillStatus === 'loading' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                🔍 Looking up product details...
              </p>
            </div>
          )}
          
          {autofillStatus === 'not-found' && formData.barcode && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-700 text-sm">
                ⚠️ Product not found in database. Please fill in the details manually.
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
                <div className="flex space-x-2">
                  {formData.barcode && (
                    <button
                      type="button"
                      onClick={() => tryAutofillFromBarcode(formData.barcode)}
                      disabled={autofillStatus === 'loading'}
                      className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <span>🔍</span>
                      <span>{autofillStatus === 'loading' ? 'Looking up...' : 'Lookup'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenScanner && onOpenScanner() }}
                    className="flex items-center space-x-2 bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Scan size={16} />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => {
                  handleInputChange('barcode', e.target.value)
                  if (!e.target.value) setAutofillStatus('none')
                }}
                placeholder="Enter barcode manually or scan"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              />

              {formData.barcode && (
                <div className="mt-2 text-xs text-neutral-500">
                  Barcode: {formData.barcode}
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
                  min="1"
                  step="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', Math.max(1, Math.floor(Number(e.target.value) || 1)))}
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
