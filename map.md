================================================================================
🎯 HUMMINGBIRDPANTRY - COMPLETE PROJECT ARCHITECTURE MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                              🌐 WEB PROJECT MAP                              │
│                          HummingbirdPantry (React + TS)                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           🏗️ ARCHITECTURAL OVERVIEW                           │
└─────────────────────────────────────────────────────────────────────────────┘

├── 🎯 CORE PRINCIPLES
│   ├── Neon-First: PostgreSQL as single source of truth
│   ├── Server-First: Immediate error surfacing, no silent fallbacks
│   ├── Single-Flight Scanner: App-level guard prevents duplicates
│   └── MVP Focus: Scan → Resolve → Save → Confirm workflow
│
├── 🛠️ TECH STACK
│   ├── Frontend: React 18 + TypeScript + Vite
│   ├── UI: Tailwind CSS + Radix UI + Lucide Icons
│   ├── State: Zustand + Immer (UI-only state)
│   ├── Build: Vite + Rollup + ESLint + Prettier
│   ├── Testing: Vitest + React Testing Library + Playwright
│   └── Backend: Express.js + PostgreSQL (Neon) + Zod
│
└── 📱 TARGET ENVIRONMENTS
    ├── Browsers: Chrome, Firefox, Safari (iOS 15+)
    ├── Platforms: Desktop, Mobile, Tablet
    └── Features: PWA-ready, Camera API, HTTPS-required

================================================================================
📁 PROJECT STRUCTURE MAP
================================================================================

HummingbirdPantry/
├── 📄 Configuration Files
│   ├── package.json           # Dependencies & scripts
│   ├── vite.config.ts         # Build configuration
│   ├── tailwind.config.js     # Styling configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── eslint.config.js       # Linting rules
│   └── postcss.config.js      # CSS processing
│
├── 🌐 Public Assets
│   ├── index.html            # Main HTML template
│   ├── manifest.json         # PWA manifest
│   └── assets/               # Static files (icons, images)
│
└── 📦 Source Code (src/)
    ├── 🚀 Entry Points
    │   ├── main.tsx          # React app initialization
    │   └── App.tsx           # Main app component
    │
    ├── 🎨 UI Layer (Components)
    │   ├── common/           # Shared UI components
    │   │   ├── AppHeader.tsx
    │   │   ├── BottomNavigation.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── ServerStatusBanner.tsx
    │   │   └── ViewRouter.tsx
    │   │
    │   ├── pantry/           # Pantry management
    │   │   ├── PantryView.tsx
    │   │   ├── AddItemModal.tsx
    │   │   ├── CategoryList.tsx
    │   │   └── CategoryItems.tsx
    │   │
    │   ├── barcode/          # Barcode scanning
    │   │   ├── BarcodeScanner.tsx
    │   │   ├── ScannerProvider.tsx
    │   │   └── dev/diagnostics.ts
    │   │
    │   ├── cache/            # Data caching
    │   ├── camera/           # Camera utilities
    │   ├── chat/             # Chat interface (deferred)
    │   ├── shopping/         # Shopping lists (deferred)
    │   ├── voice/            # Voice recognition (deferred)
    │   └── analytics/        # Analytics (deferred)
    │
    ├── 🔧 Business Logic (Hooks)
    │   ├── useAppNavigation.ts    # Navigation state
    │   ├── useModalManager.ts     # Modal coordination
    │   ├── useScannerIntegration.ts # Scanner orchestration
    │   ├── usePantryActions.ts    # Server operations
    │   ├── usePantryData.ts       # Data access
    │   ├── useServerHealth.ts     # Health monitoring
    │   ├── useBarcodeZxing.ts     # ZXing integration
    │   ├── useCameraPermissions.ts # Camera access
    │   └── useAppInitialization.ts # App startup
    │
    ├── 📊 State Management (Stores)
    │   ├── pantry.store.ts        # UI state only
    │   └── middleware/            # Persistence, immer
    │
    ├── 🌐 Services Layer
    │   ├── api.service.ts         # Unified API client
    │   ├── apiClient.ts           # HTTP utilities
    │   ├── backgroundSync.service.ts # Background sync
    │   └── barcodeCache.service.ts # Local caching
    │
    ├── 📋 Types & Interfaces
    │   ├── core.ts               # Base types
    │   ├── pantry.ts             # Pantry item types
    │   ├── shopping.ts           # Shopping types
    │   ├── camera.ts             # Camera types
    │   ├── voice.ts              # Voice types
    │   └── services.ts           # API types
    │
    ├── 🎨 Styling
    │   ├── assets/styles/index.css # Global styles
    │   └── components/            # Component styles
    │
    ├── 🧪 Testing
    │   ├── setup.ts              # Test configuration
    │   ├── fixtures/             # Test data
    │   ├── mocks/                # API mocks
    │   └── utils/                # Test utilities
    │
    └── 🛠️ Utilities
        ├── helpers/              # Pure functions
        ├── constants/            # App constants
        └── validation/           # Input validation

