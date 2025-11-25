#!/bin/bash

# This script performs smoke tests on the live installation.

# --- HELPERS ---

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# --- VERIFICATION FUNCTIONS ---

verify_url() {
    URL=$1
    print_status "Verifying $URL..."
    if curl -s -I "$URL" | grep -q "200 OK"; then
        print_status "$URL is responding with 200 OK."
    else
        print_error "$URL is not responding with 200 OK."
    fi
}

verify_bungeecord() {
    print_status "Verifying BungeeCord proxy..."
    if curl -s "https://api.mcsrvstat.us/2/live.lerncraft.xyz:25565" | grep -q '"online":true'; then
        print_status "BungeeCord proxy is online."
    else
        print_error "BungeeCord proxy is offline."
    fi
}

# --- MAIN LOGIC ---

print_status "Starting verification..."

# Verify mc-* servers
verify_url "http://bgstpoelten.lerncraft.xyz"
verify_url "http://htlstp.lerncraft.xyz"
verify_url "http://borgstpoelten.lerncraft.xyz"
verify_url "http://hakstpoelten.lerncraft.xyz"
verify_url "http://basop-bafep-stp.lerncraft.xyz"
verify_url "http://play.lerncraft.xyz"
verify_url "http://mc.ikaria.dev"
verify_url "http://mc.kdlk.net"

# Verify admin-ui
verify_url "http://lerncraft.xyz"

# Verify BungeeCord
verify_bungeecord

print_status "Verification complete."
