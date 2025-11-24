#!/bin/bash

# Minecraft Server Infrastructure - Verification Script
# Version: 1.0
# Purpose: Verify the status and health of the deployed Minecraft server infrastructure

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Minecraft Server Infrastructure - Verification"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[STATUS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verify all containers are running
verify_containers() {
    echo
    print_info "Verifying running containers..."
    
    RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "(mc-|ilias-|niilo-|school-|general-)" | wc -l)
    TOTAL_EXPECTED=10  # 5 servers + 5 admin UIs
    
    print_status "$RUNNING_CONTAINERS out of $TOTAL_EXPECTED expected containers are running"
    
    if [ "$RUNNING_CONTAINERS" -lt "$TOTAL_EXPECTED" ]; then
        print_warn "Not all containers are running. Details:"
        docker ps -a | grep -E "(mc-|ilias-|niilo-|school-|general-)"
        return 1
    else
        print_status "All containers are running!"
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep -E "(mc-|ilias-|niilo-|school-|general-)"
    fi
}

# Verify ports are accessible
verify_ports() {
    echo
    print_info "Verifying port accessibility..."
    
    PORTS=(3000 3001 3002 3003 3004)
    
    for PORT in "${PORTS[@]}"; do
        if nc -z localhost $PORT; then
            print_status "Port $PORT is accessible"
        else
            print_warn "Port $PORT is not accessible"
        fi
    done
}

# Verify container health
verify_health() {
    echo
    print_info "Checking container health status..."
    
    CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "(mc-|ilias-|niilo-|school-|general-)")
    
    for CONTAINER in $CONTAINERS; do
        HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "Not Applicable")
        
        if [ "$HEALTH_STATUS" = "healthy" ] || [ "$HEALTH_STATUS" = "Not Applicable" ]; then
            print_status "$CONTAINER is $HEALTH_STATUS"
        else
            print_warn "$CONTAINER is $HEALTH_STATUS"
        fi
    done
}

# Verify resource allocation
verify_resources() {
    echo
    print_info "Checking resource allocations..."
    
    # Check memory usage
    print_status "Current resource usage:"
    docker stats --no-stream | grep -E "(mc-|ilias-|niilo-|school-|general-)" || echo "Could not retrieve stats"
}

# Verify images
verify_images() {
    echo
    print_info "Checking Docker images..."
    
    IMAGES=(
        "mc-server/admin-ui"
        "mc-server/mc-ilias"
        "mc-server/ilias-admin-ui"
        "mc-server/mc-niilo"
        "mc-server/niilo-admin-ui"
        "mc-server/school-server"
        "mc-server/school-admin-ui"
        "mc-server/general-server"
        "mc-server/general-admin-ui"
    )
    
    for IMG in "${IMAGES[@]}"; do
        EXISTS=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "$IMG" | wc -l)
        if [ "$EXISTS" -gt 0 ]; then
            print_status "$IMG is available (with $(docker images --format "{{.Repository}}:{{.Tag}}" | grep "$IMG" | wc -l) tag(s))"
        else
            print_warn "$IMG is NOT available"
        fi
    done
}

# Check service connectivity (basic connectivity tests)
test_service_connectivity() {
    echo
    print_info "Testing service connectivity..."
    
    # Test admin UIs
    for PORT in 3000 3001 3002 3003 3004; do
        if curl -s -f -m 5 http://localhost:$PORT/ >/dev/null 2>&1; then
            print_status "Admin UI at port $PORT is responding"
        else
            print_warn "Admin UI at port $PORT may not be responding"
        fi
    done
}

# Generate summary
generate_summary() {
    echo
    print_info "SUMMARY:"
    
    echo "Services deployed:"
    echo "  - Main Admin UI: http://<server>:3000"
    echo "  - mc-ilias Server + Admin UI: http://<server>:3001"
    echo "  - mc-niilo Server + Admin UI: http://<server>:3002"
    echo "  - School Server + Admin UI: http://<server>:3003"
    echo "  - General Server + Admin UI: http://<server>:3004"
    
    echo
    echo "Configuration:"
    echo "  - Memory Allocation: 5G minimum, 100G maximum"
    echo "  - Dedicated networks for each server"
    echo "  - Dedicated admin UI for each server"
}

# Main execution
main() {
    print_status "Starting verification process..."
    
    verify_containers
    verify_ports
    verify_health
    verify_resources
    verify_images
    test_service_connectivity
    generate_summary
    
    print_status "Verification process completed!"
}

# Execute main function
main "$@"