#!/bin/bash
# post-create.sh - Körs efter att en ny fil skapats
#
# Automatiskt lägger till export i index.ts för nya komponenter/hooks
#
# Användning: post-create.sh <skapad-fil>

set -e

FILE="$1"

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
    exit 0
fi

# Bara hantera .tsx och .ts filer (inte index.ts)
if [[ ! "$FILE" =~ \.(tsx|ts)$ ]] || [[ "$FILE" =~ index\.ts$ ]]; then
    exit 0
fi

DIR=$(dirname "$FILE")
BASENAME=$(basename "$FILE")
NAME="${BASENAME%.*}"  # Ta bort extension
INDEX_FILE="$DIR/index.ts"

# Kolla om det är en komponent/hook-mapp
if [[ "$DIR" =~ src/components/ ]] || [[ "$DIR" =~ src/hooks ]] || [[ "$DIR" =~ src/contexts ]]; then

    # Skapa index.ts om den inte finns
    if [ ! -f "$INDEX_FILE" ]; then
        touch "$INDEX_FILE"
    fi

    # Kolla om exporten redan finns
    if grep -q "export.*{.*$NAME.*}" "$INDEX_FILE" 2>/dev/null || \
       grep -q "export \* from './$NAME'" "$INDEX_FILE" 2>/dev/null; then
        # Redan exporterad
        exit 0
    fi

    # Lägg till export
    # Använd named export för .tsx, namespace för .ts
    if [[ "$FILE" =~ \.tsx$ ]]; then
        echo "export { $NAME } from './$NAME'" >> "$INDEX_FILE"
    else
        # För hooks/utilities, exportera allt
        echo "export * from './$NAME'" >> "$INDEX_FILE"
    fi

    echo "📦 Auto-exporterade $NAME i $INDEX_FILE"
fi
