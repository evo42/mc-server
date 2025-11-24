#!/bin/bash

# Minecraft Server Infrastructure - Push Script
# Version: 1.0
# Purpose: Tag and push all containers to a registry

set -e  # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "Minecraft Server Infrastructure - Push to Registry"
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

# Registry to push to (change this to your registry)
if [ -z "$1" ]; then
    REGISTRY="docker.io"
    REPO_PREFIX="your-username/mc-server"
else
    REGISTRY="$1"
    if [ -z "$2" ]; then
        REPO_PREFIX="mc-server"
    else
        REPO_PREFIX="$2"
    fi
fi

print_status "Using registry: $REGISTRY"
print_status "Using repo prefix: $REPO_PREFIX"

# Login to registry (uncomment the appropriate line)
# docker login $REGISTRY
# For Docker Hub: docker login
# For other registries: docker login $REGISTRY

# List of images to push
IMAGES=(
    "admin-ui"
    "mc-ilias"
    "ilias-admin-ui"
    "mc-niilo"
    "niilo-admin-ui"
    "school-server"
    "school-admin-ui"
    "general-server"
    "general-admin-ui"
)

# Push each image
for IMAGE in "${IMAGES[@]}"; do
    print_status "Processing image: $IMAGE"
    
    # Tag with registry prefix and push latest and prod-v1.0 tags
    FULL_IMAGE_NAME="${REGISTRY}/${REPO_PREFIX}/${IMAGE}"
    
    print_status "Tagging $FULL_IMAGE_NAME:latest"
    docker tag "mc-server/${IMAGE}:latest" "${FULL_IMAGE_NAME}:latest"
    
    print_status "Tagging $FULL_IMAGE_NAME:prod-v1.0"
    docker tag "mc-server/${IMAGE}:prod-v1.0" "${FULL_IMAGE_NAME}:prod-v1.0"
    
    print_status "Pushing $FULL_IMAGE_NAME:latest"
    docker push "${FULL_IMAGE_NAME}:latest"
    
    print_status "Pushing $FULL_IMAGE_NAME:prod-v1.0"
    docker push "${FULL_IMAGE_NAME}:prod-v1.0"
    
    print_status "Successfully pushed $IMAGE to registry"
done

print_status "All images have been successfully pushed to $REGISTRY/$REPO_PREFIX"

print_status "You can now reference these images in your production deployment as:"
for IMAGE in "${IMAGES[@]}"; do
    echo "  $REGISTRY/$REPO_PREFIX/$IMAGE:latest"
    echo "  $REGISTRY/$REPO_PREFIX/$IMAGE:prod-v1.0"
done

print_status "To use in production, update your docker-compose files to reference:"
echo "  image: $REGISTRY/$REPO_PREFIX/image-name:prod-v1.0"