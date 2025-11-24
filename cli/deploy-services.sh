#!/bin/bash

# Minecraft Server Infrastructure - Deployment Script
# Version: 1.0
# Purpose: Deploy all Minecraft server containers and admin UI containers

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Minecraft Server Infrastructure - Deployment"
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

# Check if Docker images exist
check_images() {
    print_status "Checking if required Docker images exist..."
    
    REQUIRED_IMAGES=(
        "mc-server/admin-ui:latest"
        "mc-server/mc-ilias:latest" 
        "mc-server/ilias-admin-ui:latest"
        "mc-server/mc-niilo:latest"
        "mc-server/niilo-admin-ui:latest"
        "mc-server/school-server:latest"
        "mc-server/school-admin-ui:latest"
        "mc-server/general-server:latest"
        "mc-server/general-admin-ui:latest"
    )
    
    for IMG in "${REQUIRED_IMAGES[@]}"; do
        if [[ "$(docker images -q $IMG 2> /dev/null)" == "" ]]; then
            print_error "Required image $IMG does not exist!"
            print_warn "Please run ./build-containers.sh first"
            exit 1
        fi
    done
    
    print_status "All required images exist"
}

# Stop existing services
stop_existing_services() {
    print_status "Stopping existing services if any..."
    
    # Stop any existing instances
    docker-compose -f docker-compose-ilias.yml down --remove-orphans || true
    docker-compose -f docker-compose-niilo.yml down --remove-orphans || true
    docker-compose -f docker-compose-school.yml down --remove-orphans || true
    docker-compose -f docker-compose-general.yml down --remove-orphans || true
    
    # Remove any leftover networks
    docker network ls | grep mc-server_ | awk '{print $1}' | xargs -r docker network rm 2>/dev/null || true
    
    print_status "Existing services stopped"
}

# Deploy all services
deploy_services() {
    print_status "Deploying services..."
    
    # Create necessary data directories
    mkdir -p ./mc-ilias/data ./mc-ilias/datapacks
    mkdir -p ./mc-niilo/data ./mc-niilo/datapacks
    mkdir -p ./school/data ./school/datapacks
    mkdir -p ./general/data ./general/datapacks
    
    # Deploy each service
    print_status "Deploying mc-ilias service..."
    docker-compose -f docker-compose-ilias.yml up -d --force-recreate
    
    sleep 5  # Brief pause between deployments
    
    print_status "Deploying mc-niilo service..."
    docker-compose -f docker-compose-niilo.yml up -d --force-recreate
    
    sleep 5  # Brief pause between deployments
    
    print_status "Deploying school service..."
    docker-compose -f docker-compose-school.yml up -d --force-recreate
    
    sleep 5  # Brief pause between deployments
    
    print_status "Deploying general service..."
    docker-compose -f docker-compose-general.yml up -d --force-recreate
    
    print_status "All services deployed"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    sleep 10  # Allow time for containers to start
    
    RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -c "mc-" || echo "0")
    
    if [ "$RUNNING_CONTAINERS" -ge 8 ]; then
        print_status "Deployment verification successful! $RUNNING_CONTAINERS containers are running."
        
        echo
        print_status "Running containers:"
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep mc-
        echo
        
        print_status "Services are accessible at:"
        print_status "  Main Admin UI: http://$(hostname):3000"
        print_status "  mc-ilias Admin UI: http://$(hostname):3001"
        print_status "  mc-niilo Admin UI: http://$(hostname):3002"
        print_status "  School Server Admin UI: http://$(hostname):3003"
        print_status "  General Server Admin UI: http://$(hostname):3004"
    else
        print_error "Deployment verification failed! Expected at least 8 containers, but found $RUNNING_CONTAINERS"
        exit 1
    fi
}

# Main execution
main() {
    print_status "Starting deployment process..."
    
    check_images
    stop_existing_services
    deploy_services
    verify_deployment
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_status "Deployment completed successfully in ${DURATION} seconds!"
    print_status "All Minecraft server services are now running and accessible via their designated ports."
}

# Execute main function
main "$@"