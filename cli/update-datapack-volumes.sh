#!/bin/bash

# This script generates the volume mounts for the admin-api service in the docker-compose.yml file.
# It scans the project for all directories that contain a 'datapacks' subdirectory and then
# generates the appropriate volume mount configuration.

set -e

DOCKER_COMPOSE_FILE="docker-compose.yml"
ADMIN_API_SERVICE="admin-api"
DATAPACKS_DIR="datapacks"

# Find all directories containing a 'datapacks' subdirectory
DATAPACK_DIRS=$(find . -type d -name "$DATAPACKS_DIR" | grep -v '^\./\.')

# Generate the volume mount configuration
VOLUME_MOUNTS=""
for dir in $DATAPACK_DIRS; do
    SERVER_NAME=$(basename "$(dirname "$dir")")
    SERVER_NAME=$(echo "$SERVER_NAME" | sed 's/-mc-landing//')
    VOLUME_MOUNTS+="      - $dir:/app/$SERVER_NAME/datapacks\n"
done

# Update the docker-compose.yml file
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

echo "Successfully updated datapack volumes in $DOCKER_COMPOSE_FILE"

