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

curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
  -H "Authorization: Bearer $CUSTOMER" >/dev/null

curl -s -X POST "$BASE/cart/items" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1}" >/dev/null

ORDER=$(curl -s -X POST "$BASE/orders/checkout" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{"branchCode":"TINOC","serviceType":"DELIVERY","timingType":"IMMEDIATE","addressId":"cmtfq295200012zjuz8i05rp0","paymentMethod":"GCASH_MANUAL","deliveryDistanceKm":0.5,"customerNotes":"GCash refund smoke test."}')

ORDER_ID=$(echo "$ORDER" | field id)
ORDER_NO=$(echo "$ORDER" | field orderNumber)

[ -n "$ORDER_ID" ] && echo "PASS GCash order created: $ORDER_NO" || bad "gcash order create"

PROOF=$(curl -s -X POST "$BASE/orders/$ORDER_ID/payment-proofs" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{"amount":120,"proofImageUrl":"http://localhost/proofs/gcash-smoke.jpg","gcashReferenceNumber":"GCASH-SMOKE-001","payerName":"Demo Customer","payerAccountLast4":"6789"}')

PROOF_ID=$(echo "$PROOF" | field id)
PROOF_STATUS=$(echo "$PROOF" | field status)

[ "$PROOF_STATUS" = "PENDING_REVIEW" ] \
  && echo "PASS payment proof submitted" \
  || bad "payment proof submit"

REVIEW=$(curl -s -X PATCH "$BASE/admin/payment-proofs/$PROOF_ID/review" \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","reviewNotes":"Approved GCash proof for refund smoke test."}')

REVIEW_STATUS=$(echo "$REVIEW" | field status)

[ "$REVIEW_STATUS" = "APPROVED" ] \
  && echo "PASS admin approved payment proof" \
  || bad "payment proof approve"

CANCELLED=$(curl -s -X PATCH "$BASE/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CANCELLED","reason":"Incident cancellation with paid GCash order.","notes":"Auto refund should be created."}')

CANCELLED_STATUS=$(echo "$CANCELLED" | field status)

[ "$CANCELLED_STATUS" = "CANCELLED" ] \
  && echo "PASS admin cancelled paid GCash order" \
  || bad "admin cancel paid gcash"

DB_URL=$(grep '^DATABASE_URL=' .env | cut -d= -f2- | sed 's/[?].*$//')

REFUND_COUNT=$(psql "$DB_URL" -tAc \
  "SELECT COUNT(*) FROM \"Refund\" WHERE \"orderId\" = '$ORDER_ID' AND \"deletedAt\" IS NULL;")

echo "Refund count: $REFUND_COUNT"

[ "$REFUND_COUNT" = "1" ] \
  && echo "PASS pending refund auto-created" \
  || bad "refund was not auto-created"

echo "Failures: $FAIL"
exit "$FAIL"
