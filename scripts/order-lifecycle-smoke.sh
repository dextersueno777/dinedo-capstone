#!/usr/bin/env bash
set -u

BASE="http://localhost:4000/api"
FAIL=0

bad() {
  echo "FAIL: $1"
  FAIL=$((FAIL+1))
}

login() {
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))"
}

get_json_field() {
  python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('$1',''))"
}

patch_status() {
  LABEL="$1"
  URL="$2"
  TOKEN="$3"
  STATUS="$4"
  NOTES="$5"

  BODY="{\"status\":\"$STATUS\",\"notes\":\"$NOTES\"}"
  RES=$(curl -s -X PATCH "$URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY")

  GOT=$(echo "$RES" | python3 -c "
import sys,json
try:
    print(json.load(sys.stdin).get('status',''))
except Exception:
    print('')
")
  if [ "$GOT" = "$STATUS" ]; then
    echo "PASS $LABEL -> $STATUS"
  else
    echo "Response:"
    echo "$RES" | python3 -m json.tool 2>/dev/null || echo "$RES"
    bad "$LABEL did not become $STATUS"
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

CUSTOMER=$(login "customer.demo@dinedo.local" "Customer123!")
ADMIN=$(login "admin@dinedo.local" "ChangeMe123!")
KITCHEN=$(login "kitchen@dinedo.local" "ChangeMe123!")

[ -n "$CUSTOMER" ] && echo "PASS customer login" || bad "customer login"
[ -n "$ADMIN" ] && echo "PASS admin login" || bad "admin login"
[ -n "$KITCHEN" ] && echo "PASS kitchen login" || bad "kitchen login"

ITEM=$(curl -s "$BASE/branches/TINOC/menu/items" | python3 -c "
import sys,json
data=json.load(sys.stdin)
print(data[0]['id'] if data else '')
")

[ -n "$ITEM" ] && echo "PASS menu item found" || bad "no menu item"

curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
  -H "Authorization: Bearer $CUSTOMER" >/dev/null

curl -s -X POST "$BASE/cart/items" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1}" >/dev/null

ORDER=$(curl -s -X POST "$BASE/orders/checkout" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{"branchCode":"TINOC","serviceType":"TAKE_OUT","timingType":"IMMEDIATE","paymentMethod":"PAY_AT_COUNTER"}')

ORDER_ID=$(echo "$ORDER" | get_json_field id)
ORDER_NO=$(echo "$ORDER" | get_json_field orderNumber)

[ -n "$ORDER_ID" ] && echo "PASS order created: $ORDER_NO" || bad "order create"

patch_status "Admin approve" "$BASE/admin/orders/$ORDER_ID/status" "$ADMIN" "APPROVED" "Approved by lifecycle smoke test."
patch_status "Kitchen cooking" "$BASE/kitchen/orders/$ORDER_ID/status" "$KITCHEN" "COOKING" "Cooking by lifecycle smoke test."
patch_status "Kitchen ready" "$BASE/kitchen/orders/$ORDER_ID/status" "$KITCHEN" "READY_FOR_PICKUP" "Ready by lifecycle smoke test."

echo ""
echo "Final order check:"
curl -s "$BASE/admin/orders/$ORDER_ID" \
  -H "Authorization: Bearer $ADMIN" \
  | python3 -m json.tool | head -n 80

echo ""
echo "Failures: $FAIL"
exit "$FAIL"
