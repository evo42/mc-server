#!/bin/bash

# Build script for Minecraft SaaS Platform

set -e

echo "Minecraft SaaS Platform Build Script"
echo "====================================="

# Build the SPA frontend
echo "Building SPA frontend..."
cd /Users/rene/ikaria/mc-server/admin-ui-spa
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "SPA build completed successfully!"
else
    echo "SPA build failed!"
    exit 1
fi

# Go back to main directory
cd ..

echo "Build process completed!"
echo "To start the platform, run: docker-compose up -d"