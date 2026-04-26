# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: DataMart GH Reseller Portal

A customer-facing data bundle purchase website that proxies the DataMart GH API.

### Architecture

- **Frontend** (`artifacts/datamart-dashboard`): React + Vite, served at `/`
- **Backend** (`artifacts/api-server`): Express proxy server at `/api`
  - Proxies all requests to `https://api.datamartgh.shop/api/developer`
  - Uses `DATAMART_API_KEY` secret for authentication

### Pages

- `/` — Home: browse data packages by network (YELLO/MTN, TELECEL, AT_PREMIUM) and purchase
- `/bulk` — Bulk Purchase: submit up to 50 orders at once
- `/order/:reference` — Order status check
- `/tracker` — Live delivery tracker (polls every 15s)
- `/history` — Purchase history with pagination
- `/stats` — Usage statistics dashboard + Referral Bonus claim
- `/withdrawals` — Create and track mobile money withdrawals
- `/transactions` — Transaction history

### Backend Routes

All routes are proxied from `/api/*` to DataMart API:
- `GET /api/packages` — list available packages
- `POST /api/purchase` — single data purchase
- `POST /api/bulk-purchase` — bulk purchase (up to 50)
- `GET /api/orders/:reference` — order status
- `GET /api/purchase-history` — paginated purchase history
- `GET /api/delivery-tracker` — live delivery status
- `GET /api/account/balance` — wallet balance
- `GET /api/account/transactions` — transaction list
- `POST /api/claim-referral-bonus` — claim referral bonus
- `GET /api/stats` — usage statistics
- `POST /api/withdrawals` — create withdrawal (HMAC-signed)
- `GET /api/withdrawals/:reference` — withdrawal status

### Configuration Required

Set the `DATAMART_API_KEY` secret (from DataMart GH developer portal) to enable live data.

Withdrawal requests also require `DATAMART_SIGNING_SECRET` for HMAC-SHA256 request signing.

### Codegen Note

After editing `lib/api-spec/openapi.yaml`, run codegen to regenerate hooks and Zod schemas. The codegen script includes a post-patch step (`patch-zod-barrel.mjs`) that strips duplicate type exports from the Zod barrel file to prevent TypeScript name conflicts.

### DataMart API

Base URL: `https://api.datamartgh.shop/api/developer`  
Auth: `X-API-Key` header

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
