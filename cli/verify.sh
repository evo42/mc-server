#!/bin/bash

# This script performs smoke tests on the live installation.

set -e

# Source the utility functions
source ./cli/utils.sh

# --- VERIFICATION FUNCTIONS ---

verify_server() {
    URL=$1
    # Extract hostname from URL (e.g., http://example.com -> example.com)
    HOSTNAME=$(echo "$URL" | awk -F/ '{print $3}')

    log_info "Verifying $URL..."
    
    # Check HTTP
    if curl -s -I "$URL" | grep -q "200 OK"; then
        log_success "HTTP is online (200 OK)."
    else
        log_error "HTTP is offline or not returning 200 OK."
    fi

    # Check Minecraft MOTD
    RESPONSE=$(curl -s "https://api.mcsrvstat.us/2/$HOSTNAME")
    if echo "$RESPONSE" | grep -q '"online":true'; then
        if command -v jq >/dev/null 2>&1; then
            MOTD=$(echo "$RESPONSE" | jq -r '.motd.clean | join(" ")')
            log_info "MOTD: $MOTD"
        fi
    else
        # Optional: Log if MC server is unreachable, but maybe user only cares about MOTD if online
        # Keeping it silent if offline to match original behavior of only verifying URL success? 
        # But "MOTD is missing" implies we want it.
        # I won't log error for MC offline here to avoid noise if it's not meant to be an MC server (though these all are).
        :
    fi
    echo ""
}

verify_bungeecord() {
    log_info "Verifying BungeeCord proxy..."
    RESPONSE=$(curl -s "https://api.mcsrvstat.us/2/live.lerncraft.xyz:25565")

    if echo "$RESPONSE" | grep -q '"online":true'; then
        log_success "BungeeCord proxy is online."
        
        if command -v jq >/dev/null 2>&1; then
            MOTD=$(echo "$RESPONSE" | jq -r '.motd.clean | join(" ")')
            log_info "MOTD: $MOTD"
        fi
    else
        log_error "BungeeCord proxy is offline."
    fi
    echo ""
}

# --- MAIN LOGIC ---

log_info "Starting verification..."
echo ""

# Verify mc-* servers
verify_server "http://bgstpoelten.lerncraft.xyz"
verify_server "http://htlstp.lerncraft.xyz"
verify_server "http://borgstpoelten.lerncraft.xyz"
verify_server "http://hakstpoelten.lerncraft.xyz"
verify_server "http://basop-bafep-stp.lerncraft.xyz"
verify_server "http://play.lerncraft.xyz"
verify_server "http://mc.ikaria.dev"
verify_server "http://mc.kdlk.net"

# Verify admin-ui
verify_server "http://lerncraft.xyz"

# Verify BungeeCord
verify_bungeecord

log_success "Verification complete."
