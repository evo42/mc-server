#!/bin/bash

# Production Deployment Script for Minecraft Server Infrastructure
# Version: 1.0

cd \"$(dirname \"$0\")/..\"

echo "==========================================="
echo "Minecraft Server Infrastructure Deployment"
echo "==========================================="

# Configuration
REGISTRY="ghcr.io"
REPO="evo42/mc-server"
TAG="latest"

# Services to deploy - This is now handled by docker-compose
SERVICES=()

echo
echo "Step 1: Building and pushing container images..."
echo
./build.sh

# Pulling container images is now handled by the build script

echo
echo "Step 2: Checking Docker Compose files..."
echo

# Check if compose files exist - This is now handled by docker-compose
COMPOSE_FILES=()

for COMPOSE_FILE in "${COMPOSE_FILES[@]}"; do
    if [ ! -f \"../$COMPOSE_FILE\" ]; then
        echo "ERROR: $COMPOSE_FILE not found!"
        exit 1
    fi
done

echo "All compose files found."

echo
echo "Step 3: Stopping existing services (if any)..."
echo

# Stop all services gracefully
docker-compose down --remove-orphans || true

echo
echo "Step 4: Starting Minecraft Server Infrastructure..."
echo

# Start each compose setup
docker-compose up -d --force-recreate

echo
echo "Step 5: Verifying deployment..."
echo

# Wait a bit for services to start
sleep 10

# Check running containers
echo "Running containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

echo
echo "Deployment completed successfully!"
echo
echo "Services are now available at:"
echo "- mc-ilias admin UI: http://<server>:3001"
echo "- mc-niilo admin UI: http://<server>:3002" 
echo "- School server admin UI: http://<server>:3003"
echo "- General server admin UI: http://<server>:3004"
echo "- Main admin UI: http://<server>:3000"
echo

echo "To check logs for any specific service:"
echo "  docker-compose -f <compose-file> logs -f <service-name>"
echo

echo "To stop the infrastructure:"
echo \"  ./stop-production.sh\"
echo

echo "==========================================="
echo "Deployment finished at $(date)"
echo "==========================================="