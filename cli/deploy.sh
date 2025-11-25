#!/bin/bash
# Simplified Deployment script for Minecraft SaaS Platform

set -e

# Load environment variables
if [ -f .env ]; then
    set -o allexport
    source .env
    set +o allexport
fi

# Source the utility functions
source ./cli/utils.sh

deploy() {
    print_heading "Deploying Minecraft SaaS Platform"
    log_info "Stopping all containers..."
    docker compose down
    log_info "Deploying Minecraft SaaS Platform..."
    ./cli/build.sh containers
    docker compose up -d --force-recreate --remove-orphans
    log_success "Deployment completed successfully!"
}

verify() {
    print_heading "Verifying Deployment"
    log_info "Verifying deployment..."

    RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -c "mc-" || echo "0")

    if [ "$RUNNING_CONTAINERS" -ge 8 ]; then
        log_success "Deployment verification successful! $RUNNING_CONTAINERS containers are running."
        echo
        log_info "Running containers:"
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep mc-
        echo
        log_info "Services are accessible at:"
        log_info "  Main Admin UI: http://$(hostname):3000"
        log_info "  mc-ilias Admin UI: http://$(hostname):3001"
        log_info "  mc-niilo Admin UI: http://$(hostname):3002"
        log_info "  School Server Admin UI: http://$(hostname):3003"
        log_info "  General Server Admin UI: http://$(hostname):3004"
    else
        log_error "Deployment verification failed! Expected at least 8 containers, but found $RUNNING_CONTAINERS"
        exit 1
    fi
}

production() {
    print_heading "Production Deployment"
    log_info "Starting production deployment..."

    log_info "Step 1: Building and pushing container images..."
    ./cli/build.sh

    log_info "Step 2: Stopping existing services..."
    docker compose down --remove-orphans || true

    log_info "Step 3: Starting new services..."
    docker compose up -d --force-recreate

    log_info "Step 4: Verifying deployment..."
    sleep 10
    log_info "Running containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

    log_success "Production deployment completed!"
}

update() {
    print_heading "Updating Minecraft SaaS Platform"
    log_info "Updating Minecraft SaaS Platform..."
    docker compose pull
    docker compose up -d --force-recreate
    log_success "Update completed successfully!"
}

status() {
    print_heading "Current Service Status"
    docker compose ps
}

logs() {
    print_heading "Displaying Logs"
    docker compose logs -f
}

help() {
    print_heading "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Deploy the application (default)"
    echo "  production - Full production deployment"
    echo "  update     - Update to latest images and redeploy"
    echo "  status     - Show current service status"
    echo "  verify     - Verify the deployment"
    echo "  logs       - Show service logs"
    echo "  help       - Show this help message"
}

ACTION=${1:-deploy}

case $ACTION in
    "deploy")
        deploy
        ;;
    "production")
        production
        ;;
    "update")
        update
        ;;
    "status")
        status
        ;;
    "verify")
        verify
        ;;
    "logs")
        logs
        ;;
    "help")
        help
        ;;
    *)
        log_error "Unknown command: $ACTION"
        echo "Use 'help' for available commands"
        exit 1
        ;;
esac

log_success "Deployment script completed!"
