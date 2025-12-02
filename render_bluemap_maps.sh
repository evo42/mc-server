#!/bin/bash

# Script to manually render BlueMap maps for all Minecraft servers
# This script uses the BlueMap CLI inside the render engine container to render maps

set -e  # Exit on any error

echo "BlueMap Manual Render Script"
echo "============================="

# Container name for the BlueMap render engine
BLUEMAP_CONTAINER="mc-bluemap-render-engine"

# Check if the container is running
if ! docker ps -q -f name=$BLUEMAP_CONTAINER | grep -q .; then
    echo "Error: BlueMap render engine container ($BLUEMAP_CONTAINER) is not running."
    echo "Please start the container first using: docker compose up -d bluemap-render-engine"
    exit 1
fi

echo "BlueMap render engine container is running."
echo ""

# List of Minecraft servers to render
SERVERS=("mc-basop-bafep-stp" "mc-bgstpoelten" "mc-borgstpoelten" "mc-hakstpoelten" "mc-htlstp" "mc-ilias" "mc-niilo")

echo "Starting render process for all Minecraft servers..."
echo ""

for server in "${SERVERS[@]}"; do
    echo "Rendering maps for server: $server"
    
    # Execute the BlueMap render command for each world
    # The command uses BlueMap CLI to render the specific world
    docker exec $BLUEMAP_CONTAINER java -jar cli.jar -c /app/config -r -w $server
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully started rendering for $server"
    else
        echo "✗ Error rendering $server"
    fi
    
    echo ""
done

echo "Render commands sent for all servers."
echo ""
echo "To check rendering progress, you can:"
echo "1. Check the web interfaces at http://localhost:[port] for each server"
echo "2. Monitor the render engine logs: docker logs -f mc-bluemap-render-engine"
echo "3. Check rendered map files in the bluemap-data directory"
echo ""
echo "Note: Rendering can take a long time depending on the size of your worlds."
echo "The BlueMap web interfaces will show the maps once rendering is complete."