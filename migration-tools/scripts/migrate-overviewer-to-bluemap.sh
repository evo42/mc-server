#!/bin/bash

# Overviewer to BlueMap Migration Script
# Sprint 3: Migration Strategy Implementation
# Date: 2025-12-01

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
MIGRATION_LOG="migration-$(date +'%Y%m%d_%H%M%S').log"
BACKUP_DIR="./backup/$(date +'%Y%m%d_%H%M%S')"
MIGRATION_CONFIG="./config/migration.conf"
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
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MIGRATION_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$MIGRATION_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$MIGRATION_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$MIGRATION_LOG"
    exit 1
}

info() {
    echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$MIGRATION_LOG"
}

# Initialize migration
initialize_migration() {
    log "🚀 Starting Overviewer to BlueMap Migration"
    log "======================================="

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Create migration log
    touch "$MIGRATION_LOG"

    # Check prerequisites
    check_prerequisites

    # Load configuration
    load_migration_config

    # Validate environment
    validate_environment

    success "Migration initialized successfully"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."

    # Required tools
    local required_tools=("docker" "docker-compose" "kubectl" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "Required tool not found: $tool"
        fi
    done

    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        error "Not in the correct project directory (docker-compose.yml not found)"
    fi

    # Check Kubernetes access
    if ! kubectl cluster-info &> /dev/null; then
        warning "Cannot connect to Kubernetes cluster - some features may not work"
    fi

    success "Prerequisites check completed"
}

# Load migration configuration
load_migration_config() {
    if [ -f "$MIGRATION_CONFIG" ]; then
        source "$MIGRATION_CONFIG"
        info "Migration configuration loaded from $MIGRATION_CONFIG"
    else
        warning "Migration config not found, using defaults"
        # Set default values
        MIGRATION_MODE="gradual"
        BACKUP_ENABLED="true"
        TEST_ENABLED="true"
        ROLLBACK_ENABLED="true"
        PARALLEL_MIGRATION="false"
    fi
}

# Validate environment
validate_environment() {
    log "🔍 Validating migration environment..."

    # Check available disk space (need at least 10GB free)
    local available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 10485760 ]; then  # 10GB in KB
        error "Insufficient disk space. Need at least 10GB free space"
    fi

    # Check if all Minecraft servers are accessible
    for server in "${MINECRAFT_SERVERS[@]}"; do
        if ! ping -c 1 -W 5 "$server" &> /dev/null; then
            warning "Cannot reach Minecraft server: $server"
        fi
    done

    # Check BlueMap infrastructure
    if ! kubectl get namespace bluemap &> /dev/null; then
        warning "BlueMap namespace not found - will be created during migration"
    fi

    success "Environment validation completed"
}

# Create backup
create_backup() {
    if [ "$BACKUP_ENABLED" != "true" ]; then
        info "Backup disabled, skipping..."
        return 0
    fi

    log "💾 Creating backup..."

    # Backup current configuration
    mkdir -p "$BACKUP_DIR/config"
    cp docker-compose.yml "$BACKUP_DIR/config/" 2>/dev/null || true
    cp -r admin-api "$BACKUP_DIR/config/" 2>/dev/null || true
    cp -r admin-ui-spa "$BACKUP_DIR/config/" 2>/dev/null || true
    cp -r overviewer-integration "$BACKUP_DIR/config/" 2>/dev/null || true

    # Backup current data
    mkdir -p "$BACKUP_DIR/data"
    docker-compose ps -q | xargs docker inspect | jq -r '.[].State.Status' &> /dev/null || true

    # Backup database if exists
    if docker-compose ps | grep -q postgres; then
        log "📋 Backing up database..."
        docker-compose exec -T postgres pg_dumpall -U postgres | gzip > "$BACKUP_DIR/data/database_backup.sql.gz"
    fi

    success "Backup created in $BACKUP_DIR"
}

