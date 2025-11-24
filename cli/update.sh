#!/bin/bash

# Update Script for Minecraft SaaS Platform

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

# --- UPDATE FUNCTIONS ---

update_services() {
    print_status \"Updating all services...\"
    ./cli/build.sh
    docker-compose up -d --force-recreate
    print_status \"All services updated successfully!\"
}

update_datapacks() {
    print_status \"Updating datapack volumes in docker-compose.yml...\"
    
    DOCKER_COMPOSE_FILE=\"docker-compose.yml\"
    DATAPACKS_DIR=\"datapacks\"

    DATAPACK_DIRS=$(find . -type d -name \"$DATAPACKS_DIR\" | grep -v '^\\./\\.')

    VOLUME_MOUNTS=\"\"
    for dir in $DATAPACK_DIRS; do
        SERVER_NAME=$(basename \"$(dirname \"$dir\")\")
        SERVER_NAME=$(echo \"$SERVER_NAME\" | sed 's/-mc-landing//')
        VOLUME_MOUNTS+=\"      - $dir:/app/$SERVER_NAME/datapacks\\n\"
    done

    awk -v mounts=\"$VOLUME_MOUNTS\" '
        /admin-api:/ { in_admin_api = 1 }
        in_admin_api && /volumes:/ { in_volumes = 1 }
        in_volumes && /datapacks:/ {
            if (!printed) {
                print mounts
                printed = 1
            }
            next
        }
        { print }
    ' \"$DOCKER_COMPOSE_FILE\" > \"$DOCKER_COMPOSE_FILE.tmp\" && mv \"$DOCKER_COMPOSE_FILE.tmp\" \"$DOCKER_COMPOSE_FILE\"

    print_status \"Successfully updated datapack volumes in $DOCKER_COMPOSE_FILE\"
}

# --- MAIN LOGIC ---

help() {
    echo \"Usage: $0 [command]\"
    echo \"\"
    echo \"Commands:\"
    echo \"  services  - Update all services\"
    echo \"  datapacks - Update datapack volumes in docker-compose.yml\"
    echo \"  help      - Show this help message\"
}

ACTION=${1:-help}

case $ACTION in
    \"services\")
        update_services
        ;;
    \"datapacks\")
        update_datapacks
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
