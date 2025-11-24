#!/bin/bash

set -e

# Validate required environment variables
if [ -z "$VERSION" ]; then
    echo "ERROR: VERSION environment variable is required"
    exit 1
fi

echo "Selecting download for Minecraft version: $VERSION"

# Get the latest build for the specified version
BUILD_DATA=$(curl -s "https://api.papermc.io/v2/projects/paper/versions/$VERSION")
LATEST_BUILD=$(echo $BUILD_DATA | jq -r '.builds[-1]')

if [ "$LATEST_BUILD" = "null" ]; then
    echo "ERROR: Could not find a build for version $VERSION"
    exit 1
fi

echo "Downloading PaperMC build $LATEST_BUILD for version $VERSION..."

# Download the specific build
curl -s "https://api.papermc.io/v2/projects/paper/versions/$VERSION/builds/$LATEST_BUILD/downloads/paper-$VERSION-$LATEST_BUILD.jar" -o server.jar

echo "Server jar downloaded successfully."