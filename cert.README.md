Development TLS Certificates
============================

Dev certs were intentionally removed from git.

See `docs/local-https.md` for full instructions (mkcert, OpenSSL, env vars, rotation, iOS notes).

Required filenames if placed at root (default):
  cert.pem
  key.pem

Environment override vars:
  VITE_HTTPS_CERT_PATH
  VITE_HTTPS_KEY_PATH

Never commit private keys. If exposed previously, follow `ROTATE_KEYS.md`.
