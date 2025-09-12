# HummingbirdPantry – Core-First Tasks (Neon-first, Robust MVP)

## Sprint: Make Main Feature Robust (Neon as Source of Truth)

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


## Phase 2.5: Voice & Photo Features

### Voice (Web Speech API)
- [ ] Voice input control with start/stop and visual feedback
- [ ] Dictation pipeline to add items; error messages per error type
- [ ] Mocks for testing voice flows in CI

### Photo Capture & OCR (MVP)
- [ ] Photo capture view (separate from scanner); resource cleanup
- [ ] OCR pipeline (client‑side where possible); extract name/brand/qty
- [ ] Manual correction form; save to DB


## Phase 3: Shopping & Chat Systems

### Shopping Lists
- [ ] Generate list from low stock/expiring soon
- [ ] Aisles/sections ordering; drag‑and‑drop reordering
- [ ] Mark purchased; archive history

### Chat Assistant (MVP)
- [ ] Chat UI (messages, input, quick actions)
- [ ] Commands: add item, create list, find recipes (mocked at first)
- [ ] Error/resilience UX


## Phase 4: UI/UX & PWA

### Mobile‑First UX
- [ ] One‑column layouts on mobile; large touch targets
- [ ] Typography, spacing, contrast tuned for iPhone
- [ ] Animation/transition micro‑interactions (lightweight)

### PWA & Offline
- [ ] Manifest with icons, theme, orientation; install prompt UX
- [ ] Service worker: cache strategy for app shell; versioning
- [ ] Offline banner + re‑sync flow for queued actions

### iOS Secure‑Context Enablement
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

## Current Sprint: Barcode → Save (Granular Milestones)

### Scanner Reliability & iOS Secure Context
- [ ] iOS secure context: device-trusted HTTPS for on-device testing
- [ ] In-app capability gating banner (explain HTTP/LAN IP limits on iOS WebKit)
- [ ] Diagnostic button: show secure-context, UA, mediaDevices status, IndexedDB status
- [ ] Constraint negotiation fallback (min 640×480 @ 15fps) when OverconstrainedError
- [ ] Stop all tracks on unmount / close to release camera reliably
- [ ] Single-shot mode toggle (auto-stop on first decode)

### Data Model & Storage (Local-first)
- [ ] Define `Product` type (id, barcode, name, brand, category, quantity, unit, meta)
- [ ] Create `products` object store in IndexedDB (by `id`, index by `barcode`)
- [ ] Create `offlineQueue` store for pending server sync (optional)
- [ ] Service: `product.service.ts` with CRUD + barcode lookup helpers

### Barcode Scan Flow (MVP)
- [ ] Open scanner modal, request camera, bind `video.srcObject`
- [ ] Start ZXing `decodeFromVideoElementContinuously`
- [ ] Debounce duplicate results; persist first stable decode only
- [ ] Validate barcode (digits-only, length guardrails, checksum for EAN/UPC)
- [ ] Local cache check (IndexedDB) by barcode
- [ ] If cached, hydrate UI and offer quick-save
- [ ] If miss, call lookup service(s); map result → `Product`
- [ ] Fallback to manual form if no product found

### Save & Sync
- [ ] Save product to IndexedDB; update pantry store optimistically
- [ ] If server available, POST to `/api/products`; upsert local on success
- [ ] If offline/failure, enqueue to `offlineQueue` for background sync

### UX & Accessibility
- [ ] Clear permission/insecure-context messaging with next steps
- [ ] Visual focus frame and scan hint; large close/done buttons
- [ ] Toasts: decoded, saved, lookup failed, queued for sync
- [ ] Screen-reader announcements for success/failure

### QA & Acceptance
- [ ] Works on iOS device under secure context (camera + IndexedDB)
- [ ] Decodes common UPC/EAN codes within 2 seconds in good light
- [ ] No camera resource leak after closing scanner
- [ ] Product persisted locally and visible in pantry list
- [ ] Graceful fallback to manual entry when lookup fails


## Phase 1: Foundation & Core Setup (2-3 weeks)

### [x] **✅ COMPLETED: Project Infrastructure Setup**

### [x] **✅ COMPLETED: Core Dependencies & Libraries**

### [x] **✅ COMPLETED: Type System & Data Models**

### [x] **✅ COMPLETED: State Management Architecture**

## Phase 2: Core Pantry Management (3-4 weeks)

### [x] **✅ COMPLETED: Enhanced Pantry Inventory System**

### [x] **✅ COMPLETED: Barcode Scanning Integration**

### [ ] Voice Recognition System

### [ ] Photo Recognition Features

### [ ] Smart Inventory Intelligence

## Phase 3: Advanced Shopping & Chat Systems (4-5 weeks)

### [ ] Advanced Shopping List Management

### [ ] AI Chat Assistant Implementation

### [ ] Analytics Dashboard Development

## Phase 4: UI/UX & Advanced Features (3-4 weeks)

### [ ] Component Architecture Development

### [ ] Mobile-First Responsive Design
  - Strictly single-column layout on all mobile breakpoints (`grid-cols-1`)
  - Enhanced mobile typography with larger, bolder text
  - Darker background for better contrast and readability
  - Improved mobile spacing and touch targets

### [ ] Voice & Camera Component Integration

### [ ] iOS Secure-Context Enablement
- Device-trusted HTTPS for on-device testing (iOS requires secure context or localhost)
- In-app capability gating and iOS copy (Chrome on iOS uses WebKit)
- Verify MediaDevices and IndexedDB on-device under secure context

## Phase 5: Data Management & APIs (2-3 weeks)

### [ ] Data Persistence & Storage

### [ ] External API Integrations

### [ ] Cloud Synchronization (Optional)

## Phase 6: Testing & Quality Assurance (2-3 weeks)

### [ ] Comprehensive Testing Suite

### [ ] Voice & Camera Testing

### [ ] Cross-Platform Testing

## Phase 7: Performance & Optimization (2-3 weeks)

### [ ] Core Performance Optimization

### [ ] Mobile Performance Enhancements

### [ ] Advanced Optimizations

## Phase 8: Documentation & Deployment (1-2 weeks)

### [ ] Documentation Creation

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


## Task Dependencies & Prerequisites

### [ ] Critical Path Dependencies

### [ ] Parallel Development Opportunities

## Risk Assessment & Mitigation

### [ ] High-Risk Areas

### [ ] Risk Mitigation Strategies

## Success Metrics & Milestones

### [ ] Development Milestones

### [ ] Quality Gates

### [ ] User Experience Metrics

## Development Workflow & Best Practices
- [ ] Maintain clean git history with squashed merges

- [ ] Documentation is updated

- [ ] Performance regression testing
## Phase 4: UI/UX & Advanced Features (3-4 weeks)
