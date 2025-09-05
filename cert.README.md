Local development TLS certificates
=================================

The development HTTPS certificate and key were removed from version control.

Generate fresh self-signed (recommended: mkcert) certificates locally and place them at project root as:

  cert.pem
  key.pem

Quick mkcert instructions:

  mkcert -install
  mkcert localhost 127.0.0.1 ::1

Rename the generated files to cert.pem / key.pem or point to them using env vars (see vite.config.ts notes).

NEVER commit real private keys. Rotate any key that was previously pushed.
