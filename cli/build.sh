#!/bin/bash

# This script builds the Minecraft server infrastructure.
# It builds the admin-ui-spa application and then builds all the services
# defined in the docker compose.yml file.

set -e
#!/bin/bash
# This script builds the Minecraft server infrastructure.
# It builds the admin-ui-spa application and then builds all the services
# defined in the docker compose.yml file.

set -e

# Source the utility functions
source ./cli/utils.sh

# --- BUILD FUNCTIONS ---

build_spa() {
    print_heading "Building Admin SPA"
    if [ -d "./admin-ui-spa" ]; then
        (cd admin-ui-spa && npm install && npm run build)
        log_success "Admin SPA built successfully!"
    else
        log_error "admin-ui-spa directory not found!"
        exit 1
    fi
}

build_containers() {
    print_heading "Building Docker Containers"
    if [[ "$(uname)" == "Darwin" ]]; then
        export DOCKER_DEFAULT_PLATFORM=linux/amd64
        log_warn "Building for linux/amd64 on macOS"
    fi
    docker compose build --pull
    log_success "All Docker containers built successfully!"
}

build_and_push() {
    print_heading "Building and Pushing Images to Registry"
    REGISTRY="ghcr.io"
    REPO="evo42/mc-server"
    TAG="latest"

    SERVICES=(
        "mc-ilias:mc-ilias-server"
        "ilias-admin-ui:admin-ui"
        "mc-niilo:mc-niilo-server"
        "niilo-admin-ui:admin-ui"
        "school-server:school-server"
        "school-admin-ui:admin-ui"
        "general-server:general-server"
        "general-admin-ui:admin-ui"
        "admin-ui:admin-ui"
    )

    log_info "Logging in to GitHub Container Registry..."
    if ! gh auth status > /dev/null 2>&1; then
        log_error "You must be logged in to the GitHub CLI. Please run 'gh auth login'."
        exit 1
    fi
    gh auth token | docker login ghcr.io --username $(gh api user --jq .login) --password-stdin

    built_contexts=""
    for service_and_context in "${SERVICES[@]}"; do
        IFS=':' read -r service context <<< "$service_and_context"
        if ! echo "$built_contexts" | grep -q "$context"; then
            IMAGE_NAME="${REGISTRY}/${REPO}/${service}:${TAG}"
            log_info "Building and pushing ${IMAGE_NAME} from context ${context}"
            docker build -t "${IMAGE_NAME}" -f "${context}/Dockerfile" "${context}" && docker push "${IMAGE_NAME}"
            built_contexts="$built_contexts $context"
        fi
    done

    log_success "All images built and pushed successfully."
}

build_and_push_multi_platform() {
    print_heading "Building and Pushing Multi-Platform Images to Registry"
    REGISTRY="ghcr.io"
    REPO="evo42/mc-server"
    TAG="latest"

    SERVICES=(
        "minecraft-base"
        "bungeecord"
        "admin-api"
        "admin-ui"
        "nginx"
    )

    log_info "Logging in to GitHub Container Registry..."
    if ! gh auth status > /dev/null 2>&1; then
        log_error "You must be logged in to the GitHub CLI. Please run 'gh auth login'."
        exit 1
    fi
    gh auth token | docker login ghcr.io --username $(gh api user --jq .login) --password-stdin

    for service in "${SERVICES[@]}"; do
        IMAGE_NAME="${REGISTRY}/${REPO}/${service}:${TAG}"
        log_info "Building and pushing multi-platform image ${IMAGE_NAME} from context ${service}"
        docker buildx build --platform linux/amd64,linux/arm64 -t "${IMAGE_NAME}" --push "./${service}"
    done

    log_success "All multi-platform images built and pushed successfully."
}

# --- MAIN LOGIC ---

help() {
    print_heading "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  (no command) - Build both SPA and containers"
    echo "  spa          - Build the Admin SPA only"
    echo "  containers   - Build all Docker containers"
    echo "  push         - Build and push all images to the registry"
    echo "  push-multi-platform - Build and push multi-platform images to the registry"
    echo "  help         - Show this help message"
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
    push-multi-platform)
        build_and_push_multi_platform
        ;;
    help)
        help
        ;;
    *)
        log_error "Unknown command: $ACTION"
        help
        exit 1
        ;;
esac

log_success "Build script completed!"
