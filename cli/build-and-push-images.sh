#!/bin/bash

set -e

# Configuration
REGISTRY="ghcr.io"
REPO="evo42/mc-server"
TAG="latest"

# Services and their build contexts
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

# Log in to GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
if ! gh auth status > /dev/null 2>&1; then
    echo "You must be logged in to the GitHub CLI to run this script. Please run 'gh auth login'."
    exit 1
fi
gh auth token | docker login ghcr.io --username $(gh api user --jq .login) --password-stdin

echo
echo "Building and pushing container images..."
echo

# Unique services to avoid duplicate builds
built_contexts=""
for service_and_context in "${SERVICES[@]}"; do
    IFS=':' read -r service context <<< "$service_and_context"
    if ! echo "$built_contexts" | grep -q "$context"; then
        IMAGE_NAME="${REGISTRY}/${REPO}/${service}:${TAG}"
        echo "Building and pushing ${IMAGE_NAME} from context ${context}"
        docker build -t "${IMAGE_NAME}" -f "${context}/Dockerfile" "${context}"
        docker push "${IMAGE_NAME}"
        built_contexts="$built_contexts $context"
    fi
done

echo
echo "All images built and pushed successfully."
echo
