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
