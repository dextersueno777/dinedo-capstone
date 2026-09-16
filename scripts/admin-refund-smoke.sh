#!/usr/bin/env bash
set -u

BASE="http://localhost:4000/api"
FAIL=0

bad(){ echo "FAIL: $1"; FAIL=$((FAIL+1)); }

json_get(){
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))"
}

docker compose up -d

if ! curl -sf "$BASE/health" >/dev/null; then
  fuser -k 4000/tcp 2>/dev/null || true
  pnpm --filter @dinedo/api start:dev > /tmp/dinedo-api.log 2>&1 &
  sleep 15
fi

echo "Creating pending refund..."
bash scripts/gcash-refund-smoke.sh || bad "create pending refund"

ADMIN_TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dinedo.local","password":"ChangeMe123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

[ -n "$ADMIN_TOKEN" ] && echo "PASS admin login" || bad "admin login"

curl -s "$BASE/admin/refunds?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  > /tmp/dinedo-admin-refunds.json

REFUND_ID=$(python3 - <<'PY'
import json
d=json.load(open("/tmp/dinedo-admin-refunds.json"))
print(d[0]["id"] if isinstance(d,list) and d else "")
PY
)

[ -n "$REFUND_ID" ] && echo "PASS pending refund found: $REFUND_ID" || bad "pending refund missing"

APPROVED=$(curl -s -X PATCH "$BASE/admin/refunds/$REFUND_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","adminNotes":"Approved for manual GCash refund."}')

APPROVED_STATUS=$(echo "$APPROVED" | json_get status)
APPROVED_PAYMENT=$(echo "$APPROVED" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('order',{}).get('paymentState',''))")

[ "$APPROVED_STATUS" = "APPROVED" ] && echo "PASS refund approved" || bad "refund approve"
[ "$APPROVED_PAYMENT" = "REFUND_PENDING" ] && echo "PASS order refund pending" || bad "order refund pending"

COMPLETED=$(curl -s -X PATCH "$BASE/admin/refunds/$REFUND_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"COMPLETED","adminNotes":"Manual GCash refund completed.","gcashReferenceNumber":"GCASH-REFUND-SMOKE-001"}')

DONE_STATUS=$(echo "$COMPLETED" | json_get status)
DONE_REF=$(echo "$COMPLETED" | json_get gcashReferenceNumber)
DONE_PAYMENT=$(echo "$COMPLETED" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('order',{}).get('paymentState',''))")

[ "$DONE_STATUS" = "COMPLETED" ] && echo "PASS refund completed" || bad "refund complete"
[ "$DONE_REF" = "GCASH-REFUND-SMOKE-001" ] && echo "PASS refund GCash reference saved" || bad "refund ref"
[ "$DONE_PAYMENT" = "REFUNDED" ] && echo "PASS order marked refunded" || bad "order refunded"

echo "Failures: $FAIL"
exit "$FAIL"
