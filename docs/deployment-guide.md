# DineDo Deployment Guide

This guide prepares DineDo for deployment.

## Recommended Setup

Use separate services:

1. PostgreSQL database
2. DineDo API service
3. DineDo Web/PWA service

## API Service

Root directory:

apps/api

Build command:

pnpm install --frozen-lockfile
pnpm --filter @dinedo/api build

Start command:

pnpm --filter @dinedo/api deploy:start

Alternative start command if migrations are already applied:

pnpm --filter @dinedo/api start:prod

Required environment variables:

DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
WEB_ORIGIN
API_PORT or PORT
APP_TIMEZONE

Recommended production values:

NODE_ENV=production
APP_TIMEZONE=Asia/Manila
WEB_ORIGIN=https://your-web-domain.com

## Web Service

Root directory:

apps/web

Build command:

pnpm install --frozen-lockfile
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api pnpm --filter @dinedo/web build

Start command:

pnpm --filter @dinedo/web start:prod

Required environment variable:

NEXT_PUBLIC_API_BASE_URL

Example:

NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api

## Database

Before running the API in production, apply migrations:

pnpm --filter @dinedo/api db:migrate:deploy

Seed only when setting up a fresh demo database:

pnpm --filter @dinedo/api db:seed
pnpm --filter @dinedo/api db:seed:branch-data

## CORS Rule

The API must have WEB_ORIGIN set to the deployed web URL.

Example:

WEB_ORIGIN=https://your-web-domain.com

## Final Local Check Before Deployment

pnpm --filter @dinedo/api build
pnpm --filter @dinedo/web build
bash scripts/read-smoke.sh
bash scripts/order-lifecycle-smoke.sh
bash scripts/customer-cancel-smoke.sh
bash scripts/delivery-fee-smoke.sh
bash scripts/rider-full-delivery-smoke.sh

Expected smoke test result:

Failures: 0
