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

fuser -k 4000/tcp 2>/dev/null || true
pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
sleep 18

CUSTOMER=$(login "customer.demo@dinedo.local" "Customer123!")
ADMIN=$(login "admin@dinedo.local" "ChangeMe123!")
RIDER=$(login "rider@dinedo.local" "ChangeMe123!")

[ -n "$CUSTOMER" ] && echo "PASS customer login" || bad "customer login"
[ -n "$ADMIN" ] && echo "PASS admin login" || bad "admin login"
[ -n "$RIDER" ] && echo "PASS rider login" || bad "rider login"

RIDER_ID=$(curl -s "$BASE/auth/me" \
  -H "Authorization: Bearer $RIDER" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
u=d.get('user', d)
print(u.get('id',''))
")
echo "Rider ID: $RIDER_ID"

ADDRESS_ID=$(curl -s "$BASE/addresses" \
  -H "Authorization: Bearer $CUSTOMER" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

if [ -z "$ADDRESS_ID" ]; then
  ADDRESS_ID=$(curl -s -X POST "$BASE/addresses" \
    -H "Authorization: Bearer $CUSTOMER" \
    -H "Content-Type: application/json" \
    -d '{"label":"Smoke Home","recipient":"Demo Customer","phoneNumber":"09123456789","line1":"Tinoc Test Address","barangay":"Poblacion","municipality":"Tinoc","province":"Ifugao","landmark":"Near Dindo"}' \
    | field id)
fi
echo "Address ID: $ADDRESS_ID"

ITEM=$(curl -s "$BASE/branches/TINOC/menu/items" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")
echo "Menu Item ID: $ITEM"

curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
  -H "Authorization: Bearer $CUSTOMER" >/dev/null

curl -s -X POST "$BASE/cart/items" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1}" >/dev/null

ORDER=$(curl -s -X POST "$BASE/orders/checkout" \
  -H "Authorization: Bearer $CUSTOMER" \
  -H "Content-Type: application/json" \
  -d "{\"branchCode\":\"TINOC\",\"serviceType\":\"DELIVERY\",\"timingType\":\"IMMEDIATE\",\"addressId\":\"$ADDRESS_ID\",\"paymentMethod\":\"COD\",\"deliveryDistanceKm\":0.5}")

ORDER_ID=$(echo "$ORDER" | field id)
ORDER_NO=$(echo "$ORDER" | field orderNumber)

[ -n "$ORDER_ID" ] && echo "PASS delivery order: $ORDER_NO" || bad "delivery order"

curl -s -X PATCH "$BASE/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","notes":"Approved before rider assignment."}' >/dev/null

ASSIGNED=$(curl -s -X PATCH "$BASE/admin/orders/$ORDER_ID/assign-rider" \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d "{\"riderId\":\"$RIDER_ID\",\"notes\":\"Assigned by smoke test.\"}")

echo "$ASSIGNED" | python3 -m json.tool | head -n 60

RIDERS=$(curl -s "$BASE/rider/deliveries" \
  -H "Authorization: Bearer $RIDER")

echo "$RIDERS" | python3 -m json.tool | head -n 80

FOUND=$(echo "$RIDERS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('yes' if any(x.get('order',{}).get('id')=='$ORDER_ID' for x in d) else '')
")

[ "$FOUND" = "yes" ] && echo "PASS rider can see delivery" || bad "rider cannot see delivery"

echo "Failures: $FAIL"
exit "$FAIL"
