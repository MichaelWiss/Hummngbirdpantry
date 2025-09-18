# HummingbirdPantry - Integration Todos

## Special Section: Receipt & Expiration Integration Guide

This section contains the preliminary integration guide for adding the
Expiration Date Estimation Agent and Receipt Interpreter Agent to
HummingbirdPantry. It includes migration SQL, server/service code,
frontend snippets, hooks, environment variables and rollout steps.

---

## Phase 1: Backend Foundation (Express + NeonDB)

### Migration: create shelf_life_data and receipt_scans, helper trigger

Filename suggestion: `migrations/2025-09-17__create_shelf_life_and_receipt_scans.sql`

```sql
BEGIN;

-- Use timestamptz for created_at/updated_at
-- Create storage location enum for stronger constraints (optional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'storage_location_enum') THEN
    CREATE TYPE storage_location_enum AS ENUM ('pantry', 'refrigerator', 'freezer');
  END IF;
END$$;

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Shelf life reference table
CREATE TABLE IF NOT EXISTS shelf_life_data (
  id BIGSERIAL PRIMARY KEY,
  food_name TEXT NOT NULL,
  normalized_food_name TEXT GENERATED ALWAYS AS (lower(trim(food_name))) STORED,
  category VARCHAR(100),
  pantry_days INTEGER CHECK (pantry_days >= 0),
  refrigerator_days INTEGER CHECK (refrigerator_days >= 0),
  freezer_days INTEGER CHECK (freezer_days >= 0),
  storage_notes TEXT,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source VARCHAR(100) NOT NULL DEFAULT 'stilltasty',
  source_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER shelf_life_touch_updated_at
BEFORE UPDATE ON shelf_life_data
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_shelf_life_normalized_food_name ON shelf_life_data (normalized_food_name);

-- Receipt processing history table
CREATE TABLE IF NOT EXISTS receipt_scans (
  id BIGSERIAL PRIMARY KEY,
  user_session VARCHAR(255),
  image_url TEXT,
  ocr_raw_data JSONB,
  parsed_items JSONB,
  processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  items_added_count INTEGER DEFAULT 0 CHECK (items_added_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER receipt_scans_touch_updated_at
BEFORE UPDATE ON receipt_scans
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_receipt_scans_status ON receipt_scans (processing_status);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_created_at ON receipt_scans (created_at);

COMMIT;
```

### Migration: alter products to add expiration/purchase columns

Filename suggestion: `migrations/2025-09-17__alter_products_add_expiration_fields.sql`

```sql
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'storage_location_enum') THEN
    CREATE TYPE storage_location_enum AS ENUM ('pantry', 'refrigerator', 'freezer');
  END IF;
END$$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_expiration_date DATE,
  ADD COLUMN IF NOT EXISTS expiration_confidence NUMERIC(3,2) CHECK (expiration_confidence >= 0 AND expiration_confidence <= 1),
  ADD COLUMN IF NOT EXISTS storage_location storage_location_enum DEFAULT 'pantry';

CREATE INDEX IF NOT EXISTS idx_products_estimated_expiration_date ON products (estimated_expiration_date);
CREATE INDEX IF NOT EXISTS idx_products_storage_location ON products (storage_location);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);

COMMIT;
```

### Trigger helper for products (if needed)

```sql
BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_touch_updated_at') THEN
    CREATE TRIGGER products_touch_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();
  END IF;
END$$;

COMMIT;
```

---

## Phase 1: Services & Routes

### ShelfLifeService (server-side)

```typescript
// src/services/shelfLife.service.ts
export class ShelfLifeService {
  private baseURL = process.env.SHELF_LIFE_API_URL || 'https://shelf-life-api.herokuapp.com';

  async estimateExpiration(
    foodName: string,
    purchaseDate: Date,
    storageLocation: 'pantry' | 'refrigerator' | 'freezer' = 'pantry'
  ) {
    // First check local NeonDB cache
    const cached = await this.getFromCache(foodName);
    if (cached) {
      return this.calculateExpiration(cached, purchaseDate, storageLocation);
    }

    // Fallback to external API
    const shelfLifeData = await this.fetchFromExternalAPI(foodName);
    if (shelfLifeData) {
      await this.cacheShelfLifeData(shelfLifeData);
      return this.calculateExpiration(shelfLifeData, purchaseDate, storageLocation);
    }

    // Default fallback
    return {
      estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      confidence: 0.3,
      source: 'default'
    };
  }

  // ...implement getFromCache, fetchFromExternalAPI, cacheShelfLifeData, calculateExpiration
}
```

### ReceiptOCRService (server-side)

