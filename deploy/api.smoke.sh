#!/usr/bin/env bash
# Smoke test for the staff API: auth, RBAC, queue, decisions, undo.
set -u
API=http://127.0.0.1:8787/api/v1
XHR='-H "X-Requested-With: XMLHttpRequest"'
pass=0; fail=0
check() { # check <label> <expected> <actual>
  if [ "$2" = "$3" ]; then echo "PASS  $1 ($3)"; pass=$((pass+1));
  else echo "FAIL  $1 — expected $2, got $3"; fail=$((fail+1)); fi
}
code() { curl -s -o /tmp/body.json -w '%{http_code}' "$@"; }
jq_get() {
  node -e "const d=require('/tmp/body.json'); let v=d; for (const k of '$1'.split('.')) v = v?.[k];
    if (v === undefined) console.log('undefined');
    else if (v === null) console.log('null');
    else if (typeof v === 'object') console.log('object');
    else console.log(String(v));" 2>/dev/null
}

# --- login (all three roles)
MOD=$(code -X POST "$API/auth/login" -H 'content-type: application/json' -H 'X-Requested-With: XMLHttpRequest' \
  -d '{"email":"mod@snagchat.io","password":"SnagChat!Mod1"}' -c /tmp/cj_mod.txt)
check "moderator login" 200 "$MOD"
check "moderator role" "moderator" "$(jq_get staff.role)"

BAD=$(code -X POST "$API/auth/login" -H 'content-type: application/json' -H 'X-Requested-With: XMLHttpRequest' \
  -d '{"email":"mod@snagchat.io","password":"wrong-password"}')
check "wrong password rejected" 401 "$BAD"

ME=$(code "$API/auth/me" -b /tmp/cj_mod.txt)
check "session cookie accepted" 200 "$ME"
check "unauthenticated /me" 401 "$(code "$API/auth/me")"

ADM=$(code -X POST "$API/auth/login" -H 'content-type: application/json' -H 'X-Requested-With: XMLHttpRequest' \
  -d '{"email":"ops@snagchat.io","password":"SnagChat!Admin1"}' -c /tmp/cj_adm.txt)
check "admin login" 200 "$ADM"

SUP=$(code -X POST "$API/auth/login" -H 'content-type: application/json' -H 'X-Requested-With: XMLHttpRequest' \
  -d '{"email":"root@snagchat.io","password":"SnagChat!Super1"}' -c /tmp/cj_sup.txt)
check "superadmin login" 200 "$SUP"

# --- CSRF: mutating request with a foreign origin
XSS=$(code -X POST "$API/auth/logout" -H 'content-type: application/json' \
  -H 'Origin: https://evil.example' -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt)
check "foreign origin rejected" 403 "$XSS"

# --- metrics shape per role
code "$API/metrics/overview" -b /tmp/cj_mod.txt > /dev/null
check "moderator metrics scope" "queue" "$(jq_get scope)"
check "moderator has no revenue block" "undefined" "$(jq_get revenue)"
code "$API/metrics/overview" -b /tmp/cj_adm.txt > /dev/null
check "admin metrics scope" "ops" "$(jq_get scope)"
code "$API/metrics/overview" -b /tmp/cj_sup.txt > /dev/null
check "superadmin metrics scope" "platform" "$(jq_get scope)"
check "superadmin revenue present" "0.025" "$(jq_get revenue.platformFeeRate)"

# --- RBAC
check "moderator blocked from /staff" 403 "$(code "$API/staff" -b /tmp/cj_mod.txt)"
check "admin blocked from /staff" 403 "$(code "$API/staff" -b /tmp/cj_adm.txt)"
check "superadmin reads /staff" 200 "$(code "$API/staff" -b /tmp/cj_sup.txt)"
check "admin cannot read all audit" 403 "$(code "$API/audit?scope=all" -b /tmp/cj_adm.txt)"
check "moderator reads own audit" 200 "$(code "$API/audit?scope=mine" -b /tmp/cj_mod.txt)"

