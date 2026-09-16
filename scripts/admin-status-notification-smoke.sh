#!/usr/bin/env bash
set -u

BASE="http://localhost:4000/api"
FAIL=0
bad(){ echo "FAIL: $1"; FAIL=$((FAIL+1)); }
field(){ python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))"; }

docker compose up -d
fuser -k 4000/tcp 2>/dev/null || true
pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
sleep 15

CUSTOMER=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer.demo@dinedo.local","password":"Customer123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

ADMIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dinedo.local","password":"ChangeMe123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

[ -n "$CUSTOMER" ] && echo "PASS customer login" || bad "customer login"
[ -n "$ADMIN" ] && echo "PASS admin login" || bad "admin login"

ITEM=$(curl -s "$BASE/branches/TINOC/menu/items" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
  -H "Authorization: Bearer $CUSTOMER" >/dev/null

curl -s -X POST "$BASE/cart/items" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1}" >/dev/null

DATE=$(TZ=Asia/Manila date -d tomorrow +%Y-%m-%d)
ORDER=$(curl -s -X POST "$BASE/orders/checkout" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d "{\"branchCode\":\"TINOC\",\"serviceType\":\"TAKE_OUT\",\"timingType\":\"ADVANCE\",\"scheduledFor\":\"${DATE}T10:30:00+08:00\",\"paymentMethod\":\"COD\",\"customerNotes\":\"Notification smoke test.\"}")

ORDER_ID=$(echo "$ORDER" | field id)
ORDER_NO=$(echo "$ORDER" | field orderNumber)

[ -n "$ORDER_ID" ] && echo "PASS order created: $ORDER_NO" || bad "order create"

UPDATED=$(curl -s -X PATCH "$BASE/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","reason":"Notification smoke test.","notes":"Customer should be notified."}')

STATUS=$(echo "$UPDATED" | field status)
[ "$STATUS" = "APPROVED" ] && echo "PASS admin updated status" || bad "admin status update"

DB_URL=$(grep '^DATABASE_URL=' .env | cut -d= -f2- | sed 's/[?].*$//')
COUNT=$(psql "$DB_URL" -tAc \
  "SELECT COUNT(*) FROM \"Notification\" WHERE \"orderId\" = '$ORDER_ID' AND \"type\" = 'ORDER_STATUS' AND \"deletedAt\" IS NULL;")

echo "Notification count: $COUNT"
[ "$COUNT" = "1" ] && echo "PASS order status notification created" || bad "notification missing"

echo "Failures: $FAIL"
exit "$FAIL"
