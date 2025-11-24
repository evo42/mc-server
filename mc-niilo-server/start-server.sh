#!/bin/bash

echo "Starting Minecraft server..."

# The itzg/minecraft-server image handles the server startup,
# but we can run additional setup here if needed

# Check if there are any datapacks in the external datapacks directory to install
if [ -d "/data/datapacks" ] && [ "$(ls -A /data/datapacks)" ]; then
    echo "Installing datapacks..."
    # Copy any provided datapacks to the server's datapacks folder
    cp -n /data/datapacks/* /data/world/datapacks/ 2>/dev/null || true
fi

# Run the original entrypoint with the provided parameters
exec /start-minecraft