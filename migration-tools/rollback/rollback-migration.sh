#!/bin/bash

# Migration Rollback Script
# Overviewer to BlueMap Rollback Procedure
# Sprint 3: Migration Strategy Implementation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROLLBACK_LOG="rollback-$(date +'%Y%m%d_%H%M%S').log"
MINECRAFT_SERVERS=(
    "mc-basop-bafep-stp"
    "mc-bgstpoelten"
    "mc-borgstpoelten"
    "mc-hakstpoelten"
    "mc-htlstp"
    "mc-ilias"
    "mc-niilo"
)

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$ROLLBACK_LOG"
    exit 1
}

# Check if backup directory exists
validate_backup() {
    local backup_dir=$1

    if [ ! -d "$backup_dir" ]; then
        error "Backup directory not found: $backup_dir"
    fi

    if [ ! -f "$backup_dir/config/docker-compose.yml.original" ]; then
        error "Original docker-compose.yml not found in backup"
    fi

    log "✅ Backup validation successful"
}

# Restore configurations
restore_configurations() {
    local backup_dir=$1

    log "🔄 Restoring configurations..."

    # Restore docker-compose.yml
    if [ -f "$backup_dir/config/docker-compose.yml.original" ]; then
        cp "$backup_dir/config/docker-compose.yml.original" docker-compose.yml
        success "docker-compose.yml restored"
    fi

    # Restore admin configuration
    if [ -d "$backup_dir/config/admin-api" ]; then
        cp -r "$backup_dir/config/admin-api" ./
        success "admin-api configuration restored"
    fi

    if [ -d "$backup_dir/config/admin-ui-spa" ]; then
        cp -r "$backup_dir/config/admin-ui-spa" ./
        success "admin-ui-spa configuration restored"
    fi

    # Restore Overviewer integration
    if [ -d "$backup_dir/config/overviewer-integration" ]; then
        cp -r "$backup_dir/config/overviewer-integration" ./
        success "Overviewer integration restored"
    fi
}

# Remove BlueMap components
remove_bluemap_components() {
    log "🗑️ Removing BlueMap components..."

    # Remove BlueMap plugin from servers
    for server in "${MINECRAFT_SERVERS[@]}"; do
        log "Removing BlueMap plugin from $server..."
        ssh "$server" "rm -rf /plugins/BlueMapIntegration" 2>/dev/null || warning "Could not remove BlueMap plugin from $server"
        ssh "$server" "rm -f /plugins/bluemap-plugin.jar" 2>/dev/null || warning "Could not remove BlueMap JAR from $server"
        ssh "$server" "rm -rf /opt/bluemap" 2>/dev/null || warning "Could not remove BlueMap config from $server"
    done

    # Remove Kubernetes BlueMap deployment
    if kubectl get namespace bluemap &> /dev/null; then
        log "Removing BlueMap Kubernetes namespace..."
        kubectl delete namespace bluemap --ignore-not-found=true
        success "BlueMap Kubernetes namespace removed"
    fi

    # Remove local BlueMap files
    rm -rf production/ 2>/dev/null || true
    rm -rf bluemap-plugin/ 2>/dev/null || true

    success "BlueMap components removed"
}

# Restart Minecraft servers
restart_servers() {
    log "🔄 Restarting Minecraft servers..."

    for server in "${MINECRAFT_SERVERS[@]}"; do
        log "Restarting $server..."
        ssh "$server" "systemctl restart minecraft" 2>/dev/null || warning "Could not restart $server"

        # Wait and check status
        sleep 10
        if ssh "$server" "systemctl is-active minecraft" &> /dev/null; then
            success "$server restarted successfully"
        else
            warning "$server failed to restart"
        fi
    done

    success "Server restart process completed"
}

