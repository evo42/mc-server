#!/bin/bash

# Admin UI Management Script for Minecraft SaaS Platform

set -e

# --- HELPERS ---

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

print_status() {
    echo -e \"${GREEN}[INFO]${NC} $1\"
}

print_warn() {
    echo -e \"${YELLOW}[WARN]${NC} $1\"
}

print_error() {
    echo -e \"${RED}[ERROR]${NC} $1\"
}

# --- DIAGNOSTIC FUNCTIONS ---

check_admin_ui_container() {
    print_status \"Checking if mc-admin-ui container is running...\"
    if docker ps | grep -q \"mc-admin-ui\"; then
        print_status \"mc-admin-ui container is running\"
        return 0
    else
        print_error \"mc-admin-ui container is NOT running\"
        return 1
    fi
}

check_port_accessibility() {
    print_status \"Checking port 3000 accessibility...\"
    if curl -s -m 10 http://localhost:3000/ > /dev/null 2>&1; then
        print_status \"Port 3000 is accessible via HTTP\"
    else
        print_error \"Port 3000 is NOT accessible via HTTP\"
    fi
}

check_compose_config() {
    print_status \"Checking Docker Compose configuration...\"
    if [ -f \"docker-compose.yml\" ]; then
        if grep -q \"mc-admin-ui\" docker-compose.yml; then
            print_status \"Found mc-admin-ui in docker-compose.yml\"
        else
            print_warn \"mc-admin-ui not found in docker-compose.yml\"
        fi
    else
        print_error \"No docker-compose.yml file found\"
    fi
}

# --- FIX FUNCTIONS ---

ensure_image_exists() {
    print_status \"Checking if mc-server/admin-ui image exists...\"
    if [[ \"$(docker images -q mc-server/admin-ui:latest 2> /dev/null)\" == \"\" ]]; then
        print_status \"Building mc-server/admin-ui image...\"
        ./cli/build.sh spa
    else
        print_status \"mc-server/admin-ui image already exists\"
    fi
}

deploy_admin_ui() {
    print_status \"Deploying admin UI service...\"
    docker-compose up -d --force-recreate mc-admin-ui
    print_status \"Admin UI service deployed\"
}

# --- MAIN LOGIC ---

diagnose() {
    print_status \"Running Admin UI diagnostics...\"
    check_admin_ui_container
    check_port_accessibility
    check_compose_config
    print_status \"Diagnostics complete.\"
}

fix() {
    print_status \"Attempting to fix Admin UI...\"
    ensure_image_exists
    deploy_admin_ui
    print_status \"Fix attempt complete.\"
}

help() {
    echo \"Usage: $0 [command]\"
    echo \"\"
    echo \"Commands:\"
    echo \"  diagnose - Run diagnostic checks on the Admin UI\"
    echo \"  fix      - Attempt to fix common Admin UI issues\"
    echo \"  help     - Show this help message\"
}

ACTION=${1:-help}

case $ACTION in
    \"diagnose\")
        diagnose
        ;;
    \"fix\")
        fix
        ;;
    \"help\")
        help
        ;;
    *)
        print_error \"Unknown command: $ACTION\"
        help
        exit 1
        ;;
esac
