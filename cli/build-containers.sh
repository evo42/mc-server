#!/bin/bash

# Minecraft Server Infrastructure - Build Script
# Version: 1.0
# Purpose: Build all Minecraft server containers and admin UI containers

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Minecraft Server Infrastructure - Build Process"
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
    
    print_status "Docker and Docker Compose are available"
}

# Build admin-ui
build_admin_ui() {
    print_status "Building admin-ui container..."
    
    if [ -d "./admin-ui" ]; then
        cd ./admin-ui
        docker build -t mc-server/admin-ui:latest -t mc-server/admin-ui:prod-v1.0 .
        cd ..
        print_status "admin-ui built successfully"
    else
        print_error "admin-ui directory not found!"
        exit 1
    fi
}

# Build Minecraft server containers
build_minecraft_servers() {
    print_status "Building Minecraft server containers..."
    
    SERVERS=("mc-ilias-server" "mc-niilo-server" "school-server" "general-server")
    
    for SERVER in "${SERVERS[@]}"; do
        if [ -d "./$SERVER" ]; then
            print_status "Building $SERVER container..."
            cd ./$SERVER
            # Check if Dockerfile exists
            if [ -f "Dockerfile" ]; then
                docker build -t mc-server/$(echo $SERVER | sed 's/-server//'):latest -t mc-server/$(echo $SERVER | sed 's/-server//'):prod-v1.0 .
            else
                print_error "Dockerfile not found in $SERVER!"
                exit 1
            fi
            cd ..
            print_status "$SERVER built successfully"
        else
            print_error "$SERVER directory not found!"
            exit 1
        fi
    done
}

# Build admin UI containers for each server
build_server_admin_uis() {
    print_status "Building server-specific admin UI containers..."
    
    SERVERS=("ilias" "niilo" "school" "general")
    
    for SERVER in "${SERVERS[@]}"; do
        print_status "Building ${SERVER}-admin-ui container..."
        # Create a temp dockerfile for server-specific admin UI container
        if [ -d "./admin-ui" ]; then
            docker build -t mc-server/${SERVER}-admin-ui:latest -t mc-server/${SERVER}-admin-ui:prod-v1.0 ./admin-ui
            print_status "${SERVER}-admin-ui built successfully"
        else
            print_error "Base admin-ui directory not found!"
            exit 1
        fi
    done
}

# Tag all images with latest
tag_latest() {
    print_status "Applying 'latest' tags to all images..."
    
    docker tag mc-server/admin-ui:prod-v1.0 mc-server/admin-ui:latest
    docker tag mc-server/mc-ilias:prod-v1.0 mc-server/mc-ilias:latest
    docker tag mc-server/mc-niilo:prod-v1.0 mc-server/mc-niilo:latest
    docker tag mc-server/school-server:prod-v1.0 mc-server/school-server:latest
    docker tag mc-server/general-server:prod-v1.0 mc-server/general-server:latest
    docker tag mc-server/ilias-admin-ui:prod-v1.0 mc-server/ilias-admin-ui:latest
    docker tag mc-server/niilo-admin-ui:prod-v1.0 mc-server/niilo-admin-ui:latest
    docker tag mc-server/school-admin-ui:prod-v1.0 mc-server/school-admin-ui:latest
    docker tag mc-server/general-admin-ui:prod-v1.0 mc-server/general-admin-ui:latest
    
    print_status "All images tagged with 'latest'"
}

# Main execution
main() {
    print_status "Starting build process..."
    
    check_prerequisites
    build_admin_ui
    build_minecraft_servers
    build_server_admin_uis
    tag_latest
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_status "Build process completed successfully in ${DURATION} seconds!"
    print_status "All containers have been built with both 'prod-v1.0' and 'latest' tags."
    print_status "Images built:"
    echo " - mc-server/admin-ui"
    echo " - mc-server/mc-ilias"
    echo " - mc-server/mc-niilo"
    echo " - mc-server/school-server"
    echo " - mc-server/general-server"
    echo " - mc-server/ilias-admin-ui"
    echo " - mc-server/niilo-admin-ui"
    echo " - mc-server/school-admin-ui"
    echo " - mc-server/general-admin-ui"
}

# Execute main function
main "$@"