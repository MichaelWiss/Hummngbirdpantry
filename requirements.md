# HummingbirdPantry – Core-First Requirements (Neon as Source of Truth)

## Goal
Make the main feature (scan/add/update pantry items) work robustly in all modern browsers with Neon (Postgres) as the single source of truth. Everything else is optional.

## Non‑negotiables
- All CRUD writes go to Neon first. The UI reconciles from the server response and persists the confirmed row locally for fast reads.
- If Neon is unreachable, surface it immediately (banner/toast). Do not pretend success, do not queue silently.
- The scanner opens once, stays open during decode churn, and only closes for user action or fatal camera/permission errors.

## Scope (MVP)
- Scan → resolve product (Local → Server → OFF → Manual) → Save → Confirmed in Neon → Reflected in UI.
- View, increment, edit, delete pantry items; changes persist in Neon and are visible across browsers on reload.

## Functional Requirements
1) Scanner UX
- Open/close controlled only by `App` (single-flight open). Multiple triggers call a single guarded `openScanner()`.
- Continuous decode; ignore transient decoder errors; only fatal camera/permission errors surface.

2) Product Resolution
- On scan miss: try local cache by barcode; then GET `/api/products/:barcode`; then OFF; then manual form.
- On server hit: prefill name/category/unit and allow Save; optionally auto-increment via PATCH.

3) Persistence
- On successful Neon write, update UI from the server-returned row and persist it locally.
- Local storage (IDB/localStorage) is a read-through cache, not a source of truth.

4) Error Handling
- If Neon write fails, show error and do not change local data.
- If Neon read fails on startup, show an “offline/server unreachable” banner and keep UI read-only until recovery.

## Out of Scope (deferred)
- Offline write queue and background flush
- Advanced barcode cache and background sync
- Voice, photo recognition, analytics, shopping lists
- PWA/service worker beyond basic app shell caching

## Technical Requirements
- Frontend: React + TypeScript + Vite. State: Zustand.
- Server: Express + pg. Endpoints:
  - GET `/api/products` – list
  - GET `/api/products/:barcode` – lookup by barcode
  - POST `/api/products` – upsert (insert or merge by barcode)
  - PATCH `/api/products/:barcode/increment` – increment quantity
  - PUT `/api/products/:id` – partial update
  - DELETE `/api/products/:id` – delete
- Env: `VITE_API_BASE_URL` on the client; `DATABASE_URL`, `CORS_ORIGIN` on the server.

## Acceptance Criteria
- Chrome/Firefox/Safari: scanner renders once; does not close on decode noise; first valid scan handles flow end-to-end.
- Add/update/increment/delete reflect in Neon immediately; UI reconciles from server responses; reload shows the same state across browsers.
- On server outage, a visible banner appears and writes are blocked; no silent local-only paths.

## Risks & Mitigations
- CORS/env misconfig → visible banner, block writes, log guidance.
- Scanner device constraints → fall back to 640×480@15, ignore transient decode errors.
- Safari IDB limits → local cache is optional; server remains authoritative.

## Rollout
- Phase 1 (now): enforce Neon-first CRUD and single-flight scanner; visible failures.
- Phase 2 (later): reintroduce queue with idempotency/backoff; add changed‑since reconciliation.
- Phase 3 (later): advanced features (voice, photo, analytics, shopping).

---

## 🚨 Critical Implementation Observations (2025-09-15)

### **Root Cause Analysis**
During development, several anti-patterns emerged that directly violated the core requirements:

#### **Over-Engineering Anti-Pattern**
- **Problem**: Implemented complex 4-tier camera constraint fallback system, extensive logging throughout production code, and complex IndexedDB mocking with type safety violations
- **Impact**: Created debugging nightmares, maintenance burden, and obscured actual issues
- **Requirement Violated**: "Simple, robust implementation" - complexity should serve users, not developers

#### **Local-First Fallback Masking**
- **Problem**: Local storage fallbacks were masking API failures, preventing users from seeing when Neon was unreachable
- **Impact**: Users experienced inconsistent state across browsers without knowing why
- **Requirement Violated**: "If Neon is unreachable, surface it immediately" - no silent failures

#### **Missing Single-Flight Scanner Guard**
- **Problem**: Multiple scan button triggers could open duplicate scanner overlays in Chrome/Firefox
- **Impact**: Duplicate camera streams, confused UI state, resource leaks
- **Requirement Violated**: "Single-flight open" - App should guard against duplicate opens

#### **Bypassed Server-First Product Resolution**
- **Problem**: Safari/Firefox scan flows bypassed the documented Local → Server → OFF → Manual pipeline
- **Impact**: No autofill in forms, inconsistent behavior across browsers
- **Requirement Violated**: "On scan miss: try local cache by barcode; then GET `/api/products/:barcode`" - server lookup was skipped

### **Architectural Lessons Learned**

#### **Simplicity Over Sophistication**
- **✅ DO**: Implement the documented 4-step pipeline exactly as specified
- **❌ DON'T**: Add "production-quality" complexity that wasn't requested
- **Principle**: Requirements define the solution; additional complexity must be justified

#### **Fail-Fast Error Handling**
- **✅ DO**: Surface Neon connection failures immediately with visible banners
- **❌ DON'T**: Implement silent fallbacks that mask actual problems
- **Principle**: Users should know when their data isn't persisting to the server

#### **Browser-Agnostic Implementation**
- **✅ DO**: Use the same code path for all browsers with simple feature detection
- **❌ DON'T**: Implement browser-specific workarounds without understanding root cause
- **Principle**: Architectural issues manifest as browser-specific symptoms

#### **State Management Clarity**
- **✅ DO**: Single source of truth (Neon), local cache for performance only
- **❌ DON'T**: Complex state synchronization between local and server stores
- **Principle**: Server state drives UI; local state is ephemeral cache

### **Mandatory Review Checklist**
Before suggesting any fixes, always verify:

1. **Requirements Compliance**: Does the solution implement the documented 4-step pipeline?
2. **Error Surfacing**: Are Neon failures immediately visible to users?
3. **Single-Flight Guard**: Is there exactly one scanner instance possible?
4. **Server-First Flow**: Does every scan attempt server lookup before fallbacks?
5. **Simplicity Test**: Is this the simplest solution that meets requirements?

### **Implementation Recovery Protocol**
When debugging issues:

1. **Review requirements.md first** - understand expected behavior
2. **Check for anti-patterns** - complexity, masking, bypassing documented flows
3. **Verify end-to-end pipeline** - Local → Server → OFF → Manual
4. **Test server-first behavior** - ensure Neon is actually being used
5. **Validate across browsers** - same code path should work everywhere

**Note**: These observations must be reviewed before proposing any implementation changes to prevent repeating the same architectural mistakes.
