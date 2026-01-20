#!/bin/bash
# verify.sh - Verifiering för React + Supabase stack
#
# Körs vid HARD STOP för att säkerställa att allt fungerar
# Exit 0 = OK, Exit 1 = Fel

set -e

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

# Använd projektmapp för temp-filer (undvik /tmp permission issues)
TEMP_DIR="${PROJECT_DIR}/.ralph-temp"
mkdir -p "$TEMP_DIR"

echo "🔍 Verifierar React + Supabase projekt..."
echo ""

ERRORS=0

# 1. Build-test
echo "1️⃣  Build-test..."
if npm run build > "$TEMP_DIR/build.log" 2>&1; then
    echo "   ✅ Build OK"
else
    echo "   ❌ Build FAILED"
    tail -20 "$TEMP_DIR/build.log"
    ERRORS=$((ERRORS + 1))
fi

# 2. TypeScript-fel
echo "2️⃣  TypeScript-check..."
if npx tsc --noEmit > "$TEMP_DIR/tsc.log" 2>&1; then
    echo "   ✅ TypeScript OK"
else
    echo "   ❌ TypeScript-fel"
    tail -10 "$TEMP_DIR/tsc.log"
    ERRORS=$((ERRORS + 1))
fi

# 3. Kolla att alla index.ts har korrekta exports
echo "3️⃣  Export-check..."
MISSING_EXPORTS=0

for dir in src/components/*/; do
    if [ -d "$dir" ]; then
        index_file="$dir/index.ts"
        if [ -f "$index_file" ]; then
            # Hitta alla .tsx filer i mappen (exkludera .test.tsx filer)
            for component in "$dir"*.tsx; do
                if [ -f "$component" ]; then
                    # Skippa test-filer
                    case "$component" in
                        *.test.tsx|*.spec.tsx) continue ;;
                    esac
                    name=$(basename "$component" .tsx)
                    if ! grep -q "export.*$name" "$index_file" 2>/dev/null; then
                        echo "   ⚠️  Saknad export: $name i $index_file"
                        MISSING_EXPORTS=$((MISSING_EXPORTS + 1))
                    fi
                fi
            done
        fi
    fi
done

if [ $MISSING_EXPORTS -eq 0 ]; then
    echo "   ✅ Alla komponenter exporterade"
else
    echo "   ❌ $MISSING_EXPORTS saknade exports"
    ERRORS=$((ERRORS + 1))
fi

# 4. Supabase-anslutning (KRAV - måste köra)
echo "4️⃣  Supabase-check..."
if [ -f ".env" ]; then
    source .env 2>/dev/null || true
    if [ -n "$VITE_SUPABASE_URL" ] && [ "$VITE_SUPABASE_URL" != "│" ]; then
        if curl -s "$VITE_SUPABASE_URL/rest/v1/" -H "apikey: $VITE_SUPABASE_ANON_KEY" > /dev/null 2>&1; then
            echo "   ✅ Supabase anslutning OK"
        else
            echo "   ❌ Supabase svarar inte - kör 'supabase start'"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo "   ❌ VITE_SUPABASE_URL ej satt - kör setup.sh"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ❌ Ingen .env fil - kör setup.sh"
    ERRORS=$((ERRORS + 1))
fi

# 5. Dev-server test
echo "5️⃣  Dev-server test..."
npm run dev > "$TEMP_DIR/dev.log" 2>&1 &
DEV_PID=$!
sleep 5

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Dev-server OK"
else
    echo "   ❌ Dev-server svarar inte"
    ERRORS=$((ERRORS + 1))
fi

# 6. E2E-tester med Playwright (om finns)
echo "6️⃣  E2E-tester..."
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
    # Installera browsers om saknas
    if ! npx playwright --version > /dev/null 2>&1; then
        echo "   📦 Installerar Playwright..."
        npm install -D @playwright/test
        npx playwright install chromium
    fi

    # Kör E2E-tester (dev-server körs redan)
    if npx playwright test --reporter=list > "$TEMP_DIR/e2e.log" 2>&1; then
        echo "   ✅ E2E-tester OK"
    else
        echo "   ❌ E2E-tester FAILED"
        tail -30 "$TEMP_DIR/e2e.log"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⚠️  Inga E2E-tester (playwright.config saknas)"
    echo "   💡 Skapa E2E-tester för fullständig verifiering"
fi

# Stäng dev-server
kill $DEV_PID 2>/dev/null || true

# Städa temp-filer
rm -rf "$TEMP_DIR" 2>/dev/null || true

# Resultat
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ VERIFIERING OK"
    exit 0
else
    echo "❌ VERIFIERING FAILED ($ERRORS fel)"
    exit 1
fi
