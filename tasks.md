# HummingbirdPantry – Core-First Tasks (Neon as Source of Truth)

## Sprint: Make Main Feature Robust (Neon-first, Robust MVP)

## 🏗️ ARCHITECTURAL PRINCIPLES (From requirements.md)

### Core Requirements (Non-negotiables)
- **🔵 Neon-First**: All CRUD writes go to Neon (Postgres) first. Neon is the single source of truth.
- **🔵 Server-First**: If Neon unreachable, surface error immediately. No silent local-only fallbacks.
- **🔵 Single-Flight Scanner**: Scanner opens once, stays open during decode churn. App-level guard prevents duplicates.
- **🔵 Server-First Product Resolution**: On scan miss → Local cache → Server GET → OFF lookup → Manual form.

### Implementation Guidelines
- **✅ DO**: Surface Neon connection failures immediately with visible banners
- **❌ DON'T**: Implement silent fallbacks that mask actual problems
- **✅ DO**: Use same code path for all browsers with simple feature detection
- **❌ DON'T**: Implement browser-specific workarounds without understanding root cause
- **✅ DO**: Server state drives UI; local state is ephemeral read-through cache
- **❌ DON'T**: Complex state synchronization between local and server stores

### MVP Scope Boundaries
- **IN SCOPE**: Scan → resolve product → Save → Confirmed in Neon → Reflected in UI
- **OUT OF SCOPE**: Offline write queue, voice/photo recognition, shopping lists, advanced PWA features
- **DEFERRED**: Advanced features until core Neon-first workflow is proven robust

### Blocking Bugs (to fix before any new features)
- [ ] Scanner overlays duplicate in Chrome/Firefox
  - Root cause: multiple open triggers without a single-flight guard at App level.
  - Fix: centralize `openScanner()` in `App.tsx`; ignore while open/opening; ensure only one render path for `BarcodeScanner`.
  - Acceptance:
    - Rapid taps on any scan button yield exactly one overlay across Chrome/Firefox/Safari.
    - No duplicate camera streams; closing the modal releases tracks.

- [ ] Safari does not autofill after scan (Save disabled)
  - Root cause: server-first barcode lookup not used to prefill before OFF/manual.
  - Fix: on scan miss → Local → Server GET `/api/products/:barcode` → OFF → Manual; prefill from server/OFf result.
  - Acceptance:
    - If server has item, form prefills (or increments without form) and Save is enabled.
    - If not found, OFF prefills; if still not found, manual form with barcode prefilled.

- [ ] Firefox skips autofilling form
  - Root cause: scan flow bypasses prefill path on some branches.
  - Fix: unify scan handler to the same Local → Server → OFF → Manual pipeline.
  - Acceptance:
    - First valid scan in Firefox follows the same prefill/auto-increment behavior as Chrome/Safari.

- [ ] Browsers not querying NeonDB consistently
  - Root cause: local-only fallbacks masking API failures; writes not visibly failing; env/CORS variance.
  - Fix: Neon-first repository writes (already applied); on failure show banner and block local mutation; verify `VITE_API_BASE_URL` and server CORS.
  - Acceptance:
    - Writes hit Neon (visible in server logs/Neon) or surface a user-visible error.
    - Reload in another browser reflects the same quantities.

### 1) Scanner: Single-Flight + Stable Decode
- [ ] Centralize `openScanner()` in `App.tsx`; ignore while open/opening.
- [ ] Keep one `BarcodeScanner` render path only.
- [ ] In scanner: ignore transient decode errors; only fatal camera/permission errors surface.
- [ ] Ensure tracks stop on close/unmount.

### 2) Server-First Product Resolution
- [ ] On scan miss: Local → GET `/api/products/:barcode` → OFF → Manual.
- [ ] Prefill from server hit to enable Save; optionally auto-increment via PATCH.

### 3) Neon-First CRUD (No Queue)
- [ ] `ProductRepository.upsert`: call server; persist returned row locally; update store.
- [ ] `ProductRepository.increment`: server PATCH; persist returned row; update store.
- [ ] `ProductRepository.update`: server PUT; persist returned row; update store.
- [ ] `ProductRepository.remove`: server DELETE first; then delete locally and update store.
- [ ] On failure: show error; do not mutate local.

