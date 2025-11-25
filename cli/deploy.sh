#!/bin/bash

# Simplified Deployment script for Minecraft SaaS Platform

set -e

# Load environment variables
if [ -f .env ]; then
    set -o allexport
    source .env
    set +o allexport
fi

deploy() {\
    echo "Stopping all containers..."\
    docker compose down
    echo \"Deploying Minecraft SaaS Platform...\"
    ./cli/build.sh containers
    docker compose up -d --remove-orphans

}

verify() {
    print_status \"Verifying deployment...\"

    RUNNING_CONTAINERS=$(docker ps --format \"{{.Names}}\" | grep -c \"mc-\" || echo \"0\")

    if [ \"$RUNNING_CONTAINERS\" -ge 8 ]; then
        print_status \"Deployment verification successful! $RUNNING_CONTAINERS containers are running.\"

        echo
        print_status \"Running containers:\"
        docker ps --format \"table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}\" | grep mc-
        echo

        print_status \"Services are accessible at:\"
        print_status \"  Main Admin UI: http://$(hostname):3000\"
        print_status \"  mc-ilias Admin UI: http://$(hostname):3001\"
        print_status \"  mc-niilo Admin UI: http://$(hostname):3002\"
        print_status \"  School Server Admin UI: http://$(hostname):3003\"
        print_status \"  General Server Admin UI: http://$(hostname):3004\"
    else
        print_error \"Deployment verification failed! Expected at least 8 containers, but found $RUNNING_CONTAINERS\"
        exit 1
    fi
}

production() {
    echo \"Starting production deployment...\"

    echo \"Step 1: Building and pushing container images...\"
    ./cli/build.sh

    echo \"Step 2: Stopping existing services...\"
    docker compose down --remove-orphans || true

    echo \"Step 3: Starting new services...\"
    docker compose up -d --force-recreate

    echo \"Step 4: Verifying deployment...\"
    sleep 10
    echo \"Running containers:\"
    docker ps --format \"table {{.Names}}\\t{{.Image}}\\t{{.Status}}\"

    echo \"Production deployment completed!\"
}

update() {
    echo "Updating Minecraft SaaS Platform..."
    docker compose pull
    docker compose up -d --force-recreate

}

status() {
    echo "Current service status:"

}

logs() {
    echo "Displaying logs:"
    docker compose logs -f
}

help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Deploy the application (default)"
    echo \"  production - Full production deployment\"
    echo \"  update    - Update to latest images and redeploy\"
    echo "  status    - Show current service status"
    echo \"  verify    - Verify the deployment\"
    echo \"  logs      - Show service logs\"
    echo "  help      - Show this help message"
}

ACTION=${1:-deploy}

case $ACTION in
    "deploy")
        deploy
        ;;
    \"production\")
        production
        ;;
    \"update\")
        update
        ;;
    "status")
        status
        ;;
    \"verify\")
        verify
        ;;
    \"logs\")
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
