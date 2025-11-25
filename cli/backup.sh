#!/bin/bash
#
# backup.sh
#
# Creates a timestamped backup of all Minecraft server data and key configuration files.

set -euo pipefail

echo "▶ Starting Minecraft SaaS Platform Backup..."

# Source environment variables
if [ -f .env ]; then
    source .env
fi

# 1. Define directories and files to back up
# --------------------------------------------------
BACKUP_ROOT_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT_DIR}/${TIMESTAMP}"

# List of server data directories to be archived
SERVER_DATA_DIRS=(
    "mc-ilias"
    "mc-niilo"
    "landing/bgstpoelten"
    "landing/htlstp"
    "landing/borgstpoelten"
    "landing/hakstpoelten"
    "landing/basop-bafep-stp"
    "landing/play"
)

# 2. Create backup directory
# --------------------------------------------------
echo "  - Creating backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/servers"

# 3. Archive server data volumes
# --------------------------------------------------
echo "  - Archiving Minecraft server data..."
for dir in "${SERVER_DATA_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        ARCHIVE_NAME="${BACKUP_DIR}/servers/${dir//\//_}.tar.gz"
        echo "    - Archiving ${dir} to ${ARCHIVE_NAME}"
        tar -czf "${ARCHIVE_NAME}" "$dir"
    else
        echo "    - Warning: Server data directory not found, skipping: $dir"
    fi
done

# 4. Upload to S3
# --------------------------------------------------
if [ -n "$S3_ENDPOINT" ]; then
    echo "  - Uploading backups to S3..."
    docker-compose exec -T mc-client sh -c "
        mc config host add s3 $S3_ENDPOINT $S3_ACCESS_KEY $S3_SECRET_KEY;
        mc mb s3/$S3_BUCKET || true;
        mc cp --recursive /backups/$TIMESTAMP/ s3/$S3_BUCKET/backups/$TIMESTAMP/;
    "
    echo "  - Removing local backups..."
    rm -rf "${BACKUP_DIR}"
fi

echo "✔ Backup complete!"
echo "  - Location: ${BACKUP_DIR}"
echo "  - Size: $(du -sh "${BACKUP_DIR}" | cut -f1)"

exit 0
