#!/bin/bash
#
# backup.sh
#
# Creates a timestamped backup of all Minecraft server data and key configuration files.

set -euo pipefail

echo "▶ Starting Minecraft SaaS Platform Backup..."

# 1. Define directories and files to back up
# --------------------------------------------------
BACKUP_ROOT_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT_DIR}/${TIMESTAMP}"

# List of server data directories to be archived
# These correspond to the `data_path` and `datapacks_path` parent dirs in minecraft.tf
SERVER_DATA_DIRS=(
    "mc-ilias"
    "mc-niilo"
    "bgstpoelten-mc-landing"
    "htlstp-mc-landing"
    "borgstpoelten-mc-landing"
    "hakstpoelten-mc-landing"
    "basop-bafep-stp-mc-landing"
    "play-mc-landing"
)

# List of essential configuration files
CONFIG_FILES=(
    ".env"
    "main.tf"
    "variables.tf"
    "minecraft.tf"
    "admin-api.tf"
    "bungeecord.tf"
    "nginx.tf"
    "watchtower.tf"
)

# 2. Create backup directory
# --------------------------------------------------
echo "  - Creating backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/servers"
mkdir -p "${BACKUP_DIR}/config"

# 3. Back up configuration files
# --------------------------------------------------
echo "  - Backing up configuration files..."
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "${BACKUP_DIR}/config/"
    else
        echo "    - Warning: Config file not found, skipping: $file"
    fi
done

# 4. Archive server data volumes
# --------------------------------------------------
echo "  - Archiving Minecraft server data..."
for dir in "${SERVER_DATA_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        ARCHIVE_NAME="${BACKUP_DIR}/servers/${dir}.tar.gz"
        echo "    - Archiving ${dir} to ${ARCHIVE_NAME}"
        tar -czf "${ARCHIVE_NAME}" "$dir"
    else
        echo "    - Warning: Server data directory not found, skipping: $dir"
    fi
done

echo "✔ Backup complete!"
echo "  - Location: ${BACKUP_DIR}"
echo "  - Size: $(du -sh "${BACKUP_DIR}" | cut -f1)"

exit 0
