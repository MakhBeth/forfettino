#!/bin/bash
# parallel.sh - Parallel execution with git worktrees
# Source this file: source lib/parallel.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scaling.sh"
source "$SCRIPT_DIR/merge.sh"

WORKTREE_BASE="${WORKTREE_BASE:-$HOME/ralph-worktrees}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Run specs in parallel using worktrees
run_parallel() {
    local run_spec_fn="$1"  # Function to run single spec
    shift
    local specs=("$@")
    local pids=()
    local worktrees=()
    local branches=()
    local running=0

    echo "[parallel] Starting ${#specs[@]} specs (max $PARALLEL_MAX)"
    mkdir -p "$WORKTREE_BASE"

    for spec in "${specs[@]}"; do
        maybe_scale_parallel $running

        # Wait if at max
        while [ $running -ge $PARALLEL_MAX ]; do
            for i in "${!pids[@]}"; do
                if ! kill -0 "${pids[$i]}" 2>/dev/null; then
                    wait "${pids[$i]}" || true
                    unset 'pids[$i]'
                    ((running--))
                    maybe_scale_parallel $running
                    break
                fi
            done
            sleep 2
        done

        local spec_name=$(basename "$spec" .md)
        local branch="ralph-$spec_name-$TIMESTAMP"
        local worktree="$WORKTREE_BASE/$spec_name-$TIMESTAMP"

        echo "[parallel] Creating worktree: $spec_name"

        git branch "$branch" 2>/dev/null || true
        git worktree add "$worktree" "$branch" 2>/dev/null || true
        cp "$spec" "$worktree/"

        worktrees+=("$worktree")
        branches+=("$branch")

        # Run in background
        (
            cd "$worktree"
            if $run_spec_fn "$(basename "$spec")" "$branch" > ralph.log 2>&1; then
                echo "SUCCESS" > .ralph-status
            else
                echo "FAILED" > .ralph-status
            fi
        ) &
        pids+=($!)
        ((running++))

        echo "[parallel] PID: ${pids[-1]} (running: $running/$PARALLEL_MAX)"
    done

    # Wait for all
    echo "[parallel] Waiting for ${#pids[@]} specs..."
    local failed=0
    for i in "${!pids[@]}"; do
        wait "${pids[$i]}" || ((failed++))
    done

    # Collect results
    echo "[parallel] === RESULTS ==="
    local successful_branches=()

    for i in "${!worktrees[@]}"; do
        local worktree="${worktrees[$i]}"
        local branch="${branches[$i]}"
        local status=$(cat "$worktree/.ralph-status" 2>/dev/null || echo "UNKNOWN")

        if [ "$status" = "SUCCESS" ]; then
            echo "  ✅ $(basename "$worktree")"
            successful_branches+=("$branch")
        else
            echo "  ❌ $(basename "$worktree")"
        fi
    done

    # Cleanup worktrees
    for worktree in "${worktrees[@]}"; do
        git worktree remove "$worktree" --force 2>/dev/null || true
    done
    git worktree prune 2>/dev/null || true

    # Merge successful branches
    if [ ${#successful_branches[@]} -gt 0 ]; then
        echo "[parallel] Merging ${#successful_branches[@]} branches..."
        merge_branches_sequential "${successful_branches[@]}" || true
    fi

    return $failed
}
