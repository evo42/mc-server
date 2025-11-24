#!/bin/bash

# Simplified Production Deployment script for Minecraft SaaS Platform

set -e

# Load environment variables
if [ -f .env ]; then
    set -a\n    source .env\n    set +a
fi

deploy() {
    echo "Deploying to production..."
    git pull origin main
    docker-compose -f docker-compose.yml -f docker-compose-main-prod.yml build --pull
    docker-compose -f docker-compose.yml -f docker-compose-main-prod.yml up -d --remove-orphans
    docker-compose -f docker-compose.yml -f docker-compose-main-prod.yml ps
}

update() {
    echo "Updating production services..."
    git pull origin main
    docker-compose -f docker-compose.yml -f docker-compose-main-prod.yml pull
    docker-compose -f docker-compose.yml -f docker-compose-main-prod.yml up -d --force-recreate
    docker-compose -f docker-compose.yml -f docker-compose-main-prod.yml ps
}

status() {
    echo "Production service status:"
    docker-compose -f docker-compose.yml -f docker-compose-main-prod.yml ps
}

logs() {
    echo "Displaying production logs:"
    docker-compose -f docker-compose.yml -f docker-compose-main-prod.yml logs -f
}

help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Deploy the application to production (default)"
    echo "  update    - Update to latest images and redeploy"
    echo "  status    - Show current service status"
    echo "  logs      - Show service logs"
    echo "  help      - Show this help message"
}

ACTION=${1:-deploy}

case $ACTION in
    "deploy")
        deploy
        ;;
    "update")
        update
        ;;
    "status")
        status
        ;;
    "logs")
        logs
        ;;
    "help")
        help
        ;;
    *)
        echo "Unknown command: $ACTION"
        echo "Use 'help' for available commands"
        exit 1
        ;;
esac

echo "Production deployment script completed!"