```typescript
// src/services/receiptOCR.service.ts
export class ReceiptOCRService {
  private ocrAPI = 'https://api.tabscanner.com/api/2/process';

  async processReceipt(imageBuffer: Buffer) {
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer]), 'receipt.jpg');

    const response = await fetch(this.ocrAPI, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.TABSCANNER_API_KEY}`
      }
    });

    const result = await response.json();
    return this.parseReceiptData(result);
  }

  private parseReceiptData(ocrResult: any) {
    // Extract items, prices, quantities from OCR result
    // Match against your product database
    // Return standardized format
  }
}
```

### Express route examples (sync simple, recommended: make async + worker)

```typescript
// Example: /api/products/from-receipt (server)
app.post('/api/products/from-receipt', upload.single('receipt'), async (req, res) => {
  try {
    const receiptService = new ReceiptOCRService();
    const shelfLifeService = new ShelfLifeService();

    // Process the receipt
    const ocrResult = await receiptService.processReceipt(req.file.buffer);
    
    // Store receipt scan record
    const receiptScan = await db.query(
      'INSERT INTO receipt_scans (user_session, ocr_raw_data, parsed_items, processing_status) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.sessionID, ocrResult.raw, ocrResult.items, 'processed']
    );

    // Process each item
    const processedItems = await Promise.all(
      ocrResult.items.map(async (item) => {
        // Estimate expiration
        const expiration = await shelfLifeService.estimateExpiration(
          item.name,
          new Date(), // purchase date = today
          'pantry'
        );

        // Insert/update product
        const result = await db.query(`
          INSERT INTO products (barcode, name, brand, quantity, purchase_date, estimated_expiration_date, expiration_confidence)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (barcode) 
          DO UPDATE SET 
            quantity = products.quantity + $4,
            purchase_date = $5,
            estimated_expiration_date = $6,
            expiration_confidence = $7
          RETURNING *
        `, [
          item.barcode || null,
          item.name,
          item.brand || null,
          item.quantity || 1,
          new Date(),
          expiration.estimatedDate,
          expiration.confidence
        ]);

        return result.rows[0];
      })
    );

    res.json({
      success: true,
      receiptId: receiptScan.rows[0].id,
      itemsProcessed: processedItems.length,
      items: processedItems
    });

  } catch (error) {
    console.error('Receipt processing error:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

// Expiration estimation endpoint
app.post('/api/products/:id/estimate-expiration', async (req, res) => {
  const { storageLocation, purchaseDate } = req.body;
  const shelfLifeService = new ShelfLifeService();

  try {
    const product = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!product.rows[0]) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const expiration = await shelfLifeService.estimateExpiration(
      product.rows[0].name,
      new Date(purchaseDate),
      storageLocation
    );

    await db.query(
      'UPDATE products SET estimated_expiration_date = $1, expiration_confidence = $2, storage_location = $3 WHERE id = $4',
      [expiration.estimatedDate, expiration.confidence, storageLocation, req.params.id]
    );

    res.json(expiration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to estimate expiration' });
  }
});
```

---

## Phase 2: Frontend Integration

### Types

Add to `src/types/pantry.ts` (or extend existing types):

```typescript
export interface PantryItem {
  // ... existing fields
  purchaseDate?: Date;
  estimatedExpirationDate?: Date;
  expirationConfidence?: number;
  storageLocation?: 'pantry' | 'refrigerator' | 'freezer';
  daysUntilExpiration?: number;
  expirationStatus?: 'fresh' | 'expiring_soon' | 'expired';
}

export interface ReceiptScanResult {
  receiptId: string;
  itemsProcessed: number;
  items: PantryItem[];
  processingTime: number;
}

export interface ExpirationEstimate {
  estimatedDate: Date;
  confidence: number;
  source: string;
  daysRemaining: number;
}
```

### ReceiptScanner component

Create `src/components/receipt/ReceiptScanner.tsx`:

```tsx
import React, { useState } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';

export const ReceiptScanner: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReceiptScanResult | null>(null);

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch('/api/products/from-receipt', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to process receipt');
      
      const result = await response.json();
      setResult(result);
      
      // Trigger pantry refresh in your existing state management
      // This hooks into your existing usePantryData hook
      
    } catch (error) {
      console.error('Receipt processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Scan Your Receipt</h3>
        <p className="text-gray-600 mb-4">
          Take a photo of your grocery receipt to automatically add items to your pantry
        </p>
        
        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
          <Camera className="mr-2 h-4 w-4" />
          {isProcessing ? 'Processing...' : 'Take Photo'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
            disabled={isProcessing}
          />
        </label>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="font-medium text-green-800">Receipt Processed Successfully!</h4>
          </div>
          <p className="text-green-700">
            Added {result.itemsProcessed} items to your pantry with expiration estimates.
          </p>
        </div>
      )}
    </div>
  );
};
```

### AddItemModal change (tab for receipt)

Add an import and a 'receipt' tab in `src/components/pantry/AddItemModal.tsx`:

```tsx
// Add to your existing AddItemModal component
import { ReceiptScanner } from '../receipt/ReceiptScanner';

// Add a new tab for receipt scanning
const tabs = [
  { id: 'barcode', label: 'Scan Barcode', icon: QrCode },
  { id: 'receipt', label: 'Scan Receipt', icon: Camera },
  { id: 'manual', label: 'Manual Entry', icon: Edit }
];

// In your tab content rendering:
{activeTab === 'receipt' && (
  <ReceiptScanner onItemsAdded={(items) => {
    // This will trigger your existing pantry refresh
    onClose();
  }} />
)}
```

### Pantry item expiration display

Add utility to `src/components/pantry/PantryView.tsx`:

```tsx
const getExpirationStatus = (item: PantryItem) => {
  if (!item.estimatedExpirationDate) return null;
  
  const today = new Date();
  const expiration = new Date(item.estimatedExpirationDate);
  const daysUntilExpiration = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) return { status: 'expired', color: 'text-red-600', days: Math.abs(daysUntilExpiration) };
  if (daysUntilExpiration <= 3) return { status: 'expiring_soon', color: 'text-orange-600', days: daysUntilExpiration };
  return { status: 'fresh', color: 'text-green-600', days: daysUntilExpiration };
};

{item.estimatedExpirationDate && (
  <div className={`text-xs ${getExpirationStatus(item)?.color}`}>
    {getExpirationStatus(item)?.status === 'expired' ? 
      `Expired ${getExpirationStatus(item)?.days} days ago` :
      `Expires in ${getExpirationStatus(item)?.days} days`
    }
  </div>
)}
```

### Hook: useReceiptScanning

Create `src/hooks/useReceiptScanning.ts`:

```typescript
import { useState } from 'react';
import { usePantryActions } from './usePantryActions'; // Your existing hook

export const useReceiptScanning = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { refreshPantry } = usePantryActions();

  const processReceipt = async (file: File): Promise<ReceiptScanResult> => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch('/api/products/from-receipt', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Receipt processing failed');
      
      const result = await response.json();
      
      // Trigger refresh of your existing pantry data
      await refreshPantry();
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processReceipt,
    isProcessing
  };
};
```

---

## Phase 2: Environment & Build

### .env (example)

```bash
# Receipt OCR API
TABSCANNER_API_KEY=your_tabscanner_api_key
VERYFI_CLIENT_ID=your_veryfi_client_id
VERYFI_CLIENT_SECRET=your_veryfi_secret

# Shelf Life API
SHELF_LIFE_API_URL=https://shelf-life-api.herokuapp.com

# Database (your existing Neon config)
DATABASE_URL=your_neon_connection_string
```

### vite.config.ts (optional define)

```typescript
// Add environment variables for client-side access if needed
define: {
  __RECEIPT_SCANNING_ENABLED__: JSON.stringify(process.env.NODE_ENV === 'production'),
}
```

---

## Phase 3: Testing & Integration

### Test file paths to add

```
src/components/receipt/__tests__/ReceiptScanner.test.tsx
src/hooks/__tests__/useReceiptScanning.test.ts
src/services/__tests__/receiptOCR.service.test.ts
```

---

## Phase 4: Deployment & Operational Notes

- Use object storage (S3 / Cloudflare R2) for receipt images; store `image_url` in DB.
- Use async worker (BullMQ / Redis or serverless) to process receipts: download image, call OCR, estimate expiration, upsert products, update `receipt_scans`.
- Avoid storing raw image bytes in Postgres.
- Add retention/archival policy for `receipt_scans` (e.g. 90 days), and scrub PCI/PII from OCR results.

---

## Rollback & Down migrations (examples)

```sql
-- Example down migration (use with care)
BEGIN;
ALTER TABLE products DROP COLUMN IF EXISTS estimated_expiration_date;
ALTER TABLE products DROP COLUMN IF EXISTS expiration_confidence;
ALTER TABLE products DROP COLUMN IF EXISTS purchase_date;
ALTER TABLE products DROP COLUMN IF EXISTS storage_location;
DROP TABLE IF EXISTS receipt_scans;
DROP TABLE IF EXISTS shelf_life_data;
DROP TYPE IF EXISTS storage_location_enum;
COMMIT;
```

---

## Checklist (quick)

- [ ] Add migration files to `migrations/`
- [ ] Test migrations on staging
- [ ] Provision object storage and env vars
- [ ] Implement worker and enqueue flow
- [ ] Add tests and CI checks
- [ ] Deploy worker and API changes
- [ ] Monitor `receipt_scans` and worker errors

---

If you'd like, I can now:

- Generate the dedupe migration (archive + merge + audit) as a SQL file.
- Draft a minimal Node worker (BullMQ) and the enqueueing Express route.

Choose one and I'll add it to this `todos.md` as additional tasks with ready-to-run code.
