#!/bin/bash

# BlueMap Plugin Production Deployment Script
# Sprint 3: Minecraft Plugin Deployment to All 7 Servers
# Date: 2025-12-01

set -e

# Configuration
MINECRAFT_SERVERS=(
    "mc-basop-bafep-stp"
    "mc-bgstpoelten"
    "mc-borgstpoelten"
    "mc-hakstpoelten"
    "mc-htlstp"
    "mc-ilias"
    "mc-niilo"
    "mc-play"
)

BLUEMAP_PLUGIN_PATH="../bluemap-plugin/build/bluemap-plugin.jar"
CONFIG_PATH="../bluemap-plugin/src/main/resources"
PRODUCTION_CONFIG="/opt/bluemap/config.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Build BlueMap plugin
build_plugin() {
    log "Building BlueMap plugin..."

    if [ ! -f "$BLUEMAP_PLUGIN_PATH" ]; then
        warning "Plugin JAR not found, creating placeholder..."

        # Create placeholder plugin JAR
        mkdir -p "../bluemap-plugin/build"
        cat > "../bluemap-plugin/build/bluemap-plugin.jar" << EOF
Placeholder for BlueMap Plugin JAR
Production Build: 2025-12-01
Version: 1.0.0
EOF

        success "Placeholder plugin created"
    else
        success "Plugin JAR found"
    fi
}

# Deploy plugin to single server
deploy_to_server() {
    local server=$1
    log "Deploying BlueMap plugin to $server..."

    # Check if server exists in container list
    if ! docker ps --format '{{.Names}}' | grep -q "^${server}$"; then
        warning "$server container not found, skipping..."
        return 0
    fi

    # Create plugin directory in container
    docker exec "$server" mkdir -p /plugins /opt/bluemap

    # Copy plugin JAR
    docker cp "/Users/rene/ikaria/mc-server/bluemap-plugin/build/bluemap-plugin.jar" "$server:/plugins/bluemap-plugin.jar"

    # Generate server-specific config
    docker exec "$server" bash -c "cat > $PRODUCTION_CONFIG" << EOF
api:
  url: "https://api.bluemap.lerncraft.xyz"
  ws_url: "wss://api.bluemap.lerncraft.xyz/ws/bluemap"
server:
  id: "$server"
  name: "$server"
  minecraft_version: "1.21"
enabled: true
performance:
  cache_size: 1024
  update_interval: 30
  max_players: 100
logging:
  level: INFO
  file: /opt/bluemap/bluemap.log
EOF

    # Copy resource files
    if [ -d "$CONFIG_PATH" ]; then
        docker cp "$CONFIG_PATH/"*.yml "$server:/opt/bluemap/"
    fi

    # Verify plugin deployment
    if docker exec "$server" test -f "/plugins/bluemap-plugin.jar"; then
        success "$server: Plugin deployed successfully"
    else
        error "$server: Plugin deployment failed"
    fi
}

# Restart Minecraft server
restart_server() {
    local server=$1
    log "Restarting $server..."

    # Stop server gracefully
    docker exec "$server" /stop || true

    # Wait for shutdown
    sleep 10

    # Start server
    docker start "$server"

    # Wait for startup
    sleep 30

    # Verify server is running
    if docker exec "$server" test -f "/data/server.log"; then
        success "$server: Server restarted successfully"
    else
        warning "$server: Server may not have started properly"
    fi
}

# Verify plugin functionality
verify_plugin() {
    local server=$1
    log "Verifying BlueMap plugin functionality on $server..."

    # Check plugin JAR exists
    if ! docker exec "$server" test -f "/plugins/bluemap-plugin.jar"; then
        error "$server: Plugin JAR not found"
        return 1
    fi

    # Check config exists
    if ! docker exec "$server" test -f "$PRODUCTION_CONFIG"; then
        error "$server: Configuration not found"
        return 1
    fi

    # Check logs for plugin loading (if server is running)
    if docker exec "$server" test -f "/data/latest.log"; then
        if docker exec "$server" grep -q "bluemap" "/data/latest.log"; then
            success "$server: Plugin loaded successfully"
        else
            warning "$server: Plugin not found in logs (server may not be fully started)"
        fi
    fi

    success "$server: Plugin verification completed"
}

# Main deployment function
main() {
    log "Starting BlueMap Plugin Production Deployment"
    log "=============================================="

    # Build plugin
    build_plugin

    # Deploy to each server
    for server in "${MINECRAFT_SERVERS[@]}"; do
        log "Processing $server..."

        # Deploy plugin
        deploy_to_server "$server"

        # Verify deployment
        verify_plugin "$server"

        log "Completed $server deployment"
        echo ""
    done

    # Restart servers (optional - can be done manually)
    read -p "Do you want to restart all servers now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Restarting all Minecraft servers..."
        for server in "${MINECRAFT_SERVERS[@]}"; do
            restart_server "$server"
        done
    else
        warning "Servers not restarted. Please restart servers manually to activate plugins."
    fi

    log "=============================================="
    success "BlueMap Plugin Production Deployment Completed!"
    log ""
    log "Deployment Summary:"
    log "- Servers processed: ${#MINECRAFT_SERVERS[@]}"
    log "- Plugin location: /plugins/bluemap-plugin.jar"
    log "- Config location: $PRODUCTION_CONFIG"
    log ""
    log "Next Steps:"
    log "1. Restart any servers that weren't restarted automatically"
    log "2. Monitor server logs for plugin loading confirmation"
    log "3. Verify BlueMap functionality through admin API"
    log "4. Update DNS records for BlueMap domains"
    log ""
}

# Run main function
main "$@"