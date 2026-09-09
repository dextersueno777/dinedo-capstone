#!/usr/bin/env bash
set -u

BASE="http://localhost:4000/api"
FAIL=0

fail() {
  echo "FAIL: $1"
  FAIL=$((FAIL+1))
}

json_key() {
  python3 -c "import sys,json; print(json.load(sys.stdin)$1)"
}

echo "Starting Docker..."
docker compose up -d

if ! curl -sf "$BASE/health" >/dev/null; then
  echo "Starting API..."
  fuser -k 4000/tcp 2>/dev/null || true
  pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
  sleep 15
fi

echo ""
echo "1. Login customer"
CUSTOMER_TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer.demo@dinedo.local","password":"Customer123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

[ -n "$CUSTOMER_TOKEN" ] && echo "PASS customer login" || fail "customer login"

echo ""
echo "2. Get first menu item"
MENU_RESPONSE=$(curl -s "$BASE/branches/TINOC/menu/items")
MENU_ITEM_ID=$(echo "$MENU_RESPONSE" | python3 -c "
import sys,json
data=json.load(sys.stdin)
print(data[0]['id'] if data else '')
")

[ -n "$MENU_ITEM_ID" ] && echo "PASS menu item: $MENU_ITEM_ID" || fail "menu item missing"

echo ""
echo "3. Clear customer cart"
curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" >/tmp/clear-cart.json

echo "Cart clear request sent."

echo ""
echo "4. Add item to cart"
ADD_RESPONSE=$(curl -s -X POST "$BASE/cart/items" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$MENU_ITEM_ID\",\"quantity\":1,\"specialNotes\":\"Write smoke test order.\"}")

echo "$ADD_RESPONSE" | python3 -m json.tool >/tmp/add-cart-pretty.json 2>/dev/null \
  && cat /tmp/add-cart-pretty.json \
  || echo "$ADD_RESPONSE"

echo ""
echo "5. Checkout TAKE_OUT order"
CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE/orders/checkout" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branchCode":"TINOC","serviceType":"TAKE_OUT","timingType":"IMMEDIATE","paymentMethod":"PAY_AT_COUNTER","customerNotes":"Created by order write smoke test."}')

echo "$CHECKOUT_RESPONSE" | python3 -m json.tool >/tmp/checkout-pretty.json 2>/dev/null \
  && cat /tmp/checkout-pretty.json \
  || echo "$CHECKOUT_RESPONSE"

ORDER_NUMBER=$(echo "$CHECKOUT_RESPONSE" | python3 -c "
import sys,json
try:
    data=json.load(sys.stdin)
    print(data.get('orderNumber',''))
except Exception:
    print('')
")

[ -n "$ORDER_NUMBER" ] && echo "PASS checkout order: $ORDER_NUMBER" || fail "checkout failed"

echo ""
echo "Failures: $FAIL"
exit "$FAIL"
