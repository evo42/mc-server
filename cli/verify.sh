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
    
    # Check HTTPS by replacing http:// with https://
    HTTPS_URL="${URL/http:/https:}"

    log_info "Verifying $HTTPS_URL..."
    
    # Check HTTPS with -k to allow self-signed certs (handled by Cloudflare in prod)
    # Also follow redirects (-L) just in case
    # use -o /dev/null -w "%{http_code}" to check status code reliably (handles HTTP/2)
    HTTP_CODE=$(curl -s -k -L -o /dev/null -w "%{http_code}" "$HTTPS_URL")
    
    if [ "$HTTP_CODE" == "200" ]; then
        log_success "HTTPS is online (200 OK)."
    else
        log_error "HTTPS is offline or not returning 200 OK (Code: $HTTP_CODE)."
    fi

    # Check Minecraft MOTD
    # Note: This relies on an external API which may be cached or slow to update.
    RESPONSE=$(curl -s "https://api.mcsrvstat.us/2/$HOSTNAME")
    if echo "$RESPONSE" | grep -q '"online":true'; then
        if command -v jq >/dev/null 2>&1; then
            MOTD=$(echo "$RESPONSE" | jq -r '.motd.clean | join(" ")')
            log_info "MOTD: $MOTD"
        else
            log_info "MOTD: Online (jq not installed)"
        fi
    else
        # Log a warning instead of doing nothing, so the user knows the check was attempted
        log_warn "MOTD: Could not fetch status from mcsrvstat.us (might be cached/offline)"
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
        log_error "BungeeCord proxy is offline (according to mcsrvstat.us)."
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
verify_server "http://play.ikaria.dev"
verify_server "http://mc.kdlk.net"
verify_server "http://play.kdlk.net"

# Verify admin-ui
verify_server "http://lerncraft.xyz"

# Verify BungeeCord
verify_bungeecord

log_success "Verification complete."
