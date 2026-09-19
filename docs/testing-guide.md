# DineDo Testing Guide

This guide lists the local checks used to verify the DineDo system.

## Test Accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | customer.demo@dinedo.local | Customer123! |
| Admin | admin@dinedo.local | ChangeMe123! |
| Kitchen | kitchen@dinedo.local | ChangeMe123! |
| Rider | rider@dinedo.local | ChangeMe123! |

## Local URLs

- Web: http://localhost:3000
- API: http://localhost:4000/api
- API Docs: http://localhost:4000/docs

## Start Local Services

docker compose up -d
pnpm --filter @dinedo/api start:dev
pnpm --filter @dinedo/web dev

## Quality Checks

pnpm --filter @dinedo/api typecheck
pnpm --filter @dinedo/api build
pnpm --filter @dinedo/web typecheck
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api pnpm --filter @dinedo/web build

## Smoke Tests

1. Read smoke test:
bash scripts/read-smoke.sh

2. Order lifecycle smoke test:
bash scripts/order-lifecycle-smoke.sh

3. Customer cancellation smoke test:
bash scripts/customer-cancel-smoke.sh

4. Delivery fee smoke test:
bash scripts/delivery-fee-smoke.sh

5. Full rider delivery smoke test:
bash scripts/rider-full-delivery-smoke.sh

## Final Regression Command

pnpm --filter @dinedo/api typecheck
pnpm --filter @dinedo/api build
pnpm --filter @dinedo/web typecheck
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api pnpm --filter @dinedo/web build
bash scripts/read-smoke.sh
bash scripts/order-lifecycle-smoke.sh
bash scripts/customer-cancel-smoke.sh
bash scripts/delivery-fee-smoke.sh
bash scripts/rider-full-delivery-smoke.sh

Expected result for smoke tests:

Failures: 0
