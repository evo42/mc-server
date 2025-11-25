#!/bin/bash

# Update Script for Minecraft SaaS Platform

set -e

#!/bin/bash
# Update Script for Minecraft SaaS Platform

set -e

# Source the utility functions
source ./cli/utils.sh

# --- UPDATE FUNCTIONS ---

update_services() {
    print_heading "Updating All Services"
    log_info "Updating all services..."
    ./cli/build.sh
    docker compose up -d --force-recreate
    log_success "All services updated successfully!"
}

update_datapacks() {
    print_heading "Updating Datapack Volumes"
    log_info "Updating datapack volumes in docker-compose.yml..."

    DOCKER_COMPOSE_FILE="docker-compose.yml"
    DATAPACKS_DIR="datapacks"

    DATAPACK_DIRS=$(find . -type d -name "$DATAPACKS_DIR" | grep -v '^\\./\\.')

    VOLUME_MOUNTS=""
    for dir in $DATAPACK_DIRS; do
        SERVER_NAME=$(basename "$(dirname "$dir")")
        SERVER_NAME=$(echo "$SERVER_NAME" | sed 's/-mc-landing//')
        VOLUME_MOUNTS+="      - $dir:/app/$SERVER_NAME/datapacks\\n"
    done

    awk -v mounts="$VOLUME_MOUNTS" '
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
    ' "$DOCKER_COMPOSE_FILE" > "$DOCKER_COMPOSE_FILE.tmp" && mv "$DOCKER_COMPOSE_FILE.tmp" "$DOCKER_COMPOSE_FILE"

    log_success "Successfully updated datapack volumes in $DOCKER_COMPOSE_FILE"
}

# --- MAIN LOGIC ---

help() {
    print_heading "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  services  - Update all services"
    echo "  datapacks - Update datapack volumes in docker-compose.yml"
    echo "  help      - Show this help message"
}

ACTION=${1:-help}

case $ACTION in
    "services")
        update_services
        ;;
    "datapacks")
        update_datapacks
        ;;
    "help")
        help
        ;;
    *)
        log_error "Unknown command: $ACTION"
        help
        exit 1
        ;;
esac
