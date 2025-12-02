#!/bin/bash

# Script to check BlueMap rendering progress for all Minecraft servers
# This script checks the status of rendered data in the bluemap-data directory

set -e  # Exit on any error

echo "BlueMap Progress Check Script"
echo "=============================="

# List of Minecraft servers to check
SERVERS=("mc-basop-bafep-stp" "mc-bgstpoelten" "mc-borgstpoelten" "mc-hakstpoelten" "mc-htlstp" "mc-ilias" "mc-niilo")

echo "Checking rendering progress for all Minecraft servers..."
echo ""

for server in "${SERVERS[@]}"; do
    echo "Server: $server"
    
    # Check if the server has any rendered data
    if [ -d "/opt/mc-server/bluemap-data/$server" ]; then
        # Count the number of map tiles rendered
        tile_count=$(find "/opt/mc-server/bluemap-data/$server" -name "*.png" 2>/dev/null | wc -l)
        tile_size=$(du -sh "/opt/mc-server/bluemap-data/$server" 2>/dev/null | cut -f1)
        
        if [ "$tile_count" -gt 0 ]; then
            echo "  ✓ Rendered tiles: $tile_count tiles"
            echo "  ✓ Data size: $tile_size"
        else
            echo "  ○ Status: Directory exists but no tiles rendered yet"
        fi
    else
        echo "  ✗ Status: No rendered data found"
    fi
    
    # Check if specific map types exist
    if [ -d "/opt/mc-server/bluemap-data/$server/MapHD" ]; then
        hd_count=$(find "/opt/mc-server/bluemap-data/$server/MapHD" -name "*.png" 2>/dev/null | wc -l)
        echo "    - HD Map tiles: $hd_count"
    fi
    
    if [ -d "/opt/mc-server/bluemap-data/$server/Map" ]; then
        flat_count=$(find "/opt/mc-server/bluemap-data/$server/Map" -name "*.png" 2>/dev/null | wc -l)
        echo "    - Flat Map tiles: $flat_count"
    fi
    
    echo ""
done

echo "Progress check completed."
echo ""
echo "To manually trigger rendering, run: /opt/mc-server/render_bluemap_maps.sh"
echo "To monitor rendering logs: docker logs -f mc-bluemap-render-engine"
echo ""
echo "You can also check BlueMap status at the following URLs:"
echo "- mc-basop-bafep-stp: http://localhost:8081"
echo "- mc-bgstpoelten: http://localhost:8082"
echo "- mc-borgstpoelten: http://localhost:8083"
echo "- mc-hakstpoelten: http://localhost:8084"
echo "- mc-htlstp: http://localhost:8085"
echo "- mc-ilias: http://localhost:8086"
echo "- mc-niilo: http://localhost:8087"