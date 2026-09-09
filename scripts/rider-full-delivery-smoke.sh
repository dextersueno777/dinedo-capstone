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

patch_json(){
  URL="$1"
  TOKEN="$2"
  BODY="$3"
  curl -s -X PATCH "$URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY"
}

post_json(){
  URL="$1"
  TOKEN="$2"
  BODY="$3"
  curl -s -X POST "$URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY"
}

docker compose up -d

if ! curl -sf "$BASE/health" >/dev/null; then
  fuser -k 4000/tcp 2>/dev/null || true
  pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
  sleep 15
fi

CUSTOMER=$(login "customer.demo@dinedo.local" "Customer123!")
ADMIN=$(login "admin@dinedo.local" "ChangeMe123!")
RIDER=$(login "rider@dinedo.local" "ChangeMe123!")

[ -n "$CUSTOMER" ] && echo "PASS customer login" || bad "customer login"
[ -n "$ADMIN" ] && echo "PASS admin login" || bad "admin login"
[ -n "$RIDER" ] && echo "PASS rider login" || bad "rider login"

RIDER_ID=$(curl -s "$BASE/auth/me" \
  -H "Authorization: Bearer $RIDER" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); u=d.get('user', d); print(u.get('id',''))")

ADDRESS_ID=$(curl -s "$BASE/addresses" \
  -H "Authorization: Bearer $CUSTOMER" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

ITEM=$(curl -s "$BASE/branches/TINOC/menu/items" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

echo "Rider ID: $RIDER_ID"
echo "Address ID: $ADDRESS_ID"
echo "Menu Item ID: $ITEM"

[ -n "$RIDER_ID" ] || bad "rider id missing"
[ -n "$ADDRESS_ID" ] || bad "address missing"
[ -n "$ITEM" ] || bad "menu item missing"

echo ""
echo "Create delivery order for full rider test"

curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
  -H "Authorization: Bearer $CUSTOMER" >/dev/null

curl -s -X POST "$BASE/cart/items" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1,\"specialNotes\":\"Full rider smoke test.\"}" >/dev/null

ORDER=$(post_json "$BASE/orders/checkout" "$CUSTOMER" \
  "{\"branchCode\":\"TINOC\",\"serviceType\":\"DELIVERY\",\"timingType\":\"IMMEDIATE\",\"addressId\":\"$ADDRESS_ID\",\"paymentMethod\":\"COD\",\"deliveryDistanceKm\":0.5,\"customerNotes\":\"Full rider flow smoke test.\"}")

ORDER_ID=$(echo "$ORDER" | field id)
ORDER_NO=$(echo "$ORDER" | field orderNumber)

[ -n "$ORDER_ID" ] && echo "PASS order created: $ORDER_NO" || bad "order create"

APPROVED=$(patch_json "$BASE/admin/orders/$ORDER_ID/status" "$ADMIN" \
  '{"status":"APPROVED","notes":"Approved for full rider smoke test."}')

APPROVED_STATUS=$(echo "$APPROVED" | field status)
[ "$APPROVED_STATUS" = "APPROVED" ] \
  && echo "PASS admin approved order" \
  || bad "admin approve"

ASSIGNED=$(patch_json "$BASE/admin/orders/$ORDER_ID/assign-rider" "$ADMIN" \
  "{\"riderId\":\"$RIDER_ID\",\"notes\":\"Assigned for full rider smoke test.\"}")

ASSIGNED_STATUS=$(echo "$ASSIGNED" | field status)
[ "$ASSIGNED_STATUS" = "ASSIGNED_TO_RIDER" ] \
  && echo "PASS rider assigned to order" \
  || bad "assign rider"

DELIVERY_ID=$(curl -s "$BASE/rider/deliveries" \
  -H "Authorization: Bearer $RIDER" \
  | python3 -c "
import sys,json
data=json.load(sys.stdin)
order_id='$ORDER_ID'
match=[d for d in data if d.get('order',{}).get('id')==order_id]
print(match[0]['id'] if match else '')
")

[ -n "$DELIVERY_ID" ] \
  && echo "PASS delivery visible to rider: $DELIVERY_ID" \
  || bad "delivery not visible to rider"

echo ""
echo "Rider accepts and completes delivery"

ACCEPTED=$(patch_json "$BASE/rider/deliveries/$DELIVERY_ID/accept" "$RIDER" '{}')
ACCEPTED_STATUS=$(echo "$ACCEPTED" | field status)

[ "$ACCEPTED_STATUS" = "ACCEPTED" ] \
  && echo "PASS rider accepted delivery" \
  || bad "rider accept"

OUT=$(patch_json "$BASE/rider/deliveries/$DELIVERY_ID/status" "$RIDER" \
  '{"status":"OUT_FOR_DELIVERY","notes":"Rider is now out for delivery."}')
OUT_STATUS=$(echo "$OUT" | field status)

[ "$OUT_STATUS" = "OUT_FOR_DELIVERY" ] \
  && echo "PASS rider out for delivery" \
  || bad "out for delivery"

ARRIVED=$(patch_json "$BASE/rider/deliveries/$DELIVERY_ID/status" "$RIDER" \
  '{"status":"ARRIVED","notes":"Rider has arrived at customer address."}')
ARRIVED_STATUS=$(echo "$ARRIVED" | field status)

[ "$ARRIVED_STATUS" = "ARRIVED" ] \
  && echo "PASS rider arrived" \
  || bad "rider arrived"

PROOF=$(post_json "$BASE/rider/deliveries/$DELIVERY_ID/proofs" "$RIDER" \
  '{"type":"PHOTO","imageUrl":"http://localhost/proofs/full-rider-smoke.jpg","notes":"Proof captured by full rider smoke test."}')
PROOF_STATUS=$(echo "$PROOF" | field status)

[ "$PROOF_STATUS" = "DELIVERED" ] \
  && echo "PASS proof captured and delivered" \
  || bad "proof delivery"

FINAL=$(curl -s "$BASE/rider/deliveries/$DELIVERY_ID" \
  -H "Authorization: Bearer $RIDER")

echo ""
echo "Final delivery:"
echo "$FINAL" | python3 -m json.tool | head -n 100

FINAL_STATUS=$(echo "$FINAL" | field status)
[ "$FINAL_STATUS" = "DELIVERED" ] \
  && echo "PASS final delivery status delivered" \
  || bad "final delivery status"

echo ""
echo "Failures: $FAIL"
exit "$FAIL"
