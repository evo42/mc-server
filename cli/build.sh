#!/bin/bash

# This script builds the Minecraft server infrastructure.
# It builds the admin-ui-spa application and then builds all the services
# defined in the docker-compose.yml file.

set -e

echo "Building admin-ui-spa..."
(cd admin-ui-spa && npm install && npm run build)

echo "Building all services..."
docker-compose build

echo "Build complete."