check "moderator cannot ban" 403 "$(code -X POST "$API/users/kit/actions" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt -d '{"action":"ban","reason":"testing"}')"
check "admin can suspend" 200 "$(code -X POST "$API/users/otis/actions" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_adm.txt -d '{"action":"suspend","durationHours":24,"reason":"seed check"}')"
check "action without reason" 422 "$(code -X POST "$API/users/drew/actions" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_adm.txt -d '{"action":"warn"}')"

# --- queue
check "open reports list" 200 "$(code "$API/reports?status=all" -b /tmp/cj_mod.txt)"
check "report total" "12" "$(jq_get total)"
check "report carries author handle" "true" "$( [ -n "$(jq_get items.0.content.author.handle)" ] && echo true || echo false )"
check "escalated list" 200 "$(code "$API/reports?status=escalated" -b /tmp/cj_mod.txt)"
check "escalated count" "2" "$(jq_get total)"

# --- decisions
CLAIM=$(code -X POST "$API/reports/rep_3/claim" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt -d '{"claim":true}')
check "claim open report" 200 "$CLAIM"
CLAIM2=$(code -X POST "$API/reports/rep_3/claim" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_adm.txt -d '{"claim":true}')
check "second claim conflicts" 409 "$CLAIM2"

ESC=$(code -X POST "$API/reports/rep_3/decision" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt -d '{"decision":"escalate"}')
check "escalate needs a note" 422 "$ESC"
ESC=$(code -X POST "$API/reports/rep_3/decision" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt -d '{"decision":"escalate","note":"needs admin eyes"}')
check "escalate with note" 200 "$ESC"
check "escalated state applied" "escalated" "$(jq_get report.status)"
REST=$(code -X POST "$API/reports/rep_3/decision" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt -d '{"decision":"restore","note":"back"}')
check "moderator cannot restore" 403 "$REST"

REM=$(code -X POST "$API/reports/rep_1/decision" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt -d '{"decision":"remove"}')
check "remove post" 200 "$REM"
REM_TOKEN=$(jq_get undoToken)
STATE=$(code "$API/reports/rep_1" -b /tmp/cj_mod.txt)
check "removed content gated" "drop" "$(jq_get report.content.state)"
UNDOTOKEN=$REM_TOKEN

UNDO=$(code -X POST "$API/audit/$UNDOTOKEN/undo" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt -d '{}')
check "undo own decision" 200 "$UNDO"
code "$API/reports/rep_1" -b /tmp/cj_mod.txt > /dev/null
check "content restored after undo" "allow" "$(jq_get report.content.state)"
check "undo twice rejected" 409 "$(code -X POST "$API/audit/$UNDOTOKEN/undo" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_mod.txt -d '{}')"

# --- staff lifecycle (superadmin)
CREATE=$(code -X POST "$API/staff" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_sup.txt \
  -d '{"name":"Dana Ito","email":"dana@snagchat.io","role":"moderator","password":"longenoughpass1"}')
check "create staff" 201 "$CREATE"
LASTID=$(jq_get staff.id)
check "duplicate email" 409 "$(code -X POST "$API/staff" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_sup.txt \
  -d '{"name":"Dana Ito","email":"dana@snagchat.io","role":"moderator","password":"longenoughpass1"}')"
check "last superadmin protected" 422 "$(code -X PATCH "$API/staff/stf_ada" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_sup.txt -d '{"role":"admin"}')"
check "suspend created staff" 200 "$(code -X PATCH "$API/staff/$LASTID" -H 'content-type: application/json' \
  -H 'X-Requested-With: XMLHttpRequest' -b /tmp/cj_sup.txt -d '{"status":"suspended"}')"

# --- assets still served through the same worker
check "consumer app served" 200 "$(code -o /dev/null http://127.0.0.1:8787/)"

echo
echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]
