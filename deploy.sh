#!/bin/bash

# Simplified Deployment script for Minecraft SaaS Platform

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

deploy() {
    echo "Deploying Minecraft SaaS Platform..."
    docker-compose build --pull
    docker-compose up -d --remove-orphans
    docker-compose ps
}

update() {
    echo "Updating Minecraft SaaS Platform..."
    docker-compose pull
    docker-compose up -d --force-recreate
    docker-compose ps
}

status() {
    echo "Current service status:"
    docker-compose ps
}

logs() {
    echo "Displaying logs:"
    docker-compose logs -f
}

help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Deploy the application (default)"
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

echo "Deployment script completed!"