================================================================================
🔄 DATA FLOW ARCHITECTURE
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA FLOW MAP                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. 📱 USER INTERACTION
   ↓
2. 🎯 COMPONENT EVENT
   ↓
3. 🪝 HOOK ORCHESTRATION
   ↓
4. 🔄 STATE MANAGEMENT (UI-only)
   ↓
5. 🌐 API SERVICE (Server-first)
   ↓
6. 🗄️ NEON DATABASE (Source of truth)
   ↓
7. 📊 RESPONSE PROCESSING
   ↓
8. 🔄 STORE UPDATE (Optimistic UI)
   ↓
9. 🎨 COMPONENT RE-RENDER

DETAILED FLOW:

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USER      │───▶│  COMPONENT  │───▶│    HOOK     │───▶│   SERVICE   │
│  ACTION     │    │  EVENT      │    │ ORCHESTRATION│    │  CALL       │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                        │
                                                        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   NEON DB   │◀───│   API       │◀───│  RESPONSE   │◀───│   STORE     │
│   (TRUTH)   │    │  RESPONSE   │    │ PROCESSING  │    │   UPDATE    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                        │
                                                        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI        │◀───│  COMPONENT  │◀───│   REACT     │
│   UPDATE    │    │  RE-RENDER  │    │   STATE     │
└─────────────┘    └─────────────┘    └─────────────┘

================================================================================
🎯 COMPONENT RELATIONSHIP MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT HIERARCHY                               │
└─────────────────────────────────────────────────────────────────────────────┘

App (Root Component)
├── ScannerProvider (Context Provider)
│   └── App (Main Layout)
│       ├── AppHeader (Navigation)
│       ├── ViewRouter (Content Router)
│       │   ├── PantryView (Default View)
│       │   │   ├── PantryList (Item Display)
│       │   │   ├── SearchBar (Filtering)
│       │   │   ├── CategoryFilter (Filtering)
│       │   │   └── ItemActions (CRUD)
│       │   │
│       │   ├── CategoryList (Category View)
│       │   └── CategoryItems (Filtered View)
│       │
│       ├── BottomNavigation (Tab Navigation)
│       ├── ServerStatusBanner (Health Indicator)
│       └── AddItemModal (Lazy Loaded)
│           ├── BarcodeScanner (Camera Integration)
│           ├── ManualEntryForm (Fallback)
│           └── ProductLookup (OFF Integration)

================================================================================
🔌 API ENDPOINTS MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                            API ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────┘

Backend: Express.js + PostgreSQL (Neon) + Zod Validation

API Endpoints:
├── GET    /api/products              # List all products
├── GET    /api/products/:barcode     # Lookup by barcode
├── POST   /api/products              # Create/update product (upsert)
├── PATCH  /api/products/:barcode/increment # Increment quantity
├── PUT    /api/products/:id          # Update product details
├── DELETE /api/products/:id          # Delete product
└── GET    /health                    # Database health check

Data Flow Priority:
1. Neon Database (Source of Truth)
2. Server Response (Immediate validation)
3. Local Cache (Performance optimization)
4. UI State (User experience)

================================================================================
📊 STATE MANAGEMENT MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                          STATE ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────┘

