# Secret Scanning

This project uses `detect-secrets` via pre-commit to block accidental commits of secrets.

## Setup

1. Install dependencies (Python 3 required for detect-secrets):
   pip install detect-secrets
2. Install pre-commit hooks:
   pre-commit install

## Workflow

- On each commit, `detect-secrets` scans changed files against `.secrets.baseline`.
- If potential secrets are found, the commit is blocked until audited.

## Commands

Scan entire repo and create a new candidate baseline (manual review required):
```
npx detect-secrets scan > .secrets.new
npx detect-secrets audit .secrets.new
```
(Replace the existing `.secrets.baseline` only after confirming findings are false positives.)

Audit existing baseline entries (after updating baseline):
```
npx detect-secrets audit .secrets.baseline
```

## Adding New Allowed Secrets
Never add real secrets. For test keys, prefer environment variables or mock values.

## Regenerating Baseline
```
npx detect-secrets scan > .secrets.baseline
```
Then audit:
```
npx detect-secrets audit .secrets.baseline
```

## Preventing PEM Commits
A custom hook blocks files containing `BEGIN PRIVATE KEY` with PEM extensions.

## CI Integration (Optional)
Add a job step:
```
detect-secrets scan --baseline .secrets.baseline
```
Fail the build if exit status non-zero.

---
Generated 2025-09-05
