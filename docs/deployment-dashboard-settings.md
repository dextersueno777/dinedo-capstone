# DineDo Deployment Dashboard Settings

Use this guide when setting up Railway and Vercel.

## GitHub Repository

Repository:

https://github.com/dextersueno777/dinedo-capstone

## Railway Backend API Settings

Create one Railway service for the backend API.

Recommended service name:

dinedo-api

Repository:

dextersueno777/dinedo-capstone

Root directory:

/

Build command:

pnpm install --frozen-lockfile && pnpm --filter @dinedo/api build

Start command:

pnpm --filter @dinedo/api deploy:start

Health check path:

/api/health

Required Railway environment variables:

DATABASE_URL
NODE_ENV
APP_TIMEZONE
WEB_ORIGIN
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET

Recommended values:

NODE_ENV=production
APP_TIMEZONE=Asia/Manila
WEB_ORIGIN=https://your-vercel-url.vercel.app

DATABASE_URL should come from the Railway PostgreSQL database service.

## Railway PostgreSQL Settings

Add PostgreSQL inside the same Railway project.

After adding PostgreSQL, copy or reference its DATABASE_URL in the API service.

After the API service deploys, run these database steps:

1. Prisma migration deploy
2. Seed admin/demo data if the database is new

## Vercel Frontend PWA Settings

Create one Vercel project for the web/PWA.

Repository:

dextersueno777/dinedo-capstone

Framework preset:

Next.js

Build command:

pnpm --filter @dinedo/web build

Install command:

pnpm install --frozen-lockfile

Environment variable:

NEXT_PUBLIC_API_BASE_URL=https://your-railway-api-url/api

After the Railway API URL is final, update this value before the production web deployment.

## Final Deployment Test Links

After deployment, test these:

API health:

https://your-railway-api-url/api/health

API docs:

https://your-railway-api-url/api/docs

PWA frontend:

https://your-vercel-url.vercel.app

## Deployment Order

1. Push latest GitHub code.
2. Create Railway PostgreSQL.
3. Deploy Railway API.
4. Run migrations and seed data.
5. Test API health.
6. Deploy Vercel frontend.
7. Add Railway API URL to Vercel.
8. Test customer, admin, kitchen, and rider accounts.
9. Begin SOS/UAT client testing.
