#!/bin/bash
# selfheal.sh - Auto-fix missing dependencies
# Source this file: source lib/selfheal.sh

SELFHEAL_LOADED=1

# Known patterns and fixes
# Format: pattern|fix_command|description
SELFHEAL_PATTERNS=(
    "tsc: not found|npm install -g typescript|TypeScript compiler"
    "npx: not found|npm install -g npx|npx command"
    "vite: not found|npm install vite|Vite bundler"
    "vitest: not found|npm install vitest|Vitest test runner"
    "playwright: not found|npx playwright install|Playwright browser"
    "supabase: not found|npm install -g supabase|Supabase CLI"
    "Cannot find module|npm install|Missing npm package"
    "ENOENT.*node_modules|npm install|Missing node_modules"
    "MODULE_NOT_FOUND|npm install|Missing module"
    "ERR_MODULE_NOT_FOUND|npm install|Missing ES module"
)

# Try to self-heal based on error output
try_selfheal() {
    local error_output="$1"
    local healed=false

    for pattern_entry in "${SELFHEAL_PATTERNS[@]}"; do
        local pattern=$(echo "$pattern_entry" | cut -d'|' -f1)
        local fix_cmd=$(echo "$pattern_entry" | cut -d'|' -f2)
        local description=$(echo "$pattern_entry" | cut -d'|' -f3)

        if echo "$error_output" | grep -qiE "$pattern"; then
            echo "[selfheal] Detected: $description"
            echo "[selfheal] Running: $fix_cmd"

            if eval "$fix_cmd" 2>&1; then
                echo "[selfheal] Fixed: $description"
                healed=true
            else
                echo "[selfheal] Failed to fix: $description"
            fi
        fi
    done

    [ "$healed" = true ]
}

# Ensure node_modules exists
ensure_deps() {
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
        echo "[selfheal] Installing dependencies..."
        npm install 2>&1
    fi
}
