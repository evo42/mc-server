#!/bin/bash

set -e

echo "Starting Minecraft server..."

# Set the server directory
SERVER_DIR=${SERVER_DIR:-/data}

# Create server directory if it doesn't exist
mkdir -p $SERVER_DIR
cd $SERVER_DIR

# Accept EULA if not already done
if [ ! -f "eula.txt" ]; then
    echo "#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula)." > eula.txt
    echo "#$(date)" >> eula.txt
    echo "eula=$EULA" >> eula.txt
else
    # Update EULA value in existing file
    sed -i "s/eula=.*/eula=$EULA/" eula.txt
fi

# Create/update server.properties if needed
if [ ! -f "server.properties" ]; then
    echo "Creating default server.properties..."
    touch server.properties
fi

# Update server properties with environment variables
sed -i "s/^motd=.*/motd=$MOTD/" server.properties 2>/dev/null || echo "motd=$MOTD" >> server.properties
sed -i "s/^online-mode=.*/online-mode=$ONLINE_MODE/" server.properties 2>/dev/null || echo "online-mode=$ONLINE_MODE" >> server.properties
sed -i "s/^enable-proxy-connections=.*/enable-proxy-connections=$ENABLE_PROXY_CONNECTIONS/" server.properties 2>/dev/null || echo "enable-proxy-connections=$ENABLE_PROXY_CONNECTIONS" >> server.properties

# Check if there are any datapacks in the external datapacks directory to install
if [ -d "/data/datapacks" ] && [ "$(ls -A /data/datapacks 2>/dev/null)" ]; then
    echo "Installing datapacks..."
    # Ensure world/datapacks exists
    mkdir -p world/datapacks
    # Copy any provided datapacks to the server's datapacks folder
    cp -n /data/datapacks/* world/datapacks/ 2>/dev/null || true
fi

# Set up proper JVM options based on environment
MEMORY_OPTS="-Xms${MEMORY:-4G} -Xmx${MAX_MEMORY:-8G}"

echo "Starting server with options: $MEMORY_OPTS"

# Start the Minecraft server with the jar file and proper options
exec java $MEMORY_OPTS -jar /app/server.jar nogui