#!/bin/bash

# Production Shutdown Script for Minecraft Server Infrastructure
# Version: 1.0

set -e  # Exit immediately if a command exits with a non-zero status

echo "==========================================="
echo "Shutting down Minecraft Server Infrastructure"
echo "==========================================="

# Compose files to shut down
COMPOSE_FILES=(
    "docker compose-ilias.yml"
    "docker compose-niilo.yml"
    "docker compose-school.yml"
    "docker compose-general.yml"
)

echo
echo "Stopping all services..."

for COMPOSE_FILE in "${COMPOSE_FILES[@]}"; do
    if [ -f "$COMPOSE_FILE" ]; then
        echo "Stopping services in $COMPOSE_FILE..."
        docker compose -f "$COMPOSE_FILE" down --remove-orphans
    fi
done

echo
echo "Removing unused Docker resources..."

# Clean up unused containers, networks, and images
docker system prune -f

echo
echo "Infrastructure shutdown complete!"
echo "Stopped all Minecraft server services."
echo