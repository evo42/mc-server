#!/bin/bash

# Minecraft Server Infrastructure - Admin UI Diagnostic Script
# Purpose: Diagnose and fix Admin UI accessibility issues

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Admin UI Diagnostic Script"
echo "=================================================="

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

# Check if mc-admin-ui container is running
check_admin_ui_container() {
    print_status "Checking if mc-admin-ui container is running..."
    
    if docker ps | grep -q "mc-admin-ui"; then
        print_status "mc-admin-ui container is running"
        
        # Get container ID and details
        CONTAINER_ID=$(docker ps --filter "name=mc-admin-ui" --format "{{.ID}}")
        print_status "mc-admin-ui container ID: $CONTAINER_ID"
        
        # Check if it's listening on port 3000
        PORT_INFO=$(docker port "$CONTAINER_ID" 3000 2>/dev/null || echo "Not mapped")
        print_status "Port mapping: $PORT_INFO"
        
        # Check container logs for errors
        print_status "Latest logs from mc-admin-ui:"
        docker logs --tail 20 mc-admin-ui
        
        return 0
    else
        print_error "mc-admin-ui container is NOT running"
        
        # Check if container exists but is stopped
        if docker ps -a | grep -q "mc-admin-ui"; then
            print_warn "mc-admin-ui container exists but is stopped"
            print_status "Last logs from mc-admin-ui (before stopping):"
            docker logs --tail 20 mc-admin-ui 2>/dev/null || echo "No logs available"
        else
            print_error "mc-admin-ui container does not exist"
        fi
        
        return 1
    fi
}

# Check port accessibility
check_port_accessibility() {
    print_status "Checking port 3000 accessibility..."
    
    # Check if port 3000 is in use
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "Port 3000 is in use"
        CONNECTION=$(netstat -tlnp 2>/dev/null | grep ":3000 ")
        echo "Port details: $CONNECTION"
    else
        print_error "Port 3000 is not listening or in use"
    fi
    
    # Check if accessible via curl
    if curl -s -m 10 http://localhost:3000/ > /dev/null 2>&1; then
        print_status "Port 3000 is accessible via HTTP"
    else
        print_error "Port 3000 is NOT accessible via HTTP"
    fi
}

# Check Docker Compose configuration
check_compose_config() {
    print_status "Checking Docker Compose configuration for mc-admin-ui..."
    
    if [ -f "docker-compose.yml" ]; then
        print_status "Found docker-compose.yml"
        if grep -A 15 -B 5 "mc-admin-ui" docker-compose.yml; then
            print_status "Found mc-admin-ui in docker-compose.yml"
        else
            print_warn "mc-admin-ui not found in docker-compose.yml"
        fi
    elif [ -f "docker-compose-main-prod.yml" ]; then
        print_status "Found docker-compose-main-prod.yml"
        if grep -A 15 -B 5 "mc-admin-ui" docker-compose-main-prod.yml; then
            print_status "Found mc-admin-ui in docker-compose-main-prod.yml"
        else
            print_warn "mc-admin-ui not found in docker-compose-main-prod.yml"
        fi
    else
        print_error "No recognized docker-compose file found"
    fi
}

# Restart mc-admin-ui container if needed
restart_admin_ui() {
    print_status "Attempting to restart mc-admin-ui container..."
    
    # Bring down the service
    docker-compose -f docker-compose-main-prod.yml down || true
    sleep 5
    
    # Bring up the service
    docker-compose -f docker-compose-main-prod.yml up -d --force-recreate
    
    print_status "mc-admin-ui has been restarted"
    
    # Wait a bit for it to start
    sleep 10
    
    # Check if it's running
    if docker ps | grep -q "mc-admin-ui"; then
        print_status "mc-admin-ui is now running"
        
        # Check logs for any startup errors
        print_status "Checking startup logs:"
        docker logs --tail 10 mc-admin-ui
    else
        print_error "mc-admin-ui failed to restart"
        return 1
    fi
}

# Main execution
main() {
    print_status "Starting Admin UI diagnostic process..."
    
    # Run checks
    check_admin_ui_container
    check_port_accessibility
    check_compose_config
    
    echo
    print_status "Diagnostic summary:"
    
    # Determine if we need to restart
    if ! docker ps | grep -q "mc-admin-ui"; then
        print_status "mc-admin-ui container not running, attempting restart..."
        restart_admin_ui
    else
        CONTAINER_ID=$(docker ps --filter "name=mc-admin-ui" --format "{{.ID}}")
        PORT_INFO=$(docker port "$CONTAINER_ID" 3000 2>/dev/null)
        
        if [ "$PORT_INFO" = "Not mapped" ] || [ -z "$PORT_INFO" ]; then
            print_error "Port 3000 is not mapped for mc-admin-ui container"
            print_warn "Need to recreate container with proper port mapping"
            restart_admin_ui
        else
            print_status "Container and port mapping seem correct"
            print_warn "Issue might be with the application inside the container"
            print_status "Consider checking the application logs for errors"
        fi
    fi
    
    echo
    print_status "If issues persist, try:"
    echo "  1. Check the application logs: docker logs mc-admin-ui"
    echo "  2. Verify the application is running inside container: docker exec mc-admin-ui ps aux"
    echo "  3. Check if the application is listening on the right port inside container: docker exec mc-admin-ui netstat -tlnp"
    echo "  4. Try rebuilding the image: docker build -t mc-server/admin-ui:latest ./admin-ui"
    echo "  5. Redeploy: docker-compose -f docker-compose-main-prod.yml up -d --force-recreate"
}

# Execute main function
main "$@"