Zustand Store (UI-Only State)
├── pantry.store.ts
│   ├── items[]: PantryItem[]          # Product data
│   ├── searchQuery: string            # Search filter
│   ├── selectedCategory: string       # Category filter
│   ├── sortBy: string                 # Sort field
│   └── sortOrder: 'asc'|'desc'        # Sort direction
│
├── Actions (Local State Only)
│   ├── replaceAll(items)              # Server sync
│   ├── upsertLocal(item)              # Optimistic update
│   ├── removeLocal(id)                # Local removal
│   ├── setSearchQuery(query)          # UI filter
│   ├── setSelectedCategory(cat)       # UI filter
│   ├── setSortBy(field)               # UI sort
│   └── setSortOrder(order)            # UI sort
│
└── Persistence
    ├── localStorage (Settings)
    └── IndexedDB (Product cache)

================================================================================
🎨 STYLING ARCHITECTURE MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                            STYLING SYSTEM                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Design System:
├── Tailwind CSS (Utility-first)
│   ├── Responsive breakpoints
│   ├── Dark/light mode support
│   └── Mobile-first approach
│
├── Radix UI (Accessible components)
│   ├── Dialog, Dropdown, Popover
│   ├── Tabs, Tooltip components
│   └── ARIA-compliant primitives
│
├── Lucide Icons (Consistent iconography)
└── Custom CSS (Component-specific styles)

================================================================================
🧪 TESTING ARCHITECTURE MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                            TESTING PYRAMID                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Unit Tests (Vitest + RTL):
├── Service Layer
│   ├── api.service.ts (CRUD operations)
│   ├── apiClient.ts (HTTP utilities)
│   └── barcodeCache.service.ts
│
├── Hook Layer
│   ├── usePantryActions.ts
│   ├── usePantryData.ts
│   └── useScannerIntegration.ts
│
└── Component Layer
    ├── AddItemModal.tsx
    ├── PantryView.tsx
    └── BarcodeScanner.tsx

Integration Tests:
├── API Integration
├── State Management
└── Component Interactions

E2E Tests (Playwright):
├── Happy Path: Scan → Save → Display
├── Error Paths: Network failure, Camera denied
└── Cross-browser: Chrome, Firefox, Safari

================================================================================
🚀 DEPLOYMENT & BUILD MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUILD & DEPLOYMENT                                │
└─────────────────────────────────────────────────────────────────────────────┘

Development:
├── Vite Dev Server (Port 3002)
├── Hot Module Replacement
├── HTTPS Support (Device testing)
└── Bundle Analysis (Optional)

Production Build:
├── Vite Build (Optimized)
├── Code Splitting (Lazy loading)
├── Asset Optimization
├── Service Worker (PWA)
└── Bundle Analysis

Deployment Targets:
├── Cloudflare Pages (Frontend)
├── Neon PostgreSQL (Database)
├── Express.js API (Backend)
└── PWA Support (Offline-ready)

================================================================================
🎯 FEATURE STATUS MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                            FEATURE MATRIX                                   │
└─────────────────────────────────────────────────────────────────────────────┘

✅ IMPLEMENTED (MVP Core):
├── Pantry Management (CRUD)
├── Barcode Scanning (ZXing)
├── Server Integration (Neon-first)
├── Mobile-First UI (Responsive)
├── Error Boundaries (Reliability)
├── State Management (Zustand)
└── Type Safety (TypeScript)

🔄 IN PROGRESS:
├── Server-First Product Resolution
└── Open Food Facts Integration

🚫 DEFERRED (Out of MVP Scope):
├── Voice Recognition (Web Speech API)
├── Photo Capture & OCR
├── Shopping Lists & AI Chat
├── Advanced Analytics
└── Offline Queue (Background sync)

================================================================================
🔧 DEVELOPMENT WORKFLOW MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPMENT FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. 📝 Planning
   ├── requirements.md (Requirements)
   ├── tasks.md (Implementation tasks)
   └── style.md (Architecture guidelines)

2. 🏗️ Development
   ├── Feature branches (Git flow)
   ├── TypeScript strict mode
   ├── ESLint + Prettier (Code quality)
   └── Husky pre-commit hooks

