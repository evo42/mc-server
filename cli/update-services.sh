#!/bin/bash

# Minecraft Server Infrastructure - Update Script
# Version: 1.0
# Purpose: Update the Minecraft server infrastructure to latest versions

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Minecraft Server Infrastructure - Update Process"
echo "=================================================="

START_TIME=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pull latest base images
update_base_images() {
    print_status "Updating base images..."
    
    docker pull itzg/minecraft-server:latest
    docker pull node:18-alpine
    
    print_status "Base images updated"
}

# Rebuild containers with latest changes
rebuild_containers() {
    print_status "Rebuilding containers with latest changes..."
    
    # Build admin-ui
    if [ -d "./admin-ui" ]; then
        cd ./admin-ui
        docker build -t mc-server/admin-ui:latest -t mc-server/admin-ui:prod-v1.0 .
        cd ..
    fi
    
    # Build mc-ilias server
    if [ -d "./mc-ilias-server" ]; then
        cd ./mc-ilias-server
        docker build -t mc-server/mc-ilias:latest -t mc-server/mc-ilias:prod-v1.0 .
        cd ..
    fi
    
    # Build mc-niilo server
    if [ -d "./mc-niilo-server" ]; then
        cd ./mc-niilo-server
        docker build -t mc-server/mc-niilo:latest -t mc-server/mc-niilo:prod-v1.0 .
        cd ..
    fi
    
    # Build school server
    if [ -d "./school-server" ]; then
        cd ./school-server
        docker build -t mc-server/school-server:latest -t mc-server/school-server:prod-v1.0 .
        cd ..
    fi
    
    # Build general server
    if [ -d "./general-server" ]; then
        cd ./general-server
        docker build -t mc-server/general-server:latest -t mc-server/general-server:prod-v1.0 .
        cd ..
    fi
    
    # Build server admin UIs
    if [ -d "./admin-ui" ]; then
        docker build -t mc-server/ilias-admin-ui:latest -t mc-server/ilias-admin-ui:prod-v1.0 ./admin-ui
        docker build -t mc-server/niilo-admin-ui:latest -t mc-server/niilo-admin-ui:prod-v1.0 ./admin-ui
        docker build -t mc-server/school-admin-ui:latest -t mc-server/school-admin-ui:prod-v1.0 ./admin-ui
        docker build -t mc-server/general-admin-ui:latest -t mc-server/general-admin-ui:prod-v1.0 ./admin-ui
    fi
    
    print_status "Containers rebuilt with latest changes"
}

# Restart services with fresh containers
restart_services() {
    print_status "Restarting services with updated containers..."
    
    # Restart each service with force recreate
    docker-compose -f docker-compose-ilias.yml down
    docker-compose -f docker-compose-ilias.yml up -d --force-recreate
    
    sleep 10  # Wait between restarts
    
    docker-compose -f docker-compose-niilo.yml down
    docker-compose -f docker-compose-niilo.yml up -d --force-recreate
    
    sleep 10  # Wait between restarts
    
    docker-compose -f docker-compose-school.yml down
    docker-compose -f docker-compose-school.yml up -d --force-recreate
    
    sleep 10  # Wait between restarts
    
    docker-compose -f docker-compose-general.yml down
    docker-compose -f docker-compose-general.yml up -d --force-recreate
    
    print_status "Services restarted with updated containers"
}

# Verify successful update
verify_update() {
    print_status "Verifying update..."
    
    sleep 15  # Allow time for containers to start
    
    RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "(mc-|ilias-|niilo-|school-|general-)" | wc -l)
    
    if [ "$RUNNING_CONTAINERS" -ge 8 ]; then
        print_status "Update successful! $RUNNING_CONTAINERS containers are running."
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep -E "(mc-|ilias-|niilo-|school-|general-)"
    else
        print_error "Update may have failed! Expected at least 8 containers, but found $RUNNING_CONTAINERS"
        exit 1
    fi
}

# Cleanup old images after update
cleanup_old_images() {
    print_status "Cleaning up old images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Optionally remove unused images (commented out to be safe)
    # docker image prune -a -f
    
    print_status "Cleanup completed"
}

# Main execution
main() {
    print_status "Starting update process..."
    
    update_base_images
    rebuild_containers
    restart_services
    verify_update
    cleanup_old_images
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_status "Update completed successfully in ${DURATION} seconds!"
    print_status "Infrastructure is now running with the latest container versions."
}

# Execute main function
main "$@"