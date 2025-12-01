#!/bin/bash

# BlueMap Local Deployment Script
# This script deploys the complete BlueMap integration locally

set -e

echo "🚀 Starting BlueMap Local Deployment..."
echo "====================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ./bluemap-data/{mc-basop-bafep-stp,mc-bgstpoelten,mc-borgstpoelten,mc-hakstpoelten,mc-htlstp,mc-ilias,mc-niilo}
mkdir -p ./bluemap-render-cache
mkdir -p ./bluemap-render-logs
mkdir -p ./prometheus-data
mkdir -p ./grafana-data
mkdir -p ./grafana/provisioning/{datasources,dashboards}

# Set proper permissions
chmod -R 755 ./bluemap-data
chmod -R 755 ./bluemap-render-cache
chmod -R 755 ./bluemap-render-logs

echo "✅ Directories created successfully"

# Build BlueMap API service
echo "🔨 Building BlueMap API service..."
docker build -f admin-api/Dockerfile.bluemap -t bluemap-api:dev ./admin-api

# Build BlueMap Plugin (development)
echo "🔨 Building BlueMap Plugin..."
cd bluemap-plugin
docker build -f Dockerfile.dev -t bluemap-plugin:dev .
cd ..

# Build BlueMap Render Engine
echo "🔨 Building BlueMap Render Engine..."
docker build -t bluemap-render-engine:dev ./bluemap-render-engine

echo "✅ Docker images built successfully"

# Start the services
echo "🏃 Starting BlueMap services..."
echo "====================================="

# Start core services first
echo "🚀 Starting core infrastructure (Redis, Admin API, etc.)..."
docker-compose up -d redis admin-api

# Wait for core services to be ready
echo "⏳ Waiting for core services to be ready..."
sleep 30

# Start BlueMap services
echo "🗺️ Starting BlueMap services..."
docker-compose up -d bluemap-api

# Start individual BlueMap web interfaces
echo "🌐 Starting BlueMap web interfaces..."
docker-compose up -d bluemap-web-mc-basop-bafep-stp
docker-compose up -d bluemap-web-mc-bgstpoelten
docker-compose up -d bluemap-web-mc-borgstpoelten
docker-compose up -d bluemap-web-mc-hakstpoelten
docker-compose up -d bluemap-web-mc-htlstp
docker-compose up -d bluemap-web-mc-ilias
docker-compose up -d bluemap-web-mc-niilo

# Start BlueMap render engine
echo "⚙️ Starting BlueMap render engine..."
docker-compose up -d bluemap-render-engine

# Start monitoring services
echo "📊 Starting monitoring services..."
docker-compose up -d prometheus grafana

echo ""
echo "✅ BlueMap deployment completed!"
echo "====================================="
echo ""
echo "🎯 Access URLs:"
echo "  • Admin UI:           http://localhost:80"
echo "  • BlueMap API:        http://localhost:3001"
echo "  • Prometheus:         http://localhost:9090"
echo "  • Grafana:            http://localhost:3001"
echo ""
echo "🗺️ BlueMap Web Interfaces:"
echo "  • mc-basop-bafep-stp: http://localhost:8081"
echo "  • mc-bgstpoelten:     http://localhost:8082"
echo "  • mc-borgstpoelten:   http://localhost:8083"
echo "  • mc-hakstpoelten:    http://localhost:8084"
echo "  • mc-htlstp:          http://localhost:8085"
echo "  • mc-ilias:           http://localhost:8086"
echo "  • mc-niilo:           http://localhost:8087"
echo ""
echo "📋 Service Status:"
docker-compose ps bluemap
echo ""
echo "📈 Monitor logs with:"
echo "  docker-compose logs -f bluemap-api"
echo "  docker-compose logs -f bluemap-render-engine"
echo ""
echo "🛑 To stop all services:"
echo "  docker-compose down"
echo ""
echo "🎉 BlueMap Integration is now running locally!"