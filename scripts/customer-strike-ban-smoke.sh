#!/usr/bin/env bash
set -u

BASE="http://localhost:4000/api"
FAIL=0
STAMP=$(date +%s)
TEST_EMAIL="strike.test.$STAMP@dinedo.local"
TEST_PASSWORD="StrikeTest123!"

bad(){ echo "FAIL: $1"; FAIL=$((FAIL+1)); }

field(){
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))"
}

login(){
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))"
}

docker compose up -d

if ! curl -sf "$BASE/health" >/dev/null; then
  fuser -k 4000/tcp 2>/dev/null || true
  pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
  sleep 15
fi

ADMIN=$(login "admin@dinedo.local" "ChangeMe123!")

[ -n "$ADMIN" ] && echo "PASS admin login" || bad "admin login"

REGISTER=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Strike\",\"lastName\":\"Tester\",\"phoneNumber\":\"09999999999\"}")

CUSTOMER=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

[ -n "$CUSTOMER" ] && echo "PASS test customer registered" || bad "customer register"

CUSTOMER_ID=$(echo "$REGISTER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))")

ITEM=$(curl -s "$BASE/branches/TINOC/menu/items" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

echo "Test customer: $TEST_EMAIL"
echo "Customer ID: $CUSTOMER_ID"
echo "Menu Item ID: $ITEM"

[ -n "$CUSTOMER_ID" ] || bad "customer id missing"
[ -n "$ITEM" ] || bad "menu item missing"

make_order(){
  local n="$1"
  local test_date
  local scheduled

  test_date=$(TZ=Asia/Manila date -d tomorrow +%Y-%m-%d)
  scheduled="${test_date}T10:30:00+08:00"

  curl -s -X DELETE "$BASE/cart?branchCode=TINOC" \
    -H "Authorization: Bearer $CUSTOMER" >/dev/null

  curl -s -X POST "$BASE/cart/items" \
    -H "Authorization: Bearer $CUSTOMER" \
    -H "Content-Type: application/json" \
    -d "{\"branchCode\":\"TINOC\",\"menuItemId\":\"$ITEM\",\"quantity\":1}" >/dev/null

  curl -s -X POST "$BASE/orders/checkout" \
    -H "Authorization: Bearer $CUSTOMER" \
    -H "Content-Type: application/json" \
    -d "{\"branchCode\":\"TINOC\",\"serviceType\":\"TAKE_OUT\",\"timingType\":\"ADVANCE\",\"scheduledFor\":\"$scheduled\",\"paymentMethod\":\"COD\",\"customerNotes\":\"Strike smoke order $n.\"}"
}

for n in 1 2 3; do
  ORDER=$(make_order "$n")
  ORDER_ID=$(echo "$ORDER" | field id)
  ORDER_NO=$(echo "$ORDER" | field orderNumber)

  [ -n "$ORDER_ID" ] && echo "PASS order $n created: $ORDER_NO" || bad "order $n create"

  CANCELLED=$(curl -s -X PATCH "$BASE/admin/orders/$ORDER_ID/status" \
    -H "Authorization: Bearer $ADMIN" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"CANCELLED\",\"reason\":\"Bogus buyer strike $n.\",\"notes\":\"Strike smoke test.\",\"issueCustomerStrike\":true,\"strikeReason\":\"Bogus buyer strike $n.\"}")

  STATUS=$(echo "$CANCELLED" | field status)

  [ "$STATUS" = "CANCELLED" ] \
    && echo "PASS strike $n issued through cancellation" \
    || bad "strike $n cancellation"
done

DB_URL=$(grep '^DATABASE_URL=' .env | cut -d= -f2- | sed 's/[?].*$//')

STRIKE_COUNT=$(psql "$DB_URL" -tAc \
  "SELECT COUNT(*) FROM \"CustomerStrike\" WHERE \"customerId\" = '$CUSTOMER_ID' AND \"deletedAt\" IS NULL;")

USER_STATUS=$(psql "$DB_URL" -tAc \
  "SELECT \"status\" FROM \"User\" WHERE \"id\" = '$CUSTOMER_ID';")

echo "Strike count: $STRIKE_COUNT"
echo "User status: $USER_STATUS"

[ "$STRIKE_COUNT" = "3" ] && echo "PASS three strikes recorded" || bad "strike count"
[ "$USER_STATUS" = "BANNED" ] && echo "PASS customer banned at 3 strikes" || bad "customer ban"

LOGIN_CODE=$(curl -s -o /tmp/dinedo-banned-login.json -w "%{http_code}" \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

[ "$LOGIN_CODE" = "401" ] \
  && echo "PASS banned customer cannot login" \
  || bad "banned login should fail"

echo "Banned login response:"
cat /tmp/dinedo-banned-login.json
echo ""

echo "Failures: $FAIL"
exit "$FAIL"
