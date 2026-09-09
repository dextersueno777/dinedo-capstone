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

make_order(){
  curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
    -H "Authorization: Bearer $CUSTOMER" >/dev/null

  curl -s -X POST "$BASE/cart/items" \
    -H "Authorization: Bearer $CUSTOMER" \
    -H "Content-Type: application/json" \
    -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1}" >/dev/null

  post "$BASE/orders/checkout" "$CUSTOMER" \
    "{\"branchCode\":\"TINOC\",\"serviceType\":\"DELIVERY\",\"timingType\":\"IMMEDIATE\",\"addressId\":\"$ADDRESS_ID\",\"paymentMethod\":\"COD\",\"deliveryDistanceKm\":2.5}"
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

ADDRESS_ID=$(curl -s "$BASE/addresses" \
  -H "Authorization: Bearer $CUSTOMER" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

ITEM=$(curl -s "$BASE/branches/TINOC/menu/items" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

echo "Address ID: $ADDRESS_ID"
echo "Menu Item ID: $ITEM"

ORDER1=$(make_order)
ORDER1_ID=$(echo "$ORDER1" | field id)
ORDER1_FEE=$(echo "$ORDER1" | field deliveryFeeStatus)

[ "$ORDER1_FEE" = "PENDING_STAFF_REVIEW" ] \
  && echo "PASS over 1km needs staff review" \
  || bad "staff review status"

FEE_SET=$(patch "$BASE/admin/orders/$ORDER1_ID/delivery-fee" "$ADMIN" \
  '{"additionalDeliveryFeeAmount":30,"adminNotes":"Extra distance fee."}')
FEE_SET_STATUS=$(echo "$FEE_SET" | field deliveryFeeStatus)

[ "$FEE_SET_STATUS" = "PENDING_CUSTOMER_ACCEPTANCE" ] \
  && echo "PASS waiting customer fee approval" \
  || bad "customer approval status"

ACCEPT=$(patch "$BASE/orders/$ORDER1_ID/delivery-fee-response" "$CUSTOMER" \
  '{"accept":true,"notes":"Customer accepts extra fee."}')
ACCEPT_STATUS=$(echo "$ACCEPT" | field deliveryFeeStatus)
ACCEPT_TOTAL=$(echo "$ACCEPT" | field totalAmount)

[ "$ACCEPT_STATUS" = "ACCEPTED" ] \
  && echo "PASS customer accepted fee" \
  || bad "accept fee"

echo "Accepted total: $ACCEPT_TOTAL"

ORDER2=$(make_order)
ORDER2_ID=$(echo "$ORDER2" | field id)

patch "$BASE/admin/orders/$ORDER2_ID/delivery-fee" "$ADMIN" \
  '{"additionalDeliveryFeeAmount":50,"adminNotes":"Extra distance fee."}' >/dev/null

REJECT=$(patch "$BASE/orders/$ORDER2_ID/delivery-fee-response" "$CUSTOMER" \
  '{"accept":false,"notes":"Customer rejects extra fee."}')
REJECT_FEE=$(echo "$REJECT" | field deliveryFeeStatus)
REJECT_STATUS=$(echo "$REJECT" | field status)

[ "$REJECT_FEE" = "REJECTED" ] \
  && echo "PASS customer rejected fee" \
  || bad "reject fee"

[ "$REJECT_STATUS" = "CANCELLED" ] \
  && echo "PASS rejected fee cancels order" \
  || bad "reject should cancel order"

echo "Failures: $FAIL"
exit "$FAIL"
