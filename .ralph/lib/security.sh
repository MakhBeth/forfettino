#!/bin/bash
# security.sh - DevSecOps checks för Ralph VM
#
# Körs före första körningen för att säkra VM
# Exit 0 = OK, Exit 1 = Varning/fel

set -e

echo "🔒 DevSecOps Security Check"
echo "==========================="
echo ""

WARNINGS=0
ERRORS=0

# 1. SSH-konfiguration
echo "1️⃣  SSH-säkerhet..."
if grep -q "^PasswordAuthentication no" /etc/ssh/sshd_config 2>/dev/null; then
    echo "   ✅ Lösenordsauth avstängd"
else
    echo "   ⚠️  Lösenordsauth kan vara på - bör stängas av"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -q "^PermitRootLogin no" /etc/ssh/sshd_config 2>/dev/null; then
    echo "   ✅ Root-login avstängd"
else
    echo "   ⚠️  Root-login kan vara tillåten"
    WARNINGS=$((WARNINGS + 1))
fi

# 2. Brandvägg
echo "2️⃣  Brandvägg..."
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo "   ✅ UFW aktiv"
        # Kolla att bara nödvändiga portar är öppna
        if ufw status | grep -q "22/tcp"; then
            echo "   ✅ SSH (22) öppen"
        fi
    else
        echo "   ⚠️  UFW installerad men ej aktiv"
        WARNINGS=$((WARNINGS + 1))
    fi
elif command -v firewall-cmd &> /dev/null; then
    if firewall-cmd --state 2>/dev/null | grep -q "running"; then
        echo "   ✅ Firewalld aktiv"
    else
        echo "   ⚠️  Firewalld ej aktiv"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ⚠️  Ingen brandvägg hittad (ufw/firewalld)"
    WARNINGS=$((WARNINGS + 1))
fi

# 3. Användare & permissions
echo "3️⃣  Användare..."
if id ralph &>/dev/null; then
    echo "   ✅ ralph-användare finns"

    # Kolla att ralph har begränsad sudo
    if sudo -l -U ralph 2>/dev/null | grep -q "ALL"; then
        echo "   ⚠️  ralph har full sudo - bör begränsas"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ ralph har begränsad sudo"
    fi
else
    echo "   ❌ ralph-användare saknas"
    ERRORS=$((ERRORS + 1))
fi

# 4. Uppdateringar
echo "4️⃣  Systemuppdateringar..."
if command -v apt &> /dev/null; then
    UPDATES=$(apt list --upgradable 2>/dev/null | grep -c "upgradable" || echo "0")
    if [ "$UPDATES" -gt 10 ]; then
        echo "   ⚠️  $UPDATES paket kan uppdateras"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ System relativt uppdaterat"
    fi
elif command -v dnf &> /dev/null; then
    UPDATES=$(dnf check-update --quiet 2>/dev/null | wc -l || echo "0")
    if [ "$UPDATES" -gt 10 ]; then
        echo "   ⚠️  $UPDATES paket kan uppdateras"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ System relativt uppdaterat"
    fi
fi

# 5. Hemligheter
echo "5️⃣  Hemligheter..."
if [ -f "$HOME/.env" ]; then
    echo "   ⚠️  .env i home-mappen - flytta till projekt"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ Inga .env i home"
fi

# Kolla att inga API-nycklar ligger i bash_history
if grep -qiE "(api_key|secret|token|password)=" "$HOME/.bash_history" 2>/dev/null; then
    echo "   ⚠️  Möjliga hemligheter i bash_history"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ Inga uppenbara hemligheter i history"
fi

# 6. Docker (om installerat)
echo "6️⃣  Docker..."
if command -v docker &> /dev/null; then
    if docker info &>/dev/null; then
        echo "   ✅ Docker körs"

        # Kolla att ralph är i docker-gruppen
        if groups ralph 2>/dev/null | grep -q docker; then
            echo "   ✅ ralph i docker-gruppen"
        else
            echo "   ⚠️  ralph ej i docker-gruppen"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "   ⚠️  Docker installerad men körs inte"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ℹ️  Docker ej installerat"
fi

# 7. Nätverksexponering
echo "7️⃣  Nätverksexponering..."
LISTENING=$(ss -tlnp 2>/dev/null | grep LISTEN | wc -l)
echo "   ℹ️  $LISTENING tjänster lyssnar"

# Varna om något lyssnar på 0.0.0.0 (alla interface)
EXPOSED=$(ss -tlnp 2>/dev/null | grep "0.0.0.0:" | grep -v ":22" | wc -l)
if [ "$EXPOSED" -gt 0 ]; then
    echo "   ⚠️  $EXPOSED tjänster exponerade på alla interface"
    ss -tlnp 2>/dev/null | grep "0.0.0.0:" | grep -v ":22"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ Endast SSH exponerad externt"
fi

# 8. Disk & resurser
echo "8️⃣  Resurser..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "   ⚠️  Disk ${DISK_USAGE}% full"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ Disk OK (${DISK_USAGE}%)"
fi

MEM_FREE=$(free -m | awk 'NR==2 {print $7}')
if [ "$MEM_FREE" -lt 500 ]; then
    echo "   ⚠️  Lite ledigt minne (${MEM_FREE}MB)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ Minne OK (${MEM_FREE}MB ledigt)"
fi

# Resultat
echo ""
echo "================================"
if [ $ERRORS -gt 0 ]; then
    echo "❌ SECURITY CHECK FAILED ($ERRORS fel, $WARNINGS varningar)"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo "⚠️  SECURITY CHECK: $WARNINGS varningar"
    echo "   Kör 'ralph secure' för att fixa"
    exit 0
else
    echo "✅ SECURITY CHECK OK"
    exit 0
fi