### 4) Startup Data Flow
- [ ] On app start: fetch from server; on success, replace store; on failure show banner.
- [ ] Avoid silent local-only mode.

### 5) Environment & CORS
- [ ] Confirm `VITE_API_BASE_URL` available in all deploy environments.
- [ ] Server `CORS_ORIGIN` includes Cloudflare Pages origin.

### 6) Verification (Manual)
- [ ] Chrome/Firefox/Safari: single overlay; no mid-scan closure on decode noise.
- [ ] Add item → visible in Neon; reload in another browser shows it.
- [ ] Increment/edit/delete → reflected immediately in Neon + UI.

## Deferred (after MVP proven)
- [ ] Re-enable offline queue with single-flight + exponential backoff.
- [ ] Add idempotency keys to POST/increment/PUT.
- [ ] Consider changed-since reconciliation after flush.

## UPDATED PROJECT STATUS - September 2025

### ✅ COMPLETED PHASES
**Phase 1: Foundation & Core Setup (100% Complete)**
- ✅ React 18 + TypeScript + Vite project initialized
- ✅ ESLint, Prettier, Husky configured for code quality
- ✅ Comprehensive directory structure (components, hooks, services, stores)
- ✅ Tailwind CSS + Radix UI design system configured
- ✅ Vitest + React Testing Library + Playwright testing setup
- ✅ Path aliases and build optimization configured
- ✅ Core dependencies installed (@radix-ui/*, @zxing/library, zustand, etc.)
- ✅ TypeScript interfaces and branded types defined
- ✅ Zustand store with persistence middleware implemented
- ✅ Custom hooks architecture (usePantry, useAppNavigation, etc.)
- ✅ Error boundaries and server health monitoring
- ✅ Mobile-first responsive design system

**Phase 2: Core Pantry Management (95% Complete)**
- ✅ PantryView component with full functionality
- ✅ AddItemModal with form validation
- ✅ Bottom navigation system
- ✅ Pantry statistics and filtering
- ✅ Item CRUD operations (Create, Read, Update, Delete)
- ✅ Search and category filtering
- ✅ Mobile-optimized layouts
- ✅ Zustand state management with local persistence
- ✅ Optimistic updates pattern
- 🔄 **IN PROGRESS**: Server-first barcode scanning workflow
- 🔄 **IN PROGRESS**: Open Food Facts integration
- ❌ **DEFERRED**: Voice input features (out of MVP scope)
- ❌ **DEFERRED**: Photo capture and OCR (out of MVP scope)

**Backend Implementation (100% Complete)**
- ✅ Express.js server with TypeScript
- ✅ PostgreSQL integration with Neon
- ✅ Complete REST API (/api/products)
- ✅ Database migrations and schema
- ✅ CORS configuration
- ✅ Health check endpoints
- ✅ Zod validation for all endpoints

**API Endpoints (All Implemented):**
- ✅ GET /api/products - List all products
- ✅ GET /api/products/:barcode - Lookup by barcode
- ✅ POST /api/products - Create/update product
- ✅ PATCH /api/products/:barcode/increment - Increment quantity
- ✅ PUT /api/products/:id - Update product
- ✅ DELETE /api/products/:id - Delete product
- POST /api/products - Create/update product
- PATCH /api/products/:barcode/increment - Increment quantity
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product

## Phase 0: Documentation & Planning (COMPLETED ✅)

### Requirements & Roadmap
- [x] Update requirements with iOS secure‑context rule (WebKit engine on all iOS browsers)
- [x] Define supported barcode symbologies (UPC‑A, EAN‑13, EAN‑8; others as stretch)
- [x] Define product fields and validation rules
- [x] Finalize phased roadmap with granular acceptance criteria per phase

### Security & Key Hygiene
- [x] Local HTTPS guide: generating certs, trusting on device, pitfalls on Safari
- [x] Secret scanning tooling and process (documented)
- [x] Add "do not commit keys/certs" policies and `.gitignore` entries

## Phase 1: Foundation & Core Setup

## Phase 0: Documentation & Planning

### Requirements & Roadmap
- [x] Update requirements with iOS secure‑context rule (WebKit engine on all iOS browsers)
- [x] Define supported barcode symbologies (UPC‑A, EAN‑13, EAN‑8; others as stretch)
- [x] Define product fields and validation rules
- [x] Finalize phased roadmap with granular acceptance criteria per phase

### Security & Key Hygiene
- [x] Local HTTPS guide: generating certs, trusting on device, pitfalls on Safari
- [x] Secret scanning tooling and process (documented)
- [x] Add "do not commit keys/certs" policies and `.gitignore` entries


## Phase 0: Documentation & Planning

### Requirements & Roadmap
- [ ] Update requirements with iOS secure‑context rule (WebKit engine on all iOS browsers)
- [ ] Define supported barcode symbologies (UPC‑A, EAN‑13, EAN‑8; others as stretch)
- [ ] Define product fields and validation rules
- [ ] Finalize phased roadmap with granular acceptance criteria per phase

### Security & Key Hygiene
- [ ] Local HTTPS guide: generating certs, trusting on device, pitfalls on Safari
- [ ] Secret scanning tooling and process (documented)
- [ ] Add “do not commit keys/certs” policies and `.gitignore` entries


## Phase 1: Foundation & Core Setup

### Tooling & Quality
- [ ] ESLint + Prettier (CJS config if needed), strict TypeScript
- [ ] Vitest + RTL for unit/integration tests; Playwright for E2E
- [ ] Path aliases and tsconfig paths; CI lint/test scripts

### Build & Dev Server
- [ ] Vite config hardened (host binding, headers, HTTPS toggles via env)
- [ ] Local HTTPS env vars (cert/key paths) and graceful fallback
- [ ] Document “never self‑sign for production”; device trust flow only for dev

### Styling & UI System
- [ ] Tailwind configured with design tokens; CSS Modules allowed for scoped styles
- [ ] Base layout components (Header, Nav, Card, Button) skeletons


## Phase 2: Core Pantry Management

### State & Models
- [ ] Pantry store (items, filters, search, optimistic updates)
- [ ] Types: `PantryItem`, `ItemCategory`, `MeasurementUnit`
- [ ] Persistence middleware (localStorage) for settings

### Core Screens
- [ ] Pantry list with filters/search/sorting
- [ ] Add/Edit item modal (validation, units, categories)
- [ ] Stats overview (counts, expiring soon, categories)

### Barcode Scanning (BETA → GA)
- [ ] Modal UX (shell only): video container, overlay, controls, instructions
- [ ] Camera request + binding: `getUserMedia` → `video.srcObject`, `onloadedmetadata`
- [ ] ZXing integration: `decodeFromVideoElementContinuously`
- [ ] Debounce, validation (length + checksum), and success flow
- [ ] IndexedDB cache lookup; provider lookup fallback; manual entry fallback
- [ ] Save to DB; optimistic UI; cleanup tracks; toasts & announcements
- [ ] iOS secure‑context gating (banner + docs link)
- [ ] GA criteria met (see QA & Acceptance)


## 🚫 DEFERRED FEATURES (Out of MVP Scope)

### Phase 2.5: Voice & Photo Features (DEFERRED)
**Status**: Explicitly out of scope for MVP per requirements.md
**Rationale**: Core focus is robust Neon-first barcode scanning and pantry management

#### Voice Recognition (Web Speech API) - DEFERRED
- [ ] Voice input control with start/stop and visual feedback
- [ ] Dictation pipeline to add items; error messages per error type
- [ ] Mocks for testing voice flows in CI

#### Photo Capture & OCR (MVP) - DEFERRED
- [ ] Photo capture view (separate from scanner); resource cleanup
- [ ] OCR pipeline (client‑side where possible); extract name/brand/qty
- [ ] Manual correction form; save to DB

### Phase 3: Shopping & Chat Systems (DEFERRED)
**Status**: Explicitly out of scope for MVP per requirements.md
**Rationale**: "Everything else is optional" - focus on core scan/add/update/delete workflow

#### Shopping Lists - DEFERRED
- [ ] Generate list from low stock/expiring soon
- [ ] Aisles/sections ordering; drag‑and‑drop reordering
- [ ] Mark purchased; archive history

#### Chat Assistant (MVP) - DEFERRED
- [ ] Chat UI (messages, input, quick actions)
- [ ] Commands: add item, create list, find recipes (mocked at first)
- [ ] Error/resilience UX

### Phase 4: Advanced PWA Features (PARTIALLY DEFERRED)
**Status**: Basic PWA features may be included; advanced offline queue deferred
**Rationale**: Service worker beyond basic app shell caching is out of scope

#### Mobile‑First UX (IN SCOPE)
- [ ] One‑column layouts on mobile; large touch targets
- [ ] Typography, spacing, contrast tuned for iPhone
- [ ] Animation/transition micro‑interactions (lightweight)

#### Advanced PWA & Offline (DEFERRED)
- [ ] Manifest with icons, theme, orientation; install prompt UX
- [ ] Service worker: cache strategy for app shell; versioning
- [ ] Offline banner + re‑sync flow for queued actions

#### iOS Secure‑Context Enablement (IN SCOPE)
- [ ] Device‑trusted HTTPS guide and checklist (dev only)
- [ ] App copy explaining iOS WebKit limitations on HTTP/LAN IP
- [ ] Verification checklist (camera + IndexedDB work on device)


## Phase 5: Data Management & APIs

### IndexedDB & Services
- [ ] DB versioning + migrations; error handling for blocked/upgrade
- [ ] `products` store APIs (getById, getByBarcode, list, put, delete)
- [ ] `offlineQueue` APIs and background processing

### Server APIs (if/when available)
- [ ] `/api/products` CRUD; schema validation
- [ ] Barcode lookup proxy with caching/budget limits
- [ ] Error taxonomy and retry/backoff policy


## Phase 6: Testing & Quality Assurance

### Unit & Integration
- [ ] Hooks: pantry, scanner, products services (85%+ coverage targets later)
- [ ] Components: scanner modal, add item modal, pantry list
- [ ] Storage: IndexedDB service with mocks

### E2E (Playwright)
- [ ] Happy path: scan → product → save → appears in pantry
- [ ] Fallback path: scan fail → manual entry → save
- [ ] Offline path: save queued → sync on reconnect

### Cross‑Platform
- [ ] iOS Safari device (secure context) acceptance
- [ ] Desktop Chrome/Firefox parity checks


## Phase 7: Performance & Optimization

### App‑level
- [ ] Code splitting/lazy load scanner and heavy views
- [ ] Keep initial bundle under target budget (<200KB gz)
- [ ] Measure and reduce layout shifts on mobile

### Scanner‑specific
- [ ] Decode latency budget (~2s in good light)
- [ ] Constraint negotiation metrics (how often fallbacks are used)
- [ ] Memory and track cleanup verified (no leaks across open/close cycles)


## Phase 8: Documentation & Deployment

### Docs
- [ ] README: setup, HTTPS on device, known limitations, troubleshooting
- [ ] Component READMEs for scanner and data services
- [ ] Change log and migration notes for DB version bumps

### Deployment
- [ ] CI: lint, typecheck, tests, build
- [ ] CD: artifact upload; environment config; secrets policy
- [ ] Observability hooks (minimal): error reporting toggles


## Risk Register (Live)
- iOS WebKit secure‑context requirement blocks camera/IndexedDB on HTTP/LAN IP → Mitigate with device‑trusted HTTPS and clear banners.
- Provider rate limits/coverage gaps for barcode lookup → Cache + manual entry fallback.
- Camera constraints vary across devices → Robust fallback path and telemetry.


## Definitions of Done (DoD)
- Feature meets acceptance criteria, has tests, cleans up resources, and is documented.
- No new ESLint/TypeScript errors; lints/tests pass in CI.
- Mobile UX verified on iPhone; accessible announcements included.


## Appendix: Recent Regression (2025‑09‑05) – Barcode Scanner

### Symptoms
- Black/flash video, 0×0 dimensions, `IndexSizeError`, duplicate overlay (Safari), inconsistent auto‑start.

### Root Causes
1) Preflight stream stopped before ZXing attach → race leaving video without `srcObject`.
2) Restart timers resetting reader during attach window.
3) Overlay duplication illusion from nested frames + strict/dev double mount.
4) Decode attempted on 0×0 video → transient canvas read errors.

### Resolutions
- Single deterministic pipeline: getUserMedia → bind → wait `loadedmetadata` → continuous decode.
- Remove restart/polling; simplify overlay to single layer; `pointer-events: none`.
- Document causes; defer advanced features behind flags.

### Deferred Enhancements
- Single‑shot barcode mode, device switcher, diagnostics flag, extended fallback constraints.
# HummingbirdPantry - Development Tasks

## 🎯 CURRENT SPRINT: Robust Neon-First MVP (Aligned with requirements.md)

**Goal**: Make the main feature (scan/add/update pantry items) work robustly in all modern browsers with Neon (Postgres) as the single source of truth.

### Core Requirements (Non-negotiables from requirements.md)
- ✅ All CRUD writes go to Neon first (single source of truth)
- ✅ If Neon unreachable, surface error immediately (no silent fallbacks)
- ✅ Scanner opens once, stays open during decode churn (single-flight guard)
- ✅ Server-first product resolution: Local → Server → OFF → Manual

### Sprint Objectives
- [ ] Fix scanner overlay duplication across browsers (single-flight guard)
- [ ] Implement server-first product resolution pipeline
- [ ] Complete Neon-first CRUD operations with proper error handling
- [ ] Add visible error banners for Neon connection failures
- [ ] Verify cross-browser consistency (Chrome/Firefox/Safari)

### Technical Implementation Focus
- [ ] Centralize `openScanner()` in `App.tsx` with single-flight guard
- [ ] Implement Local → Server → OFF → Manual product resolution
- [ ] Ensure all writes hit Neon or surface visible errors
- [ ] Add startup data fetch from server with error banner on failure
- [ ] Verify `VITE_API_BASE_URL` and CORS configuration

### QA & Verification
- [ ] Chrome/Firefox/Safari: single overlay, no duplicates
- [ ] Add/update/increment/delete reflected in Neon immediately
- [ ] Reload in another browser shows same state
- [ ] Server outage shows visible banner, blocks writes


## Phase 0: Architecture Cleanup & Consolidation (COMPLETED ✅)

### [x] **✅ COMPLETED: Service Layer Consolidation**
- Replaced multiple overlapping services with unified `api.service.ts`
  - Removed: `ProductRepository.ts` (85 lines), `pantryApi.service.ts` (85 lines) 
  - Removed: `openFoodFacts.service.ts`, `product.service.ts`, `useBarcodeCache.ts` (300 lines)
  - Unified: Single service with `getAllItems`, `createItem`, `updateItem`, `incrementItem`, `deleteItem`
  - Server-first pattern: Immediate error surfacing, no fallback masking

### [x] **✅ COMPLETED: Store Architecture Cleanup**
- Simplified `pantry.store.ts` from 473 to 139 lines (70% reduction)
- Pure UI-only state management without server operations
- Clean actions: `replaceAll`, `upsertLocal`, `removeLocal` with filtering
- Removed mixed concerns and circular dependencies

### [x] **✅ COMPLETED: Component Simplification**
- `AddItemModal.tsx`: 391 → 184 lines (53% reduction) 
- Simplified autofill logic and removed complex ProductRepository dependencies
- Fixed TypeScript strict mode compliance across all components
- Proper error handling and field validation

### [x] **✅ COMPLETED: Hook Architecture Refactoring**
- `usePantryActions.ts`: Write-only operations with server-first pattern
- `usePantryData.ts`: Complete rewrite for read-only data access with computed stats
- Removed `useBarcodeCache.ts` complexity and consolidated functionality
- Clean separation of concerns between data and actions

### [x] **✅ COMPLETED: Build & Type Safety Verification**
- Zero TypeScript errors with strict mode enabled
- Successful build verification (3.54s, 1711 modules, ~640KB total)
- Removed all `.old.*` backup files to prevent type conflicts
- Comprehensive error checking across entire codebase

## Phase 1: Foundation & Core Setup (2-3 weeks)

### [x] **✅ COMPLETED: Project Infrastructure Setup**

### [x] **✅ COMPLETED: Core Dependencies & Libraries**

### [x] **✅ COMPLETED: Type System & Data Models**

### [x] **✅ COMPLETED: State Management Architecture**

## Phase 2: Core Pantry Management (3-4 weeks)

### [x] **✅ COMPLETED: Enhanced Pantry Inventory System**

### [x] **✅ COMPLETED: Barcode Scanning Integration**

### [ ] Voice Recognition System (DEFERRED - Out of MVP Scope)

### [ ] Photo Recognition Features (DEFERRED - Out of MVP Scope)

### [ ] Smart Inventory Intelligence (DEFERRED - Out of MVP Scope)

## Phase 3: Advanced Shopping & Chat Systems (4-5 weeks) - DEFERRED

### [ ] Advanced Shopping List Management (DEFERRED - Out of MVP Scope)

### [ ] AI Chat Assistant Implementation (DEFERRED - Out of MVP Scope)

### [ ] Analytics Dashboard Development (DEFERRED - Out of MVP Scope)

## Phase 4: UI/UX & Advanced Features (3-4 weeks)

### [ ] Component Architecture Development

### [ ] Mobile-First Responsive Design
  - Strictly single-column layout on all mobile breakpoints (`grid-cols-1`)
  - Enhanced mobile typography with larger, bolder text
  - Darker background for better contrast and readability
  - Improved mobile spacing and touch targets

### [ ] Voice & Camera Component Integration (DEFERRED - Out of MVP Scope)

### [ ] iOS Secure-Context Enablement
- Device-trusted HTTPS for on-device testing (iOS requires secure context or localhost)
- In-app capability gating and iOS copy (Chrome on iOS uses WebKit)
- Verify MediaDevices and IndexedDB on-device under secure context

## Phase 5: Data Management & APIs (2-3 weeks)

### [ ] Data Persistence & Storage
- [ ] Update storage patterns to work with unified `api.service.ts`
- [ ] Remove references to deprecated ProductRepository and pantryApi services
- [ ] Validate IndexedDB integration with clean store architecture
- [ ] Test localStorage persistence with simplified state management

### [ ] External API Integrations
- [ ] OpenFoodFacts integration refinement in `api.service.ts`
- [ ] Category mapping and product data normalization
- [ ] Rate limiting and caching strategies
- [ ] Fallback handling for API failures

### [ ] Cloud Synchronization (Optional)
- [ ] Server API endpoints aligned with clean service architecture
- [ ] Optimistic updates through unified pantry actions
- [ ] Conflict resolution with server-first error handling
- [ ] Background sync integration with simplified store

## Phase 6: Testing & Quality Assurance (2-3 weeks)

### [ ] **Unit Testing Suite**
- [ ] Service Layer Testing
  - [ ] `api.service.ts` unit tests: CRUD operations, error handling, category mapping
  - [ ] Mock server responses for consistent test behavior
  - [ ] Test OpenFoodFacts integration with fallback scenarios
  - [ ] Validate ApiResponse type safety and error propagation

- [ ] Store Testing
  - [ ] `pantry.store.ts` state management: replaceAll, upsertLocal, removeLocal
  - [ ] Filter functionality with search terms and categories
  - [ ] LocalStorage persistence behavior
  - [ ] State cleanup and initialization

- [ ] Hook Testing
  - [ ] `usePantryActions.ts`: Server-first operations with proper error handling
  - [ ] `usePantryData.ts`: Computed statistics and filtered data derivation
  - [ ] Mock API responses for optimistic updates and error scenarios
  - [ ] Hook cleanup and dependency tracking

### [ ] **Component Testing Suite**
- [ ] Core Components
  - [ ] `AddItemModal.tsx`: Form validation, autofill behavior, API integration
  - [ ] `PantryView.tsx`: Item rendering, filtering, sorting, actions
  - [ ] `BarcodeScanner.tsx`: Camera permissions, decode results, error states
  - [ ] Modal management and overlay behaviors

- [ ] Accessibility Testing
  - [ ] Screen reader compatibility for all interactive elements
  - [ ] Keyboard navigation support
  - [ ] Focus management in modals and scanner
  - [ ] ARIA labels and semantic HTML structure

### [ ] **Integration Testing**
- [ ] API Integration
  - [ ] End-to-end pantry operations: create → read → update → delete
  - [ ] Barcode lookup flow: scan → fetch → autofill → save
  - [ ] Error handling across service boundaries
  - [ ] Offline behavior and error states

- [ ] State Management Integration
  - [ ] Store-hook synchronization under concurrent operations
  - [ ] Optimistic updates with server reconciliation
  - [ ] Filter and search performance with large datasets
  - [ ] LocalStorage persistence across sessions

### [ ] **Mobile & Scanner Testing**
- [ ] Camera & Scanner Testing
  - [ ] Camera permission flow on iOS/Android
  - [ ] Barcode decode accuracy with various formats (UPC, EAN, etc.)
  - [ ] Camera resource cleanup and memory management
  - [ ] Secure context requirements (HTTPS) validation

- [ ] Device Compatibility
  - [ ] iOS WebKit secure context validation
  - [ ] Android Chrome camera constraints
  - [ ] Desktop browser fallbacks
  - [ ] Touch interactions and responsive breakpoints

### [ ] **Performance Testing**
- [ ] Load Testing
  - [ ] Large pantry dataset rendering (500+ items)
  - [ ] Search and filter performance benchmarks
  - [ ] Memory usage monitoring during scanner operations
  - [ ] Bundle size analysis post-cleanup

- [ ] User Experience Metrics
  - [ ] Time to first barcode decode (<2s in good light)
  - [ ] Modal open/close animation smoothness
  - [ ] Touch response times on mobile devices
  - [ ] Network error recovery time

### [ ] **Cross-Platform Testing**

### [ ] **Test Automation & CI/CD**
- [ ] Jest configuration with React Testing Library
- [ ] Vitest setup for service layer unit tests  
- [ ] Mock Service Worker (MSW) for API testing
- [ ] GitHub Actions workflow: lint → typecheck → test → build
- [ ] Test coverage reporting and quality gates (>80% coverage)
- [ ] Automated accessibility testing with axe-core

## Phase 7: Performance & Optimization (2-3 weeks)

### [ ] Core Performance Optimization

### [ ] Mobile Performance Enhancements

### [ ] Advanced Optimizations

## Phase 8: Documentation & Deployment (1-2 weeks)

### [ ] Documentation Creation
- [ ] **Architecture Documentation**
  - [ ] Clean architecture overview: unified services, UI-only store, server-first patterns
  - [ ] Service layer documentation for `api.service.ts` methods and error handling  
  - [ ] Store architecture guide: state management without server operations
  - [ ] Hook patterns: separation of data access (`usePantryData`) and actions (`usePantryActions`)
  
- [ ] **Developer Documentation**
  - [ ] Component integration guide with new hook patterns
  - [ ] TypeScript strict mode compliance guidelines
  - [ ] Error handling patterns and server-first principles
  - [ ] Testing strategy documentation for clean architecture
  
- [ ] **Setup & Troubleshooting**
  - [ ] README: setup, HTTPS on device, known limitations, troubleshooting
  - [ ] Component READMEs for scanner and data services
  - [ ] Change log and migration notes for architecture cleanup
  - [ ] Performance optimization guide post-consolidation

### [ ] Deployment & Production Setup

## Future Enhancement Roadmap

### [ ] Phase 9: Advanced AI Features (Future)

### [ ] Phase 10: Enterprise Features (Future)

## Recent Regression Report (2025-09-05) - Barcode Scanner

### Diagnosis Summary
- Symptoms: Black/flash video, 0×0 video dimensions, IndexSizeError logs, duplicate overlay appearance (Safari), inconsistent auto-start.
- Root Causes:
  1. Multi-stage init (permission preflight stream stopped before ZXing attach) introduced race where video never received a bound stream.
  2. Redundant activation fallback & restart timers resetting the ZXing reader during attachment.
  3. Overlay duplication illusion from nested focus frame + strict/dev double mount behavior.
  4. Continuous decode attempted on a video element with zero dimensions → transient canvas read errors.

### Resolution Steps
1. Removed preflight + restart logic; single deterministic getUserMedia → bind → loadedmetadata wait.
2. Switched to `decodeFromVideoElementContinuously` to avoid device re-open timing issues.
3. Simplified state and removed diagnostics interval / fallback timers.
4. Consolidated overlay to a single layer (no nested frame) + pointer-events-none.
5. Added clear documentation of causes & deferred enhancements.

### Remaining / Deferred Enhancements
- Optional single-shot barcode mode (auto-stop after first decode).
- Camera/device switcher UI.
- Optional diagnostics flag for future debugging.
- Fallback constraint negotiation for older Safari / Firefox edge cases if reported.

## Development Workflow & Best Practices
- [ ] Maintain clean git history with squashed merges
- [ ] Documentation is updated with each feature implementation
- [ ] Performance regression testing before deployments
- [ ] Code reviews for all architectural changes
- [ ] Automated testing for critical user paths
