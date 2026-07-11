# Turborepo Integration Guide

This app ships with `turbo.json` at the root and is ready to drop into a Turborepo monorepo.

## Monorepo structure

```
my-monorepo/
├── turbo.json            # root turbo config (copy from this repo)
├── package.json          # workspaces: ["apps/*", "packages/*"]
├── apps/
│   └── ai-sandbox/       # this app
└── packages/
    ├── sandbox-types/    # extract from src/lib/sandbox-types.ts
    └── ui/               # extract from src/components/ui/
```

## Steps

1. Move this repo into `apps/ai-sandbox/`
2. Root `package.json`:
   ```json
   { "workspaces": ["apps/*", "packages/*"] }
   ```
3. Run: `turbo dev --filter=ai-sandbox`

## Environment variables

Copy `.env.local.example` and fill in:
- `VITE_CONVEX_URL`
- `VITE_HERCULES_OIDC_AUTHORITY`
- `VITE_HERCULES_OIDC_CLIENT_ID`

## Secrets (backend only)

Set in Hercules dashboard > Advanced > Secrets:
- `HERCULES_API_KEY` — for AI generation
- `GITHUB_TOKEN` — for GitHub push/import (PAT with `repo` scope)
