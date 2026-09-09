#!/usr/bin/env bash
set -u

BASE="http://localhost:4000/api"
WEB="http://localhost:3000"
FAIL=0

login() {
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))"
}

check() {
  NAME="$1"
  URL="$2"
  TOKEN="${3:-}"

  if [ -n "$TOKEN" ]; then
    CODE=$(curl -s -o /tmp/smoke-body.json -w "%{http_code}" \
      -H "Authorization: Bearer $TOKEN" "$URL")
  else
    CODE=$(curl -s -o /tmp/smoke-body.json -w "%{http_code}" "$URL")
  fi

  if [[ "$CODE" == 2* ]]; then
    COUNT=$(python3 - <<'PY'
import json
try:
    data=json.load(open('/tmp/smoke-body.json'))
    print(len(data) if isinstance(data, list) else 'object')
except Exception:
    print('text')
PY
)
    echo "PASS $NAME [$CODE] [$COUNT]"
  else
    echo "FAIL $NAME [$CODE]"
    cat /tmp/smoke-body.json
    FAIL=$((FAIL+1))
  fi
}

echo "Starting Docker..."
docker compose up -d

if ! curl -sf "$BASE/health" >/dev/null; then
  echo "Starting API..."
  fuser -k 4000/tcp 2>/dev/null || true
  pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
  sleep 15
fi

if ! curl -sf "$WEB" >/dev/null; then
  echo "Starting Web..."
  fuser -k 3000/tcp 2>/dev/null || true
  pnpm --filter @dinedo/web dev > /tmp/dinedo-web.log 2>&1 &
  sleep 15
fi

CUSTOMER=$(login "customer.demo@dinedo.local" "Customer123!")
ADMIN=$(login "admin@dinedo.local" "ChangeMe123!")
KITCHEN=$(login "kitchen@dinedo.local" "ChangeMe123!")
RIDER=$(login "rider@dinedo.local" "ChangeMe123!")

echo "Tokens loaded."

check "API health" "$BASE/health"
check "Branches" "$BASE/branches"
check "Tinoc menu" "$BASE/branches/TINOC/menu/items"
check "Customer orders" "$BASE/orders" "$CUSTOMER"
check "Customer reservations" "$BASE/reservations" "$CUSTOMER"
check "Admin dashboard" "$BASE/admin/reports/dashboard-summary?branchCode=TINOC" "$ADMIN"
check "Admin orders" "$BASE/admin/orders" "$ADMIN"
check "Admin inventory" "$BASE/admin/inventory?branchCode=TINOC" "$ADMIN"
check "Admin audit logs" "$BASE/admin/audit-logs?branchCode=TINOC" "$ADMIN"
check "Kitchen queue" "$BASE/kitchen/orders" "$KITCHEN"
check "Rider deliveries" "$BASE/rider/deliveries" "$RIDER"

WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB")
echo "WEB http://localhost:3000 [$WEB_CODE]"

echo "Failures: $FAIL"
exit "$FAIL"
