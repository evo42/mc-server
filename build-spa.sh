#!/bin/bash

# Build script for Minecraft Admin SPA

set -e

echo "Installing dependencies..."
cd /app/admin-ui-spa
npm install

echo "Building SPA..."
npm run build

echo "SPA build completed successfully!"