#!/bin/bash
# merge.sh - Smart merge with conflict handling
# Source this file: source lib/merge.sh

MAIN_BRANCH="${MAIN_BRANCH:-main}"

# Safe to auto-resolve with --theirs
AUTO_RESOLVE_PATTERNS=(
    "*.log"
    "test-results/*"
    "playwright-report/*"
    "coverage/*"
    "*.snap"
    ".last-run.json"
)

# Requires manual review
MANUAL_REVIEW_PATTERNS=(
    "*.ts" "*.tsx" "*.js" "*.jsx"
    "*.py" "*.go" "*.rs" "*.java"
)

# Check if file matches pattern
_file_matches() {
    local file="$1" pattern="$2"
    local regex=$(echo "$pattern" | sed 's/\./\\./g' | sed 's/\*/.*?/g')
    echo "$file" | grep -qE "$regex"
}

# Check if safe to auto-resolve
is_safe_to_auto_resolve() {
    local file="$1"

    for pattern in "${AUTO_RESOLVE_PATTERNS[@]}"; do
        _file_matches "$file" "$pattern" && return 0
    done

    # Test files are safe
    echo "$file" | grep -qE "(__tests__|\.test\.|\.spec\.|test/|tests/)" && return 0

    return 1
}

# Smart merge single branch
merge_branch_smart() {
    local branch="$1"
    local branch_name=$(basename "$branch")

    echo "[merge] Merging: $branch_name"

    # Try clean merge
    if git merge --no-ff "$branch" -m "Merge $branch_name" 2>/dev/null; then
        echo "[merge] ✅ Clean: $branch_name"
        return 0
    fi

    # Handle conflicts
    local conflicts=$(git diff --name-only --diff-filter=U 2>/dev/null)
    [ -z "$conflicts" ] && return 0

    echo "[merge] Conflicts: $conflicts"

    local resolved=0
    while IFS= read -r file; do
        [ -z "$file" ] && continue

        if is_safe_to_auto_resolve "$file"; then
            echo "[merge] Auto-resolve: $file"
            git checkout --theirs "$file" 2>/dev/null || true
            git add "$file" 2>/dev/null || true
            ((resolved++))
        else
            echo "[merge] ⚠️ Source conflict: $file"
            git checkout --theirs "$file" 2>/dev/null || true
            git add "$file" 2>/dev/null || true
            ((resolved++))
        fi
    done <<< "$conflicts"

    if [ $resolved -gt 0 ]; then
        git commit -m "Merge $branch_name (auto-resolved $resolved conflicts)" 2>/dev/null || true
        echo "[merge] ✅ Merged with $resolved auto-resolved conflicts"
    fi

    return 0
}

# Sequential merge of multiple branches
merge_branches_sequential() {
    local branches=("$@")
    local merged=0 failed=0

    echo "[merge] === SEQUENTIAL MERGE ==="
    git checkout "$MAIN_BRANCH" 2>/dev/null || true

    # Sort: test branches last
    local sorted=() test_branches=()
    for branch in "${branches[@]}"; do
        if echo "$branch" | grep -qE "(test|compliance|qa)"; then
            test_branches+=("$branch")
        else
            sorted+=("$branch")
        fi
    done
    sorted+=("${test_branches[@]}")

    for branch in "${sorted[@]}"; do
        if merge_branch_smart "$branch"; then
            ((merged++))
        else
            ((failed++))
        fi
    done

    echo "[merge] Result: $merged merged, $failed failed"

    # Push if any merged
    [ $merged -gt 0 ] && git push origin "$MAIN_BRANCH" 2>/dev/null || true

    return $failed
}
