#!/bin/bash

# TerraLedger Pre-warm Script
# Ensures the app and RPC are responsive before recording

LIVE_URL="https://terraledger-solana.vercel.app"
RPC_URL="https://api.devnet.solana.com"

echo "--- TERRA LEDGER PRE-WARM ---"

# 1. Check API Health
echo -n "Checking API Health... "
HEALTH=$(curl -s "$LIVE_URL/api/health" | grep -o '"status":"ok"')
if [ "$HEALTH" == '"status":"ok"' ]; then
    echo "✓"
else
    echo "✗ (Failed)"
fi

# 2. Check Devnet RPC
echo -n "Checking Devnet RPC... "
RPC_HEALTH=$(curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "$RPC_URL" | grep -o '"result":"ok"')
if [ "$RPC_HEALTH" == '"result":"ok"' ]; then
    echo "✓"
else
    # Some RPCs don't support getHealth, try getSlot
    RPC_SLOT=$(curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}' "$RPC_URL" | grep -o '"result":')
    if [ -n "$RPC_SLOT" ]; then
        echo "✓ (Slot active)"
    else
        echo "✗ (Failed)"
    fi
fi

# 3. Open URL in background (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Opening app in browser... ✓"
    open "$LIVE_URL"
fi

echo ""
echo "TerraLedger demo ready ✓"
