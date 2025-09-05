# Local HTTPS Development

Private keys must never be committed. The original dev certificate/key have been removed.

## Quick Start (Recommended: mkcert)

1. Install mkcert (macOS):
   brew install mkcert nss
2. Create a local CA (first time only):
   mkcert -install
3. Generate cert/key for localhost + loopback:
   mkcert localhost 127.0.0.1 ::1
4. This produces two files like:
   localhost+2.pem
   localhost+2-key.pem
5. Move or reference them:
   mv localhost+2.pem cert.pem
   mv localhost+2-key.pem key.pem

## Environment Variable Paths (Optional)
Instead of renaming, you can point Vite at custom locations:

Export before starting dev server:

VITE_USE_HTTPS=1 \
VITE_HTTPS_CERT_PATH=path/to/localhost+2.pem \
VITE_HTTPS_KEY_PATH=path/to/localhost+2-key.pem \
npm run dev

## OpenSSL Alternative

If you cannot use mkcert:

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout key.pem -out cert.pem -days 365 \
  -subj "/C=US/ST=State/L=City/O=Local Dev/OU=Dev/CN=localhost"

## Git Hygiene

- `.gitignore` now ignores `*.pem`, `*.key`, `*.crt`, etc.
- Never commit real private keys. If a key was exposed, treat it as compromised and regenerate.

## Starting Dev Server with HTTPS

VITE_USE_HTTPS=1 npm run dev

If certs are missing you'll see a warning and Vite will fall back to HTTP.

## iOS / Safari Notes

Safari on iOS requires HTTPS unless you're using `localhost`. Using these local certs allows camera APIs to function for barcode scanning.

## Rotation

Repeat mkcert steps anytime you want to rotate credentials. Remove old files securely.

---
Generated on 2025-09-05
