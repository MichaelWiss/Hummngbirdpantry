# Private Key Exposure Remediation

A private key was previously committed. Treat it as compromised.

## 1. Remove from Current Tree
The tracked `key.pem` and `cert.pem` have been deleted and ignored via `.gitignore`.

## 2. Purge from Git History
Run (pick one of the modern tools):

### Using git filter-repo (recommended)
```
brew install git-filter-repo  # if not installed
git filter-repo --invert-paths --path key.pem --path cert.pem
```
Push rewritten history (force-with-lease):
```
git push --force-with-lease origin master
```
Notify collaborators to re-clone or run:
```
git fetch --all --prune
```

### Using BFG Repo-Cleaner (alternative)
```
java -jar bfg.jar --delete-files key.pem --delete-files cert.pem
```
Then run standard cleanup steps.

## 3. Invalidate / Rotate
If the key was ever used beyond local dev, generate new certs and revoke/stop using the old ones.

## 4. Add Protective Patterns
`.gitignore` already contains patterns for `*.pem`, `*.key`, `*.crt`, etc.

## 5. Pre-Commit Safeguards (Optional)
Add a secret scanning pre-commit hook (e.g., `detect-secrets`, `git-secrets`, or GitHub Advanced Security).

Example with detect-secrets:
```
pip install detect-secrets
pre-commit install
```
Add `.pre-commit-config.yaml` with a detect-secrets hook if desired.

## 6. Verify Removal
After history rewrite:
```
git log -p | grep -i -- 'BEGIN PRIVATE KEY' || echo 'No keys found'
```
Remote check (GitHub UI) to confirm blobs are gone.

## 7. Educate Team
Share guidance: never commit private keys; use environment variables or ignored files.

---
Generated on 2025-09-05
