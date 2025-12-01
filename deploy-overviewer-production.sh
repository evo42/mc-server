#!/bin/bash
set -e

echo "🎮 Deploying Minecraft Overviewer Integration with Redis (Production)"
echo "═══════════════════════════════════════════════════════════════════"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Creating from template..."
    if [ -f ".secrets.example" ]; then
        cp .secrets.example .env
        echo "✅ Created .env from .secrets.example"
        echo "⚠️  Please edit .env with your actual values before continuing!"
        exit 1
    else
        echo "❌ No .env or .secrets.example found. Please create .env manually."
        exit 1
    fi
fi

echo "📋 Environment Check..."
# Verify critical environment variables
if ! grep -q "REDIS_PASSWORD=" .env; then
    echo "⚠️  Adding Redis password to .env..."
    echo "REDIS_PASSWORD=redissecure123" >> .env
fi

if ! grep -q "MINECRAFT_OVERVIEWER_URL=" .env; then
    echo "⚠️  Adding default Overviewer URL to .env..."
    echo "MINECRAFT_OVERVIEWER_URL=http://overviewer:3003" >> .env
fi

echo "🐳 Docker Environment Setup..."

# Create Redis data directory
mkdir -p redis/data
mkdir -p redis/conf

# Create Redis configuration if it doesn't exist
if [ ! -f "redis/conf/redis.conf" ]; then
    cat > redis/conf/redis.conf << EOF
# Redis Configuration for Minecraft Overviewer
bind 0.0.0.0
port 6379
requirepass redissecure123
databases 16
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
EOF
    echo "✅ Redis configuration created"
fi

echo "🔨 Building Docker Images..."

# Build overviewer image first
echo "🗺️  Building Minecraft Overviewer image..."
docker build -t overviewer:production ./overviewer-integration/

echo "🛡️  Building admin-api with enhanced security..."
docker build -t admin-api:production ./admin-api/

echo "🌐 Building admin-ui..."
cd admin-ui-spa
npm run build
cd ..
docker build -t admin-ui:production ./admin-ui-spa/

echo "🚀 Starting Services with Redis..."

# Pull latest images if needed
docker-compose pull

# Start core infrastructure first
echo "🔧 Starting Redis infrastructure..."
docker-compose up -d redis

echo "⏳ Waiting for Redis to be ready..."
for i in {1..30}; do
    if docker exec mc-redis redis-cli -a redissecure123 ping >/dev/null 2>&1; then
        echo "✅ Redis is ready!"
        break
    fi
    echo "⏳ Waiting for Redis... ($i/30)"
    sleep 2
done

if ! docker exec mc-redis redis-cli -a redissecure123 ping >/dev/null 2>&1; then
    echo "❌ Redis failed to start properly"
    exit 1
fi

# Start other services
echo "🌐 Starting proxy infrastructure..."
docker-compose up -d docker-proxy nginx

echo "🎮 Starting Minecraft servers (if configured)..."
# Only start minecraft servers if they're configured
if docker-compose config | grep -q "minecraft-net:"; then
    echo "📦 Starting Minecraft servers..."
    docker-compose up -d bungeecord
    # Start individual minecraft servers
    for dir in mc-*/; do
        if [ -d "$dir" ]; then
            server_name=$(basename "$dir")
            if docker-compose config | grep -q "$server_name:"; then
                echo "🎮 Starting $server_name..."
                docker-compose up -d "$server_name"
                sleep 5
            fi
        fi
    done
fi

echo "📡 Starting overviewer service..."
docker-compose up -d overviewer

echo "🛡️  Starting admin-api with security enhancements..."
docker-compose up -d admin-api

echo "🎨 Starting admin UI..."
docker-compose up -d admin-ui

echo "🔍 Health Check..."
sleep 10

# Check all services
services=("redis" "docker-proxy" "nginx" "overviewer" "admin-api" "admin-ui")
for service in "${services[@]}"; do
    if docker-compose ps "$service" | grep -q "Up"; then
        echo "✅ $service: Running"
    else
        echo "❌ $service: Failed to start"
        docker-compose logs "$service" --tail=10
    fi
done

echo "🌍 Access URLs..."
echo "═══════════════════════════════════════════════════════════════════"
echo "🎨 Admin UI:       http://localhost:3000"
echo "📊 Overviewer:     http://localhost:3003"
echo "📡 Admin API:      http://localhost:3000/api"
echo "📖 API Docs:       http://localhost:3000/docs.html"
echo "📋 Health Check:   http://localhost:3000/health"

echo ""
echo "🎮 Minecraft World Mapping Features:"
echo "• 🔄 Real-time render progress (WebSocket)"
echo "• 💾 Redis persistence for render jobs"
echo "• 🚀 Performance-optimized API responses"
echo "• 🔒 Enhanced security with input validation"
echo "• 🌍 Public map management for all Minecraft servers"
echo ""
echo "🚀 Production deployment completed successfully!"
echo "📊 Monitor with: docker-compose logs -f [service-name]"
echo "🛑 Stop with: docker-compose down"
echo "🔄 Restart: docker-compose restart [service-name]"