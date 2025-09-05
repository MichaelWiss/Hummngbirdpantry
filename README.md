# HummingbirdPantry

Smart pantry & shopping management with barcode scanning, voice input, AI assistance, and offline-first PWA experience.

## Features (Current / In-Progress)
- Barcode scanning (ZXing) with secure-context + permission handling
- Modular React + TypeScript architecture (Vite)
- Zustand store for pantry data
- Tailwind + Radix UI primitives
- PWA groundwork (service worker, offline caching planned)
- Voice & camera scaffolding
- Secret scanning + hardened dev HTTPS setup

## Tech Stack
React 18, TypeScript, Vite, Zustand, @zxing/library, Tailwind, Radix UI, Vitest, Playwright.

## Development
Install deps:
```
npm install
```
Run dev server (HTTP):
```
npm run dev
```
Run with HTTPS (needed for iOS Safari camera if not localhost):
```
VITE_USE_HTTPS=1 npm run dev
```
Custom cert paths:
```
VITE_USE_HTTPS=1 \
VITE_HTTPS_CERT_PATH=path/to/cert.pem \
VITE_HTTPS_KEY_PATH=path/to/key.pem \
npm run dev
```
See `docs/local-https.md` for generating certs.

## Testing
```
npm test            # unit
npm run test:ui     # watch UI
npm run test:e2e    # Playwright
```

## Project Structure
```
src/
  components/
    barcode/ (scanner + UI subcomponents)
  hooks/ (camera, barcode, pantry)
  services/
  stores/
  lib/
  test/
```

## Security & Secrets
- Private key removed (`key.pem`).
- History purge required if pushed before removal (see `ROTATE_KEYS.md`).
- Secret scanning via pre-commit (`detect-secrets`). See `docs/secrets-scanning.md`.
- Local HTTPS instructions: `docs/local-https.md`.
 - Full policy: `SECURITY.md`.

Minimum remediation if key was pushed:
1. Run git filter-repo removing `key.pem`, `cert.pem`.
2. Force-push rewritten history.
3. Generate new dev certs.

## Barcode Scanning Notes
- Requires camera permission & (on iOS Safari) HTTPS unless localhost.
- Explicit user gesture triggers scanning to avoid silent permission suppression.
- Modularized UI panels for permission, readiness, insecure-context banner.

## Roadmap (Excerpt)
- Pantry CRUD completion & persistence
- Shopping list intelligence
- AI chat integration
- Voice command flows
- Recipe + nutrition APIs
- Offline sync & background sync
- Enhanced analytics dashboard

## Contributing
1. Fork & branch
2. Add or update tests
3. Run lint & type check
```
npm run lint
npm run type-check
```
4. Open PR

## License
MIT

---
Generated 2025-09-05
