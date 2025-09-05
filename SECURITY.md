# Security Policy

## Supported Branches
Active development: `master`

## Reporting a Vulnerability
Open a private issue or email the maintainer (replace with contact) for:
- Potential data exposure
- Dependency CVEs
- Authentication or authorization bypass

## Secret & Key Handling
- Never commit private keys, API tokens, or credentials.
- Dev TLS certs excluded via `.gitignore` (`*.pem`, `*.key`, etc.).
- Use environment variables or local config files ignored by git.

## If a Secret Was Committed
1. Remove it and add proper ignore pattern.
2. Rotate/regenerate the secret.
3. Purge from history (see `ROTATE_KEYS.md`).
4. Add/confirm pre-commit secret scanning is enabled.

## Pre-Commit Secret Scanning
Implemented with `detect-secrets`. See `docs/secrets-scanning.md`.
To enable locally:
```
pip install detect-secrets pre-commit
pre-commit install
```

## HTTPS for Camera Features
- iOS Safari requires HTTPS unless using `localhost`.
- Use mkcert (see `docs/local-https.md`).

## Dependency Updates
Run periodically:
```
npm outdated
npm audit
```
Apply patches via minor/patch updates; evaluate major updates individually.

## Recommended Hardening (Future)
- CSP headers via reverse proxy
- Service worker integrity checks
- Subresource Integrity (SRI) for any CDN imports
- Automated GitHub Action for secret scanning & dependency audit

---
Generated 2025-09-05
