#!/bin/bash

# This script builds the Minecraft server infrastructure.
# It builds the admin-ui-spa application and then builds all the services
# defined in the docker compose.yml file.

set -e

# --- HELPERS ---

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

print_status() {
    echo -e \"${GREEN}[INFO]${NC} $1\"
}

print_warn() {
    echo -e \"${YELLOW}[WARN]${NC} $1\"
}

print_error() {
    echo -e \"${RED}[ERROR]${NC} $1\"
}

# --- BUILD FUNCTIONS ---

build_spa() {
    print_status "Building Admin SPA..."
    if [ -d "./admin-ui-spa" ]; then
        (cd admin-ui-spa && npm install && npm run build)
        print_status "Admin SPA built successfully!"
    else
        print_error "admin-ui-spa directory not found!"
        exit 1
    fi
}

build_containers() {
    print_status \"Building all Docker containers...\"
    docker compose build
    print_status \"All Docker containers built successfully!\"
}

build_and_push() {
    print_status \"Building and pushing images to registry...\"

    REGISTRY=\"ghcr.io\"
    REPO=\"evo42/mc-server\"
    TAG=\"latest\"

    SERVICES=(
        \"mc-ilias:mc-ilias-server\"
        \"ilias-admin-ui:admin-ui\"
        \"mc-niilo:mc-niilo-server\"
        \"niilo-admin-ui:admin-ui\"
        \"school-server:school-server\"
        \"school-admin-ui:admin-ui\"
        \"general-server:general-server\"
        \"general-admin-ui:admin-ui\"
        \"admin-ui:admin-ui\"
    )

    print_status \"Logging in to GitHub Container Registry...\"
    if ! gh auth status > /dev/null 2>&1; then
        print_error \"You must be logged in to the GitHub CLI. Please run 'gh auth login'.\"
        exit 1
    fi
    gh auth token | docker login ghcr.io --username $(gh api user --jq .login) --password-stdin

    built_contexts=\"\"
    for service_and_context in \"${SERVICES[@]}\"; do
        IFS=':' read -r service context <<< \"$service_and_context\"
        if ! echo \"$built_contexts\" | grep -q \"$context\"; then
            IMAGE_NAME=\"${REGISTRY}/${REPO}/${service}:${TAG}\"
            print_status \"Building and pushing ${IMAGE_NAME} from context ${context}\"
            docker build -t \"${IMAGE_NAME}\" -f \"${context}/Dockerfile\" \"${context}\"
            docker push \"${IMAGE_NAME}\"
            built_contexts=\"$built_contexts $context\"
        fi
    done

    print_status \"All images built and pushed successfully.\"
}

# --- MAIN LOGIC ---

help() {
    echo \"Usage: $0 [command]\"
    echo \"\"
    echo \"Commands:\"
    echo "  \(no command\) - Build both SPA and containers"
    echo \"  spa          - Build the Admin SPA only\"
    echo \"  containers   - Build all Docker containers\"
    echo \"  push         - Build and push all images to the registry\"
    echo \"  help         - Show this help message\"
}

ACTION=${1:-all}

case $ACTION in
    all)
        build_spa
        build_containers
        ;;
    spa)
        build_spa
        ;;
    containers)
        build_containers
        ;;
    push)
        build_and_push
        ;;
    help)
        help
        ;;
    *)
        print_error \"Unknown command: $ACTION\"
        help
        exit 1
        ;;
esac

print_status \"Build script completed!\"
