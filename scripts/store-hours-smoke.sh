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

add_cart_item(){
  curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
    -H "Authorization: Bearer $CUSTOMER" >/dev/null

  curl -s -X POST "$BASE/cart/items" \
    -H "Authorization: Bearer $CUSTOMER" \
    -H "Content-Type: application/json" \
    -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1}" >/dev/null
}

checkout_code(){
  local scheduled="$1"
  local outfile="$2"

  add_cart_item

  curl -s -o "$outfile" -w "%{http_code}" \
    -X POST "$BASE/orders/checkout" \
    -H "Authorization: Bearer $CUSTOMER" \
    -H "Content-Type: application/json" \
    -d "{\"branchCode\":\"TINOC\",\"serviceType\":\"TAKE_OUT\",\"timingType\":\"ADVANCE\",\"scheduledFor\":\"$scheduled\",\"paymentMethod\":\"COD\",\"customerNotes\":\"Store hours smoke test.\"}"
}

docker compose up -d

if ! curl -sf "$BASE/health" >/dev/null; then
  fuser -k 4000/tcp 2>/dev/null || true
  pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
  sleep 15
fi

CUSTOMER=$(login "customer.demo@dinedo.local" "Customer123!")

[ -n "$CUSTOMER" ] && echo "PASS customer login" || bad "customer login"

ITEM=$(curl -s "$BASE/branches/TINOC/menu/items" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

echo "Menu Item ID: $ITEM"
[ -n "$ITEM" ] || bad "menu item missing"

TEST_DATE=$(TZ=Asia/Manila date -d tomorrow +%Y-%m-%d)
INSIDE_TIME="${TEST_DATE}T10:30:00+08:00"
OUTSIDE_TIME="${TEST_DATE}T19:30:00+08:00"

echo "Inside time: $INSIDE_TIME"
echo "Outside time: $OUTSIDE_TIME"

INSIDE_CODE=$(checkout_code "$INSIDE_TIME" /tmp/dinedo-hours-inside.json)
INSIDE_STATUS=$(cat /tmp/dinedo-hours-inside.json | field status)

[ "$INSIDE_CODE" = "201" ] && [ "$INSIDE_STATUS" = "PENDING" ] \
  && echo "PASS order allowed inside 08:00-18:00" \
  || bad "inside-hours checkout should pass"

OUTSIDE_CODE=$(checkout_code "$OUTSIDE_TIME" /tmp/dinedo-hours-outside.json)

[ "$OUTSIDE_CODE" = "400" ] \
  && echo "PASS order blocked outside 08:00-18:00" \
  || bad "outside-hours checkout should be blocked"

echo "Blocked response:"
cat /tmp/dinedo-hours-outside.json
echo ""

echo "Failures: $FAIL"
exit "$FAIL"
