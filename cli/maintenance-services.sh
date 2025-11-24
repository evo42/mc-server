#!/bin/bash

# Minecraft Server Infrastructure - Maintenance Script
# Version: 1.0
# Purpose: Perform routine maintenance tasks

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Minecraft Server Infrastructure - Maintenance"
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

usage() {
    echo "
Minecraft Server Infrastructure - Maintenance Script
Usage: $0 [command]

Commands:
  help      Show this help message
  logs      Display logs for all containers
  stats     Show container resource usage
  cleanup   Remove unused Docker objects
  backup    Create backups of server data (not implemented)
  restore   Restore from backups (not implemented)
  restart   Restart all services
  down      Stop all services
  prune     Remove stopped containers and unused images
"
}

# Display logs for all Minecraft containers
show_logs() {
    print_status "Displaying logs for running Minecraft containers..."
    
    CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "(mc-|ilias-|niilo-|school-|general-)" | tr '\n' ' ')
    
    if [ -z "$CONTAINERS" ]; then
        print_warn "No Minecraft containers are currently running"
        return
    fi
    
    for CONTAINER in $CONTAINERS; do
        echo
        print_status "Last 50 lines of logs for container: $CONTAINER"
        echo "----------------------------------------"
        docker logs --tail 50 "$CONTAINER" 2>/dev/null || echo "Could not retrieve logs for $CONTAINER"
        echo "----------------------------------------"
    done
}

# Show resource usage statistics
show_stats() {
    print_status "Displaying resource usage statistics..."
    echo
    
    if command -v docker stats &> /dev/null; then
        echo "Current container resource usage:"
        docker stats --no-stream || echo "Could not retrieve stats"
    else
        print_warn "Docker stats command not available"
    fi
}

# Cleanup unused Docker objects
perform_cleanup() {
    print_status "Performing cleanup of unused Docker objects..."
    
    print_status "Removing stopped containers..."
    docker container prune -f
    
    print_status "Removing unused volumes..."
    docker volume prune -f
    
    print_status "Removing unused networks..."
    docker network prune -f
    
    print_status "Removing unused images..."
    docker image prune -f
    
    print_status "Cleanup completed"
}

# Restart all services
restart_services() {
    print_status "Restarting all Minecraft services..."
    
    print_status "Stopping all services..."
    docker-compose -f docker-compose-ilias.yml down --remove-orphans || true
    docker-compose -f docker-compose-niilo.yml down --remove-orphans || true
    docker-compose -f docker-compose-school.yml down --remove-orphans || true
    docker-compose -f docker-compose-general.yml down --remove-orphans || true
    
    sleep 10  # Wait for proper shutdown
    
    print_status "Starting all services..."
    docker-compose -f docker-compose-ilias.yml up -d
    sleep 5
    docker-compose -f docker-compose-niilo.yml up -d
    sleep 5
    docker-compose -f docker-compose-school.yml up -d
    sleep 5
    docker-compose -f docker-compose-general.yml up -d
    
    print_status "All services restarted"
}

# Stop all services
stop_services() {
    print_status "Stopping all Minecraft services..."
    
    docker-compose -f docker-compose-ilias.yml down --remove-orphans
    docker-compose -f docker-compose-niilo.yml down --remove-orphans
    docker-compose -f docker-compose-school.yml down --remove-orphans
    docker-compose -f docker-compose-general.yml down --remove-orphans
    
    print_status "All services stopped"
}

# Prune unused containers and images
perform_prune() {
    print_status "Pruning unused containers and images..."
    
    # Stop and remove containers that are not managed by compose
    echo "Removing unused containers..."
    docker container prune -f
    
    # Remove unused images (only dangling ones by default)
    echo "Removing dangling images..."
    docker image prune -f
    
    # Optionally remove unused volumes
    echo "Removing unused volumes..."
    docker volume prune -f
    
    print_status "Prune completed"
}

# Main function
main() {
    if [ $# -eq 0 ]; then
        print_warn "No command provided. Use 'help' to see available commands."
        exit 1
    fi
    
    case "$1" in
        "help")
            usage
            ;;
        "logs")
            show_logs
            ;;
        "stats")
            show_stats
            ;;
        "cleanup")
            perform_cleanup
            ;;
        "backup")
            print_status "Backup functionality not yet implemented"
            ;;
        "restore")
            print_status "Restore functionality not yet implemented"
            ;;
        "restart")
            restart_services
            ;;
        "down")
            stop_services
            ;;
        "prune")
            perform_prune
            ;;
        *)
            print_error "Unknown command: $1"
            usage
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"