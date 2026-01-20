#!/bin/bash
# rate-limit.sh - Rate limit detection and handling
# Source this file: source lib/rate-limit.sh

RATE_LIMIT_LOG="${RATE_LIMIT_LOG:-$HOME/ralph-rate-limits.log}"

RATE_LIMIT_PATTERNS=(
    "rate.limit"
    "too.many.requests"
    "quota.exceeded"
    "capacity"
    "try.again.later"
    "retry.after"
    "429"
    "overloaded"
)

# Check if output indicates rate limiting
is_rate_limited() {
    local output="$1"

    for pattern in "${RATE_LIMIT_PATTERNS[@]}"; do
        if echo "$output" | grep -qi "$pattern"; then
            return 0
        fi
    done

    return 1
}

# Log rate limit event
log_rate_limit() {
    local context="$1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $context" >> "$RATE_LIMIT_LOG"
}

# Wait for rate limit to clear
wait_for_rate_limit() {
    local seconds="${1:-120}"
    echo "[rate-limit] Waiting ${seconds}s..."
    sleep "$seconds"
}

# Handle rate limit (log, wait, return)
handle_rate_limit() {
    local context="$1"
    local wait_time="${2:-120}"

    log_rate_limit "$context"
    wait_for_rate_limit "$wait_time"
}
