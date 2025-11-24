#!/bin/bash
set -e

echo "--- Minecraft Server Installation ---"

# Create directory
echo "[1/4] Creating minecraft-server directory..."
mkdir -p ~/minecraft-server
cd ~/minecraft-server

# Download server jar
echo "[2/4] Downloading Minecraft server jar (1.21.10)..."
wget -q -O server.jar https://piston-data.mojang.com/v1/objects/95495a7f485eedd84ce928cef5e223b757d2f764/server.jar

# Agree to EULA
echo "[3/4] Agreeing to Minecraft EULA..."
echo "eula=true" > eula.txt

# Done
echo "[4/4] Installation complete!"
echo ""
echo "NOTICE: Minecraft 1.21+ requires Java 21 or higher."
echo "To start your server, run the following commands:"
echo "cd ~/minecraft-server"
echo "java -Xmx1024M -Xms1024M -jar server.jar nogui"