3. 🧪 Testing
   ├── Unit tests (Vitest)
   ├── Integration tests (RTL)
   ├── E2E tests (Playwright)
   └── Manual testing (Cross-browser)

4. 🚀 Deployment
   ├── Build verification
   ├── Bundle analysis
   ├── Performance testing
   └── Production deployment

================================================================================
📈 PERFORMANCE & OPTIMIZATION MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE TARGETS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Bundle Size:
├── Initial bundle: <200KB (gzipped)
├── Lazy loading: Scanner, Modals
└── Code splitting: Route-based

Runtime Performance:
├── First paint: <2s
├── Barcode decode: <2s (good light)
├── Search/filter: <100ms
└── Memory usage: <50MB

Mobile Optimization:
├── Touch targets: 44px minimum
├── Single-column layout (Mobile-first)
├── Optimized images & assets
└── PWA offline support

================================================================================
🔒 SECURITY & COMPLIANCE MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

HTTPS Requirements:
├── iOS Secure Context (Camera/IndexedDB)
├── Device-trusted certificates (Development)
├── CORS configuration (Production)
└── API key management

Data Protection:
├── Server-side validation (Zod)
├── Input sanitization
├── Error message sanitization
└── No sensitive data in localStorage

Privacy Compliance:
├── Camera permission handling
├── Data minimization
├── User consent for features
└── Transparent data usage

================================================================================
🎯 SUCCESS METRICS MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUCCESS CRITERIA                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Functional Success:
├── ✅ Chrome/Firefox/Safari: Single scanner overlay
├── ✅ Server writes hit Neon immediately
├── ✅ UI reflects server state across browsers
├── ✅ No silent local-only fallbacks
└── ✅ Camera access works on iOS secure context

Performance Success:
├── ✅ Bundle size <200KB
├── ✅ Barcode decode <2s
├── ✅ Mobile responsive (iPhone)
└── ✅ PWA installable

Quality Success:
├── ✅ Zero TypeScript errors
├── ✅ ESLint clean (no warnings)
├── ✅ Test coverage >80%
└── ✅ Cross-browser parity

================================================================================
🔄 FUTURE ROADMAP MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                          FUTURE ENHANCEMENTS                               │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 2 (After MVP):
├── Offline queue with exponential backoff
├── Idempotency keys for API calls
└── Changed-since reconciliation

Phase 3 (Advanced Features):
├── Voice recognition (Web Speech API)
├── Photo capture & OCR
├── Shopping lists & meal planning
└── AI chat assistant

Phase 4 (Enterprise):
├── Multi-user support
├── Advanced analytics
├── Inventory forecasting
└── Integration APIs

================================================================================
📚 DOCUMENTATION MAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOCUMENTATION                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Core Documentation:
├── requirements.md (Functional requirements)
├── tasks.md (Implementation roadmap)
├── style.md (Architecture guidelines)
├── README.md (Setup & usage)
└── API.md (Backend documentation)

Development Guides:
├── setup.md (Local development)
├── testing.md (Testing strategy)
├── deployment.md (Production setup)
└── troubleshooting.md (Common issues)

Architecture Docs:
├── components.md (Component library)
├── hooks.md (Custom hooks guide)
├── state.md (State management)
└── api.md (API integration)

================================================================================
🎯 PROJECT STATUS SUMMARY
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                          CURRENT STATUS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

✅ COMPLETED PHASES:
├── Phase 0: Documentation & Planning (100%)
├── Phase 1: Foundation & Core Setup (100%)
├── Phase 2: Core Pantry Management (95%)
└── Backend Implementation (100%)

🔄 CURRENT SPRINT:
├── Fix scanner overlay duplication
├── Implement server-first product resolution
├── Complete Neon-first CRUD operations
└── Add proper error handling

🚫 DEFERRED FEATURES:
├── Voice recognition system
├── Photo capture & OCR
├── Shopping lists & chat
└── Advanced PWA features

🎯 MVP READINESS: 95% Complete
📅 ESTIMATED MVP COMPLETION: 1-2 weeks

================================================================================