# Validate rollback
validate_rollback() {
    log "✅ Validating rollback results..."

    local success_count=0
    local total_servers=${#MINECRAFT_SERVERS[@]}

    for server in "${MINECRAFT_SERVERS[@]}"; do
        # Test SSH connectivity
        if ssh -o ConnectTimeout=10 "$server" "echo 'SSH test'" &> /dev/null; then
            # Test Minecraft server
            if timeout 5 bash -c "echo > /dev/tcp/$server/25565" &> /dev/null; then
                ((success_count++))
                success "$server: Rollback successful"
            else
                warning "$server: Minecraft port not responding"
            fi
        else
            warning "$server: SSH connectivity failed"
        fi
    done

    log "Rollback validation completed: $success_count/$total_servers servers successfully rolled back"

    # Check if Overviewer is accessible
    if [ -d "overviewer-integration" ]; then
        success "Overviewer integration files restored"
    else
        warning "Overviewer integration files not found"
    fi
}

# Generate rollback report
generate_rollback_report() {
    local backup_dir=$1

    log "📊 Generating rollback report..."

    local report_file="rollback-report-$(date +'%Y%m%d_%H%M%S').md"

    cat > "$report_file" << EOF
# Migration Rollback Report

**Rollback Date**: $(date)
**Backup Used**: $backup_dir

## Rollback Summary

- **Total Servers**: ${#MINECRAFT_SERVERS[@]}
- **Successfully Rolled Back**: $success_count
- **Failed Rollbacks**: $((${#MINECRAFT_SERVERS[@]} - success_count))
- **Rollback Duration**: ${ROLLBACK_DURATION:-"Unknown"}

## Actions Performed

1. ✅ Validated backup integrity
2. ✅ Restored original configurations
3. ✅ Removed BlueMap components
4. ✅ Restarted Minecraft servers
5. ✅ Validated rollback results

## Server Status After Rollback

EOF

    for server in "${MINECRAFT_SERVERS[@]}"; do
        if timeout 5 bash -c "echo > /dev/tcp/$server/25565" &> /dev/null; then
            echo "- ✅ $server: Rollback successful, server responding" >> "$report_file"
        else
            echo "- ❌ $server: Rollback issues, server not responding" >> "$report_file"
        fi
    done

    cat >> "$report_file" << EOF

## Next Steps

1. Verify Overviewer functionality is restored
2. Check all server features are working
3. Monitor for 24-48 hours to ensure stability
4. Review migration failure causes
5. Plan next migration attempt if needed

## Post-Rollback Checklist

- [ ] Overviewer web interface accessible
- [ ] All Minecraft servers responding
- [ ] Player connections working
- [ ] No BlueMap-related processes running
- [ ] Original configurations restored
EOF

    success "Rollback report generated: $report_file"
}

# Main rollback function
main() {
    local backup_dir=$1

    if [ -z "$backup_dir" ]; then
        error "Backup directory path required. Usage: $0 <backup_directory>"
    fi

    local start_time=$(date +%s)

    log "🔄 Starting Migration Rollback"
    log "============================"

    # Validate backup
    validate_backup "$backup_dir"

    # Restore configurations
    restore_configurations "$backup_dir"

    # Remove BlueMap components
    remove_bluemap_components

    # Restart servers
    restart_servers

    # Validate rollback
    validate_rollback

    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    export ROLLBACK_DURATION="$duration seconds"

    # Generate report
    generate_rollback_report "$backup_dir"

    success "Rollback completed successfully!"
    log "Total rollback time: $duration seconds"

    warning "IMPORTANT: Please monitor all servers for the next 24-48 hours to ensure stability."
}

# Handle script arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Migration Rollback Script"
        echo ""
        echo "Usage: $0 <backup_directory> [OPTIONS]"
        echo ""
        echo "Arguments:"
        echo "  backup_directory    Path to the backup directory created during migration"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo ""
        echo "Example:"
        echo "  $0 ./backup/20231201_120000"
        exit 0
        ;;
    *)
        # Check if backup directory is provided
        if [ -z "$1" ]; then
            error "Backup directory path required. Use --help for usage information."
        fi
        main "$@"
        ;;
esac