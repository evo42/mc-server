#!/bin/bash

# This script configures the server.properties for all Minecraft servers.

set -e

# List of server directories
SERVERS=("mc-ilias" "mc-niilo" "school-server" "general-server")

# Loop through each server and create the .env.d directory and server.properties file
for SERVER in "${SERVERS[@]}"; do
    echo "Configuring $SERVER..."
    mkdir -p "$SERVER/.env.d"
    echo "online-mode=false" > "$SERVER/.env.d/server.properties"
    
    # Also create the data directory and the main server.properties file if it doesn't exist
    mkdir -p "$SERVER/data"
    if [ ! -f "$SERVER/data/server.properties" ]; then
        echo "Creating initial server.properties for $SERVER"
        cp "$SERVER/.env.d/server.properties" "$SERVER/data/server.properties"
    else
        echo "Updating online-mode in server.properties for $SERVER"
        sed -i '' 's/online-mode=true/online-mode=false/' "$SERVER/data/server.properties"
    fi
done

echo "Server configuration complete."
