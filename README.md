# DineDo

DineDo is a Progressive Web Application for integrated ordering, table reservation, and delivery management at Dindo's Restaurant - Tinoc Branch.

## Initial Scope

The first implementation focuses on the Tinoc branch. The database will include branch identifiers so that the Lamut branch can be supported later without rebuilding the system.

## Main Modules

1. Customer Module
2. Merchant and Kitchen Module
3. Rider Module
4. Administrator Dashboard

## Local Development Requirements

- Ubuntu WSL
- Node.js 22 LTS
- pnpm 10
- Docker Desktop
- Docker Compose
- PostgreSQL client
- VS Code

## Local Services

Start PostgreSQL and Redis:

pnpm docker:up

Check running services:

docker compose ps

Stop services:

pnpm docker:down

## Important Project Rules

- Initial deployment is for the Tinoc branch.
- Standard online ordering hours are 8:00 AM to 6:00 PM.
- Manual GCash proof upload only.
- Do not implement direct GCash payment gateway integration.
- Do not implement customer-facing live rider GPS tracking.
- Customers receive stored order status updates only.
- Riders may use map-assisted navigation.
- Production uploads must not be stored permanently inside the application container.
