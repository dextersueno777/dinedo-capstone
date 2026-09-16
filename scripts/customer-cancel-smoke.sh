#!/usr/bin/env bash
set -u

BASE="http://localhost:4000/api"
FAIL=0

bad(){ echo "FAIL: $1"; FAIL=$((FAIL+1)); }

login(){
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))"
}

field(){
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))"
}

post(){
  curl -s -X POST "$1" \
    -H "Authorization: Bearer $2" \
    -H "Content-Type: application/json" \
    -d "$3"
}

patch(){
  curl -s -X PATCH "$1" \
    -H "Authorization: Bearer $2" \
    -H "Content-Type: application/json" \
    -d "$3"
}

make_takeout_order(){
  curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
    -H "Authorization: Bearer $CUSTOMER" >/dev/null

  curl -s -X POST "$BASE/cart/items" \
    -H "Authorization: Bearer $CUSTOMER" \
    -H "Content-Type: application/json" \
    -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1}" >/dev/null

  post "$BASE/orders/checkout" "$CUSTOMER" \
    '{"branchCode":"TINOC","serviceType":"TAKE_OUT","timingType":"IMMEDIATE","paymentMethod":"COD","customerNotes":"Customer cancel smoke test."}'
}

docker compose up -d

if ! curl -sf "$BASE/health" >/dev/null; then
  fuser -k 4000/tcp 2>/dev/null || true
  pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
  sleep 15
fi

CUSTOMER=$(login "customer.demo@dinedo.local" "Customer123!")
ADMIN=$(login "admin@dinedo.local" "ChangeMe123!")

[ -n "$CUSTOMER" ] && echo "PASS customer login" || bad "customer login"
[ -n "$ADMIN" ] && echo "PASS admin login" || bad "admin login"

ITEM=$(curl -s "$BASE/branches/TINOC/menu/items" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

echo "Menu Item ID: $ITEM"
[ -n "$ITEM" ] || bad "menu item missing"

ORDER1=$(make_takeout_order)
ORDER1_ID=$(echo "$ORDER1" | field id)
ORDER1_STATUS=$(echo "$ORDER1" | field status)

[ "$ORDER1_STATUS" = "PENDING" ] \
  && echo "PASS pending order created" \
  || bad "pending order create"

CANCELLED=$(patch "$BASE/orders/$ORDER1_ID/cancel" "$CUSTOMER" \
  '{"cancellationReason":"Customer changed mind before preparation."}')
CANCELLED_STATUS=$(echo "$CANCELLED" | field status)

[ "$CANCELLED_STATUS" = "CANCELLED" ] \
  && echo "PASS customer cancelled pending order" \
  || bad "customer cancel pending"

ORDER2=$(make_takeout_order)
ORDER2_ID=$(echo "$ORDER2" | field id)

APPROVED=$(patch "$BASE/admin/orders/$ORDER2_ID/status" "$ADMIN" \
  '{"status":"APPROVED","notes":"Approved before customer cancel attempt."}')
APPROVED_STATUS=$(echo "$APPROVED" | field status)

[ "$APPROVED_STATUS" = "APPROVED" ] \
  && echo "PASS second order approved" \
  || bad "approve second order"

HTTP_CODE=$(curl -s -o /tmp/dinedo-cancel-after-approved.json -w "%{http_code}" \
  -X PATCH "$BASE/orders/$ORDER2_ID/cancel" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{"cancellationReason":"Trying to cancel after approval."}')

[ "$HTTP_CODE" = "400" ] \
  && echo "PASS approved order cannot be cancelled by customer" \
  || bad "approved cancel should be blocked"

echo "Blocked response:"
cat /tmp/dinedo-cancel-after-approved.json
echo ""

echo "Failures: $FAIL"
exit "$FAIL"