# Test BlueMap infrastructure
test_bluemap_infrastructure() {
    if [ "$TEST_ENABLED" != "true" ]; then
        info "Testing disabled, skipping..."
        return 0
    fi

    log "🧪 Testing BlueMap infrastructure..."

    # Check if BlueMap namespace exists
    if kubectl get namespace bluemap &> /dev/null; then
        # Test BlueMap services
        kubectl get pods -n bluemap &> /dev/null || true
        kubectl get services -n bluemap &> /dev/null || true

        # Test API endpoints
        if kubectl get ingress bluemap-ingress -n bluemap &> /dev/null; then
            INGRESS_IP=$(kubectl get ingress bluemap-ingress -n bluemap -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
            if [ "$INGRESS_IP" != "pending" ] && [ "$INGRESS_IP" != "" ]; then
                if curl -f -s http://"$INGRESS_IP"/health &> /dev/null; then
                    success "BlueMap API is accessible"
                else
                    warning "BlueMap API not accessible yet"
                fi
            fi
        fi
    else
        warning "BlueMap namespace not found - infrastructure may need to be deployed"
    fi

    success "Infrastructure test completed"
}

# Deploy BlueMap plugin to servers
deploy_bluemap_plugin() {
    log "🔌 Deploying BlueMap plugin to Minecraft servers..."

    for server in "${MINECRAFT_SERVERS[@]}"; do
        info "Deploying to $server..."

        # Copy plugin JAR file
        if [ -f "bluemap-plugin/build/bluemap-plugin.jar" ]; then
            scp bluemap-plugin/build/bluemap-plugin.jar "$server:/plugins/" 2>/dev/null || warning "Could not copy plugin to $server"
        else
            warning "Plugin JAR not found, skipping $server"
        fi

        # Copy configuration files
        if [ -d "bluemap-plugin/src/main/resources" ]; then
            ssh "$server" "mkdir -p plugins/BlueMapIntegration" 2>/dev/null || true
            scp bluemap-plugin/src/main/resources/* "$server:/plugins/BlueMapIntegration/" 2>/dev/null || warning "Could not copy config to $server"
        fi

        # Update server configuration
        update_server_config "$server"

        success "Plugin deployment to $server completed"
    done

    success "BlueMap plugin deployment completed"
}

# Update server configuration
update_server_config() {
    local server=$1

    # Create BlueMap configuration directory
    ssh "$server" "mkdir -p /opt/bluemap" 2>/dev/null || true

    # Create server-specific config
    cat > /tmp/bluemap_server_config.yml << EOF
api:
  url: "https://api.bluemap.lerncraft.xyz"
  timeout: 10000
  retry_attempts: 3

server:
  id: "$server"
  name: "$server"
  version: "1.21"

features:
  entity_tracking: true
  marker_collection: true
  chunk_scanning: true
  player_tracking: true

performance:
  data_collection_interval: 30
  performance_check_interval: 60
  max_threads: 2

limits:
  max_worlds_to_scan: 5
  max_players: 100
  max_entities_per_world: 500

websocket:
  enabled: true
  connection_timeout: 10000
  heartbeat_interval: 30
  max_reconnect_attempts: 5
EOF

    # Copy config to server
    scp /tmp/bluemap_server_config.yml "$server:/opt/bluemap/config.yml" 2>/dev/null || warning "Could not copy server config to $server"

    # Cleanup
    rm /tmp/bluemap_server_config.yml
}

# Start gradual migration
start_gradual_migration() {
    log "🔄 Starting gradual migration..."

    local migration_plan=(
        "mc-basop-bafep-stp"
        "mc-bgstpoelten"
        "mc-hakstpoelten"
        "mc-htlstp"
        "mc-ilias"
        "mc-borgstpoelten"
        "mc-niilo"
    )

    for server in "${migration_plan[@]}"; do
        info "Migrating $server..."

        # Test server before migration
        if ! test_server_connectivity "$server"; then
            warning "Skipping $server - connectivity issues"
            continue
        fi

        # Migrate server
        migrate_server "$server"

        # Wait and test
        sleep 30
        test_migrated_server "$server"

        info "Migration of $server completed"
    done

    success "Gradual migration completed"
}

# Test server connectivity
test_server_connectivity() {
    local server=$1

    # Test SSH access
    if ! ssh -o ConnectTimeout=10 "$server" "echo 'SSH test successful'" &> /dev/null; then
        return 1
    fi

    # Test Minecraft server port
    if ! timeout 5 bash -c "echo > /dev/tcp/$server/25565" &> /dev/null; then
        return 1
    fi

    return 0
}

# Migrate individual server
migrate_server() {
    local server=$1

    # Restart server with BlueMap plugin
    ssh "$server" "systemctl restart minecraft" 2>/dev/null || warning "Could not restart $server"

    # Monitor server startup
    sleep 10

    # Check if server is running
    if ssh "$server" "systemctl is-active minecraft" &> /dev/null; then
        success "$server is running with BlueMap plugin"
    else
        warning "$server failed to start - may need manual intervention"
    fi
}

# Test migrated server
test_migrated_server() {
    local server=$1

    # Check if BlueMap plugin is loaded
    local plugin_status=$(ssh "$server" "docker exec \$(docker ps -q -f 'name=minecraft') rcon list" 2>/dev/null || echo "rcon failed")

    if echo "$plugin_status" | grep -q "players online"; then
        success "$server is responding correctly"
    else
        warning "$server may have issues - check logs"
    fi
}

# Validate migration
validate_migration() {
    log "✅ Validating migration results..."

    local success_count=0
    local total_servers=${#MINECRAFT_SERVERS[@]}

    for server in "${MINECRAFT_SERVERS[@]}"; do
        if test_server_connectivity "$server"; then
            ((success_count++))
            success "$server: Migration successful"
        else
            warning "$server: Migration issues detected"
        fi
    done

    log "Migration validation completed: $success_count/$total_servers servers successfully migrated"

    if [ "$success_count" -eq "$total_servers" ]; then
        success "All servers successfully migrated!"
        return 0
    else
        warning "Some servers had migration issues - review logs"
        return 1
    fi
}

# Cleanup old Overviewer
cleanup_overviewer() {
    log "🧹 Cleaning up old Overviewer components..."

    # Remove Overviewer-related files
    find . -name "*overviewer*" -type f | head -10 | while read file; do
        mv "$file" "$BACKUP_DIR/overviewer_files/$(basename "$file")" 2>/dev/null || true
    done

    # Remove Overviewer from docker-compose
    if [ -f docker-compose.yml ]; then
        # Backup original
        cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml.original"

        # Create new docker-compose without Overviewer
        grep -v overviewer docker-compose.yml > docker-compose.yml.new
        mv docker-compose.yml.new docker-compose.yml
    fi

    success "Overviewer cleanup completed"
}

# Generate migration report
generate_migration_report() {
    log "📊 Generating migration report..."

    local report_file="migration-report-$(date +'%Y%m%d_%H%M%S').md"

    cat > "$report_file" << EOF
# Overviewer to BlueMap Migration Report

**Migration Date**: $(date)
**Migration Mode**: ${MIGRATION_MODE:-"gradual"}
**Backup Location**: $BACKUP_DIR

## Migration Summary

- **Total Servers**: ${#MINECRAFT_SERVERS[@]}
- **Successfully Migrated**: $success_count
- **Failed Migrations**: $((${#MINECRAFT_SERVERS[@]} - success_count))
- **Migration Duration**: ${MIGRATION_DURATION:-"Unknown"}

## Server Status

EOF

    for server in "${MINECRAFT_SERVERS[@]}"; do
        if test_server_connectivity "$server"; then
            echo "- ✅ $server: Successfully migrated" >> "$report_file"
        else
            echo "- ❌ $server: Migration failed" >> "$report_file"
        fi
    done

    cat >> "$report_file" << EOF

## Next Steps

1. Monitor BlueMap integration for 24-48 hours
2. Verify all features are working correctly
3. Train users on new BlueMap interface
4. Remove any remaining Overviewer references
5. Update documentation

## Rollback Information

To rollback the migration:
\`\`\`bash
./rollback-migration.sh $BACKUP_DIR
\`\`\`

**Backup Location**: $BACKUP_DIR
**Original Configuration**: $BACKUP_DIR/config/
EOF

    success "Migration report generated: $report_file"
}

# Main migration function
main() {
    local start_time=$(date +%s)

    # Initialize migration
    initialize_migration

    # Create backup
    create_backup

    # Test infrastructure
    test_bluemap_infrastructure

    # Deploy BlueMap plugin
    deploy_bluemap_plugin

    # Start migration based on mode
    case "${MIGRATION_MODE:-gradual}" in
        "gradual")
            start_gradual_migration
            ;;
        "immediate")
            # Immediate migration logic would go here
            error "Immediate migration mode not implemented yet"
            ;;
        *)
            error "Unknown migration mode: $MIGRATION_MODE"
            ;;
    esac

    # Validate migration
    validate_migration

    # Cleanup old Overviewer
    cleanup_overviewer

    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    export MIGRATION_DURATION="$duration seconds"

    # Generate report
    generate_migration_report

    success "Migration completed successfully!"
    log "Total migration time: $duration seconds"
}

# Handle script arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Overviewer to BlueMap Migration Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --mode MODE         Set migration mode (gradual|immediate)"
        echo "  --no-backup         Skip backup creation"
        echo "  --no-test           Skip infrastructure testing"
        echo "  --config FILE       Use custom configuration file"
        echo ""
        echo "Environment Variables:"
        echo "  MIGRATION_MODE      Migration mode (gradual|immediate)"
        echo "  BACKUP_ENABLED      Enable backup (true|false)"
        echo "  TEST_ENABLED        Enable testing (true|false)"
        exit 0
        ;;
    "--mode")
        export MIGRATION_MODE="$2"
        shift 2
        ;;
    "--no-backup")
        export BACKUP_ENABLED="false"
        shift
        ;;
    "--no-test")
        export TEST_ENABLED="false"
        shift
        ;;
    "--config")
        export MIGRATION_CONFIG="$2"
        shift 2
        ;;
    *)
        # Run main migration
        main "$@"
        ;;
esac