#!/bin/bash
# post-merge.sh - Körs efter parallell worktree merge
#
# Säkerställer att alla komponenter är korrekt integrerade

set -e

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "🔗 Post-merge integration check..."
echo ""

ISSUES=0

# 1. Hitta alla komponenter som saknar export
echo "Kollar exports..."
for dir in src/components/*/; do
    if [ -d "$dir" ]; then
        index_file="${dir}index.ts"

        # Skapa index.ts om den saknas
        if [ ! -f "$index_file" ]; then
            touch "$index_file"
            echo "   Skapade $index_file"
        fi

        # Kolla varje komponent
        for component in "$dir"*.tsx; do
            if [ -f "$component" ]; then
                name=$(basename "$component" .tsx)

                # Skippa index
                if [ "$name" = "index" ]; then
                    continue
                fi

                # Lägg till export om saknas
                if ! grep -q "export.*$name" "$index_file" 2>/dev/null; then
                    echo "export { $name } from './$name'" >> "$index_file"
                    echo "   ✅ La till export för $name"
                    ISSUES=$((ISSUES + 1))
                fi
            fi
        done
    fi
done

# 2. Samma för hooks
if [ -d "src/hooks" ]; then
    index_file="src/hooks/index.ts"
    if [ ! -f "$index_file" ]; then
        touch "$index_file"
    fi

    for hook in src/hooks/*.ts; do
        if [ -f "$hook" ]; then
            name=$(basename "$hook" .ts)
            if [ "$name" = "index" ]; then
                continue
            fi

            if ! grep -q "$name" "$index_file" 2>/dev/null; then
                echo "export * from './$name'" >> "$index_file"
                echo "   ✅ La till export för $name hook"
                ISSUES=$((ISSUES + 1))
            fi
        fi
    done
fi

# 3. Samma för contexts
if [ -d "src/contexts" ]; then
    index_file="src/contexts/index.ts"
    if [ ! -f "$index_file" ]; then
        touch "$index_file"
    fi

    for ctx in src/contexts/*.tsx; do
        if [ -f "$ctx" ]; then
            name=$(basename "$ctx" .tsx)
            if [ "$name" = "index" ]; then
                continue
            fi

            if ! grep -q "$name" "$index_file" 2>/dev/null; then
                echo "export * from './$name'" >> "$index_file"
                echo "   ✅ La till export för $name context"
                ISSUES=$((ISSUES + 1))
            fi
        fi
    done
fi

echo ""
if [ $ISSUES -gt 0 ]; then
    echo "🔧 Fixade $ISSUES saknade exports"

    # Kör build för att verifiera
    echo ""
    echo "Verifierar build..."
    if npm run build > /dev/null 2>&1; then
        echo "✅ Build OK efter fixes"
    else
        echo "❌ Build FAILED - manuell fix behövs"
        exit 1
    fi
else
    echo "✅ Alla exports OK"
fi
