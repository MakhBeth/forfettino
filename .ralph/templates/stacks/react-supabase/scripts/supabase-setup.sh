#!/bin/bash
# supabase-setup.sh - Automatisk Supabase-setup för Ralph-projekt
#
# Kör detta i början av E1 om projektet använder Supabase

set -e

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "🔧 Supabase Setup"
echo "================="

# Kolla om Supabase redan är initierat
if [ -d "supabase" ] && [ -f "supabase/config.toml" ]; then
    echo "✅ Supabase redan initierat"
else
    echo "📦 Initierar Supabase..."
    supabase init
fi

# Kolla om Docker körs
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker körs inte. Starta Docker först."
    exit 1
fi

# Kolla om Supabase redan körs
if supabase status > /dev/null 2>&1; then
    echo "✅ Supabase körs redan"
else
    echo "🚀 Startar lokal Supabase..."
    supabase start
fi

# Hämta credentials
echo ""
echo "📋 Supabase Status:"
supabase status

# Extrahera credentials
API_URL=$(supabase status | grep "API URL" | awk {print })
ANON_KEY=$(supabase status | grep "anon key" | awk {print })

if [ -z "$API_URL" ]; then
    API_URL="http://127.0.0.1:54321"
fi

if [ -z "$ANON_KEY" ]; then
    ANON_KEY=$(supabase status | grep "Publishable" | awk {print })
fi

# Skapa/uppdatera .env
echo ""
echo "📝 Uppdaterar .env..."

if [ -f ".env" ]; then
    # Backup befintlig
    cp .env .env.backup
    # Ta bort gamla Supabase-variabler
    grep -v "SUPABASE" .env > .env.tmp || true
    mv .env.tmp .env
fi

cat >> .env << ENVEOF
VITE_SUPABASE_URL=$API_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY
ENVEOF

echo "✅ .env uppdaterad med:"
echo "   VITE_SUPABASE_URL=$API_URL"
echo "   VITE_SUPABASE_ANON_KEY=$ANON_KEY"

# Kör migrations om schema finns
if [ -f "supabase/schema.sql" ]; then
    echo ""
    echo "📊 Kör databasmigrering..."
    
    # Skapa migration-fil om den inte finns
    MIGRATION_FILE="supabase/migrations/$(date +%Y%m%d%H%M%S)_init.sql"
    if [ ! -d "supabase/migrations" ] || [ -z "$(ls supabase/migrations/*.sql 2>/dev/null)" ]; then
        mkdir -p supabase/migrations
        cp supabase/schema.sql "$MIGRATION_FILE"
        echo "   Skapade migration: $MIGRATION_FILE"
    fi
    
    supabase db reset
    echo "✅ Databas migrerad"
fi

echo ""
echo "🎉 Supabase-setup klar!"
echo ""
echo "Nästa steg:"
echo "  - Starta din app: npm run dev"
echo "  - Supabase Studio: http://127.0.0.1:54323"
echo "  - Mailpit (för auth-emails): http://127.0.0.1:54324"
