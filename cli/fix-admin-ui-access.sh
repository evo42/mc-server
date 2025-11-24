#!/bin/bash

# Minecraft Server Infrastructure - Admin UI Accessibility Fix
# Purpose: Ensure Admin UI is properly accessible on production server

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Admin UI Accessibility Fix Script"
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

# Create a standalone Admin UI docker-compose file that focuses just on main admin UI
create_standalone_admin_ui() {
    print_status "Creating standalone admin UI configuration..."
    
    cat > docker-compose-admin-ui.yml << 'EOF'
version: '3.8'

services:
  mc-admin-ui:
    build: ./admin-ui  # Build from local source
    container_name: mc-admin-ui
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # To interact with Docker
      - ./mc-ilias/datapacks:/app/mc-ilias/datapacks  # Access to mc-ilias datapacks
      - ./mc-niilo/datapacks:/app/mc-niilo/datapacks  # Access to mc-niilo datapacks
    environment:
      - NODE_ENV=production
      - ADMIN_USER=${ADMIN_USER:-admin}
      - ADMIN_PASS=${ADMIN_PASS:-admin123}
    restart: unless-stopped
    networks:
      - admin_ui_network

networks:
  admin_ui_network:
    driver: bridge
EOF

    print_status "Standalone admin UI configuration created"
}

# Ensure proper image exists
ensure_image_exists() {
    print_status "Checking if mc-server/admin-ui image exists..."
    
    if [[ "$(docker images -q mc-server/admin-ui:latest 2> /dev/null)" == "" ]]; then
        print_status "Building mc-server/admin-ui image from source..."
        if [ -d "./admin-ui" ]; then
            cd ./admin-ui
            docker build -t mc-server/admin-ui:latest -t mc-server/admin-ui:prod-v1.0 .
            cd ..
            print_status "mc-server/admin-ui image built successfully"
        else
            print_error "admin-ui directory not found!"
            exit 1
        fi
    else
        print_status "mc-server/admin-ui image already exists"
    fi
}

# Deploy standalone admin UI
deploy_standalone_admin_ui() {
    print_status "Deploying standalone admin UI service..."
    
    docker-compose -f docker-compose-admin-ui.yml down --remove-orphans || true
    sleep 5
    docker-compose -f docker-compose-admin-ui.yml up -d --force-recreate
    
    print_status "Standalone admin UI service deployed"
}

# Verify admin UI accessibility
verify_admin_ui_accessibility() {
    print_status "Waiting for admin UI to be accessible..."
    
    # Wait a bit for container to start
    sleep 15
    
    # Check if container is running
    if docker ps | grep -q "mc-admin-ui"; then
        print_status "mc-admin-ui container is running"
        
        # Check if port 3000 is accessible
        if curl -s -m 10 http://localhost:3000/ > /dev/null 2>&1; then
            print_status "SUCCESS: Admin UI is accessible at http://localhost:3000"
        else
            print_error "Admin UI is not accessible at http://localhost:3000"
            
            # Try to get more details
            print_status "Checking container logs:"
            docker logs mc-admin-ui
            
            # Check what's using port 3000
            print_status "Checking what's using port 3000:"
            lsof -i :3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 || echo "No process found using port 3000"
            
            return 1
        fi
    else
        print_error "mc-admin-ui container is not running"
        return 1
    fi
}

# Update main production compose to ensure correct port exposure
update_main_compose() {
    print_status "Ensuring main docker-compose includes admin UI configuration..."
    
    # Check if the main compose file exists with correct admin UI configuration
    if [ -f "docker-compose-main-prod.yml" ]; then
        print_status "Main production compose file exists"
        # The file should already have the correct configuration
    else
        print_status "Creating main admin UI compose file with proper configuration..."
        cat > docker-compose-main.yml << 'EOF'
version: '3.8'

services:
  mc-admin-ui:
    image: mc-server/admin-ui:prod-v1.0  # Use built image
    container_name: mc-admin-ui
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # To interact with Docker
      - ./mc-ilias/datapacks:/app/mc-ilias/datapacks  # Access to mc-ilias datapacks
      - ./mc-niilo/datapacks:/app/mc-niilo/datapacks  # Access to mc-niilo datapacks
    environment:
      - NODE_ENV=production
      - ADMIN_USER=${ADMIN_USER:-admin}
      - ADMIN_PASS=${ADMIN_PASS:-admin123}
    restart: unless-stopped
    networks:
      - admin_network

networks:
  admin_network:
    driver: bridge
EOF
    fi
}

# Main execution
main() {
    print_status "Starting Admin UI accessibility fix process..."
    
    ensure_image_exists
    update_main_compose
    create_standalone_admin_ui
    deploy_standalone_admin_ui
    verify_admin_ui_accessibility
    
    echo
    print_status "============================"
    print_status "ADMIN UI DEPLOYMENT SUMMARY:"
    print_status "============================"
    print_status "Admin UI is now deployed and should be accessible at:"
    print_status "  http://161.97.82.122:3000"
    print_status ""
    print_status "Configuration files created:"
    print_status "  - docker-compose-main.yml (main admin UI)"
    print_status "  - docker-compose-admin-ui.yml (standalone for testing)"
    print_status ""
    print_status "To manage the service:"
    print_status "  - Deploy: docker-compose -f docker-compose-main.yml up -d"
    print_status "  - Stop: docker-compose -f docker-compose-main.yml down"
    print_status "  - View logs: docker logs mc-admin-ui -f"
    print_status "============================"
}

# Execute main function
main "$@"