#!/bin/bash
# spec-utils.sh - Spec tracking utilities
# Source this file: source lib/spec-utils.sh

CHECKSUM_DIR="${CHECKSUM_DIR:-.spec-checksums}"
SPECS_DIR="${SPECS_DIR:-specs}"

# Get next incomplete spec
next_incomplete_spec() {
    mkdir -p "$CHECKSUM_DIR"

    for spec in "$SPECS_DIR"/*.md; do
        [ -f "$spec" ] || continue

        local basename=$(basename "$spec")
        local checksum_file="$CHECKSUM_DIR/$basename.md5"

        # If no checksum exists, this spec hasn't been done
        if [ ! -f "$checksum_file" ]; then
            echo "$spec"
            return 0
        fi

        # If checksum differs, spec was modified
        local old_checksum=$(cat "$checksum_file")
        local new_checksum=$(md5sum "$spec" 2>/dev/null | cut -d' ' -f1 || md5 -q "$spec" 2>/dev/null)

        if [ "$old_checksum" != "$new_checksum" ]; then
            echo "$spec"
            return 0
        fi
    done

    # No incomplete specs
    echo ""
}

# Mark spec as done (save checksum)
mark_spec_done() {
    local spec="$1"
    local basename=$(basename "$spec")

    mkdir -p "$CHECKSUM_DIR"

    md5sum "$spec" 2>/dev/null | cut -d' ' -f1 > "$CHECKSUM_DIR/$basename.md5" || \
    md5 -q "$spec" 2>/dev/null > "$CHECKSUM_DIR/$basename.md5"
}

# Check if spec is already done
is_spec_done() {
    local spec="$1"
    local basename=$(basename "$spec")
    local checksum_file="$CHECKSUM_DIR/$basename.md5"

    [ -f "$checksum_file" ] || return 1

    local old_checksum=$(cat "$checksum_file")
    local new_checksum=$(md5sum "$spec" 2>/dev/null | cut -d' ' -f1 || md5 -q "$spec" 2>/dev/null)

    [ "$old_checksum" = "$new_checksum" ]
}

# Count specs
count_total_specs() {
    ls -1 "$SPECS_DIR"/*.md 2>/dev/null | wc -l | tr -d ' '
}

count_done_specs() {
    ls -1 "$CHECKSUM_DIR"/*.md5 2>/dev/null | wc -l | tr -d ' '
}

# List all specs
list_specs() {
    for spec in "$SPECS_DIR"/*.md; do
        [ -f "$spec" ] || continue

        if is_spec_done "$spec"; then
            echo "[DONE] $spec"
        else
            echo "[TODO] $spec"
        fi
    done
}

# List all incomplete specs (for parallel mode)
list_incomplete_specs() {
    mkdir -p "$CHECKSUM_DIR"

    for spec in "$SPECS_DIR"/*.md; do
        [ -f "$spec" ] || continue

        if ! is_spec_done "$spec"; then
            echo "$spec"
        fi
    done
}
