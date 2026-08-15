#!/usr/bin/env bash
# Poll gdu.com.tr and push an ntfy notification when the site becomes reachable.
set -euo pipefail

URL="${URL:-https://gdu.com.tr}"
NTFY_TOPIC="${NTFY_TOPIC:-gduup}"
NTFY_URL="${NTFY_URL:-https://ntfy.sh/${NTFY_TOPIC}}"
INTERVAL_SEC="${INTERVAL_SEC:-30}"
TIMEOUT_SEC="${TIMEOUT_SEC:-10}"

was_up=0

notify() {
  local title="$1"
  local body="$2"
  curl -fsS \
    -H "Title: ${title}" \
    -H "Priority: high" \
    -H "Tags: white_check_mark,globe_with_meridians" \
    -d "${body}" \
    "${NTFY_URL}" >/dev/null
}

check() {
  curl -fsS \
    --connect-timeout "${TIMEOUT_SEC}" \
    --max-time "${TIMEOUT_SEC}" \
    -o /dev/null \
    -w "%{http_code}" \
    "${URL}"
}

echo "Watching ${URL} every ${INTERVAL_SEC}s → ntfy://${NTFY_TOPIC}"

while true; do
  if code="$(check 2>/dev/null)" && [[ "${code}" =~ ^[23][0-9][0-9]$ ]]; then
    if [[ "${was_up}" -eq 0 ]]; then
      ts="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
      echo "[${ts}] UP (HTTP ${code}) — sending ntfy push"
      notify "gdu.com.tr is up" "Reachable at ${ts} (HTTP ${code}): ${URL}"
      was_up=1
    fi
  else
    if [[ "${was_up}" -eq 1 ]]; then
      echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] DOWN — will notify again when back up"
    else
      echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] still down"
    fi
    was_up=0
  fi
  sleep "${INTERVAL_SEC}"
done
