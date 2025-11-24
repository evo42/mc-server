#!/bin/bash

# Minecraft Server Infrastructure - Master Deployment Script
# Version: 1.0
# Purpose: Full installation, building and deployment of Minecraft server infrastructure

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Minecraft Server Infrastructure - Master Setup"
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! [ -x "$(command -v docker)" ]; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! [ -x "$(command -v docker-compose)" ]; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if [ ! -d "./admin-ui" ]; then
        print_error "admin-ui directory not found in current directory!"
        exit 1
    fi
    
    if [ ! -d "./mc-ilias-server" ]; then
        print_warn "mc-ilias-server directory not found"
    fi
    
    if [ ! -d "./mc-niilo-server" ]; then
        print_warn "mc-niilo-server directory not found"
    fi
    
    if [ ! -d "./school-server" ]; then
        print_warn "school-server directory not found"
    fi
    
    if [ ! -d "./general-server" ]; then
        print_warn "general-server directory not found"
    fi
    
    print_status "Prerequisites check completed"
}

# Setup directories
setup_directories() {
    print_status "Setting up directories..."
    
    # Create data directories
    mkdir -p ./mc-ilias/data ./mc-ilias/datapacks
    mkdir -p ./mc-niilo/data ./mc-niilo/datapacks
    mkdir -p ./school/data ./school/datapacks
    mkdir -p ./general/data ./general/datapacks
    
    print_status "Directories created"
}

# Source the build script functionality
execute_build() {
    print_status "Building containers..."
chmod +x ./cli/build-containers.sh
    ./cli/build-containers.sh
}

# Execute the deployment
execute_deploy() {
    print_status "Deploying services..."
chmod +x ./cli/deploy-services.sh
    ./cli/deploy-services.sh
}

# Verify the deployment
execute_verify() {
    print_status "Verifying deployment..."
chmod +x ./cli/verify-services.sh
    ./cli/verify-services.sh
}

# Main execution
main() {
    print_status "Starting full Minecraft server infrastructure setup..."
    
    check_prerequisites
    setup_directories
    execute_build
    execute_deploy
    execute_verify
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_status "=================================================="
    print_status "FULL SETUP COMPLETED SUCCESSFULLY!"
    print_status "=================================================="
    print_status "Minecraft Server Infrastructure is now running!"
    print_status "Completed in ${DURATION} seconds"
    print_status ""
    print_status "Services are accessible at:"
    print_status "  Main Admin UI: http://$(hostname):3000"
    print_status "  mc-ilias Admin UI: http://$(hostname):3001"
    print_status "  mc-niilo Admin UI: http://$(hostname):3002"
    print_status "  School Server Admin UI: http://$(hostname):3003"
    print_status "  General Server Admin UI: http://$(hostname):3004"
    print_status ""
    print_status "Available scripts:"
print_status \"  ./cli/build-containers.sh - Build all containers\"
print_status \"  ./cli/deploy-services.sh - Deploy services\"
print_status \"  ./cli/verify-services.sh - Verify deployment\"
print_status \"  ./cli/update-services.sh - Update infrastructure\"
print_status \"  ./cli/maintenance-services.sh - Maintenance operations\"
    print_status "=================================================="
}

# Execute main function
main "$@"