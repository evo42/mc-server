#!/bin/bash

# Script to trigger BlueMap rendering by accessing the web interfaces
# This uses the API endpoints that should trigger tile generation

set -e  # Exit on any error

echo "BlueMap Web Render Trigger Script"
echo "================================="

# List of BlueMap web interface ports for each server
# Port mapping: server -> port
declare -A SERVER_PORTS
SERVER_PORTS["mc-basop-bafep-stp"]=8081
SERVER_PORTS["mc-bgstpoelten"]=8082
SERVER_PORTS["mc-borgstpoelten"]=8083
SERVER_PORTS["mc-hakstpoelten"]=8084
SERVER_PORTS["mc-htlstp"]=8085
SERVER_PORTS["mc-ilias"]=8086
SERVER_PORTS["mc-niilo"]=8087

# Function to check if a port is accessible
check_port() {
    local port=$1
    if curl -s --connect-timeout 5 "http://localhost:$port" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

echo "Triggering BlueMap rendering for all servers..."
echo ""

for server in "${!SERVER_PORTS[@]}"; do
    port=${SERVER_PORTS[$server]}
    echo "Checking server: $server on port $port"
    
    # Check if the web interface is accessible
    if check_port $port; then
        echo "  ✓ Web interface is accessible"
        
        # Try to access the main page which might trigger initial tile loading
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port")
        echo "  - HTTP response code: $response"
        
        # Access the API endpoint to get map information
        api_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/api/map")
        echo "  - API endpoint response code: $api_response"
        
        # Access the worlds endpoint to trigger world loading
        worlds_response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/api/worlds")
        echo "  - Worlds endpoint response code: $worlds_response"
        
        echo "  ✓ Request sent to $server interface"
    else
        echo "  ✗ Web interface not accessible on port $port"
    fi
    
    echo ""
done

echo "Render triggering completed."
echo ""
echo "To check progress: /opt/mc-server/check_bluemap_progress.sh"
echo "To see the rendered maps, visit the URLs in your browser after rendering is complete."
echo ""
echo "Note: Actual rendering might take time and depends on the size of your Minecraft worlds."