#!/bin/bash

# Copy default config if it doesn't exist
if [ ! -f config.yml ]; then
    echo "Copying default configuration..."
    cp /home/bungee/config.yml .
fi

# Start BungeeCord with memory settings
exec java -Xmx1G -Xms512M -jar BungeeCord.jar