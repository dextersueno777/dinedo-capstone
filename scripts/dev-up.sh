#!/usr/bin/env bash
set -u

API_URL="http://localhost:4000/api/health"
WEB_URL="http://localhost:3000"

echo "Starting DineDo local development..."

echo ""
echo "1. Starting Docker services..."
docker compose up -d

echo ""
echo "2. Stopping old API/Web servers..."
fuser -k 4000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

echo ""
echo "3. Starting NestJS API..."
pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
API_PID=$!

echo ""
echo "4. Starting Next.js PWA..."
pnpm --filter @dinedo/web dev > /tmp/dinedo-web.log 2>&1 &
WEB_PID=$!

echo ""
echo "5. Waiting for servers..."
sleep 18

echo ""
echo "6. Checking API..."
if curl -sf "$API_URL" >/tmp/dinedo-health.json; then
  echo "API is running at http://localhost:4000"
  cat /tmp/dinedo-health.json
  echo ""
else
  echo "API failed to start."
  echo "Last API log lines:"
  tail -n 40 /tmp/dinedo-api.log
  exit 1
fi

echo ""
echo "7. Checking Web..."
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")
if [[ "$WEB_CODE" == 2* || "$WEB_CODE" == 3* ]]; then
  echo "Web is running at http://localhost:3000"
else
  echo "Web failed to start. HTTP $WEB_CODE"
  echo "Last Web log lines:"
  tail -n 40 /tmp/dinedo-web.log
  exit 1
fi

echo ""
echo "DineDo is ready."
echo "Website: http://localhost:3000"
echo ""
echo "Admin:"
echo "admin@dinedo.local"
echo "ChangeMe123!"
echo ""
echo "Customer:"
echo "customer.demo@dinedo.local"
echo "Customer123!"
echo ""
echo "Kitchen:"
echo "kitchen@dinedo.local"
echo "ChangeMe123!"
echo ""
echo "Rider:"
echo "rider@dinedo.local"
echo "ChangeMe123!"
echo ""
echo "API PID: $API_PID"
echo "WEB PID: $WEB_PID"
echo "API logs: /tmp/dinedo-api.log"
echo "WEB logs: /tmp/dinedo-web.log"
