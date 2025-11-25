#!/bin/bash

# Production Deployment Script for Minecraft Server Infrastructure
# Version: 1.0

set -e  # Exit immediately if a command exits with a non-zero status

echo "==========================================="
echo "Minecraft Server Infrastructure Deployment"
echo "==========================================="

# Configuration
REGISTRY="ghcr.io"
REPO="evo42/mc-server"
TAG="latest"

# Services to deploy
SERVICES=(
    "admin-ui"
    "mc-ilias"
    "ilias-admin-ui"
    "mc-niilo"
    "niilo-admin-ui"
    "school-server"
    "school-admin-ui"
    "general-server"
    "general-admin-ui"
)

echo
echo "Step 1: Building and pushing container images..."
echo
./build-and-push-images.sh

echo
echo "Step 2: Pulling container images from registry..."
echo

for SERVICE in "${SERVICES[@]}"; do
    echo "Pulling ${REGISTRY}/${REPO}/${SERVICE}:${TAG}"
    docker pull ${REGISTRY}/${REPO}/${SERVICE}:${TAG}
done

echo
echo "Step 2: Checking Docker Compose files..."
echo

# Check if compose files exist
COMPOSE_FILES=(
    "docker compose-ilias.yml"
    "docker compose-niilo.yml"
    "docker compose-school.yml"
    "docker compose-general.yml"
)

for COMPOSE_FILE in "${COMPOSE_FILES[@]}"; do
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo "ERROR: $COMPOSE_FILE not found!"
        exit 1
    fi
done

echo "All compose files found."

echo
echo "Step 3: Stopping existing services (if any)..."
echo

# Stop all services gracefully
for COMPOSE_FILE in "${COMPOSE_FILES[@]}"; do
    if [ -f "$COMPOSE_FILE" ]; then
        echo "Stopping services in $COMPOSE_FILE"
        docker compose -f "$COMPOSE_FILE" down --remove-orphans || true
    fi
done

echo
echo "Step 4: Starting Minecraft Server Infrastructure..."
echo

# Start each compose setup
for COMPOSE_FILE in "${COMPOSE_FILES[@]}"; do
    echo "Starting services in $COMPOSE_FILE..."
    docker compose -f "$COMPOSE_FILE" up -d --force-recreate
done

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
echo "  docker compose -f <compose-file> logs -f <service-name>"
echo

echo "To stop the infrastructure:"
echo "  ./stop-production.sh"
echo

echo "==========================================="
echo "Deployment finished at $(date)"
echo "==========================================="