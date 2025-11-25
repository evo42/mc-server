# Minecraft SaaS Platform - QWEN Context Documentation

## Project Overview

The Minecraft SaaS Platform is a production-ready multi-server system that enables centralized management of multiple Minecraft servers through a unified interface. The platform supports Minecraft 1.21.1 with comprehensive security and management capabilities.

### Key Components
- **minecraft-base**: Universal Minecraft server Docker image supporting dynamic PaperMC downloads
- **admin-api**: Secure Node.js API service with Public API for history/stats and secure Dockerode management
- **admin-ui-spa**: Vue.js single-page admin panel with 3D performance charts and server/datapack management
- **Infrastructure**: BungeeCord proxy, Nginx reverse proxy, Watchtower for updates

### Architecture
- **Multi-server**: Supports multiple Minecraft server instances (mc-ilias, mc-niilo, etc.)
- **Containerized**: All services run in Docker containers
- **Centralized Control**: Admin API provides unified management interface
- **Secure by Design**: Authentication, server validation, and path traversal protection

## Core Features

### Server Management
- Start/stop/restart Minecraft servers remotely
- Real-time server status monitoring
- Resource usage tracking (CPU/Memory)
- Player count monitoring

### Datapack Management
- Browse available datapacks
- Install/uninstall datapacks
- Search functionality
- Version management

### Security Features
- Server name validation against whitelist
- Path traversal protection in file operations
- Basic authentication for all endpoints
- Non-root container execution

## Technical Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Public API**: Read-only endpoints for server status, history, and datapacks
- **History Service**: In-memory collection of server statistics (24h retention)
- **Docker Integration**: Dockerode library for container management
- **Authentication**: express-basic-auth with configurable credentials
- **Logging**: Pino HTTP logging

### Frontend
- **Framework**: Vue.js 3 with modern SPA architecture
- **Visualization**: Chart.js and Three.js for 2D/3D performance metrics
- **UI**: Bootstrap with custom styling
- **Build System**: Vite for development and building

### Infrastructure
- **Containerization**: Docker with Docker Compose
- **Proxy**: Nginx reverse proxy
- **Server Switching**: BungeeCord
- **Auto Updates**: Watchtower
- **Base Images**: Eclipse Temurin Java 21

## Building and Running

### Prerequisites
- Docker and Docker Compose
- Node.js (for developing the admin panel)

### Setup Process
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mc-server
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your specific values
   ```

3. **Build the SPA admin panel**
   ```bash
   cd admin-ui-spa
   npm install
   npm run build
   cd ..
   ```

4. **Start the platform**
   ```bash
   docker-compose up -d
   ```

### Configuration Variables

#### Essential Variables
```bash
# Admin credentials
ADMIN_USER=admin
ADMIN_PASS=admin123

# Minecraft server defaults
MC_VERSION=1.21.1          # Minecraft version
MC_EULA=TRUE               # Mojang EULA acceptance (required)
MC_MEMORY=4G               # Initial server memory
MC_MAX_MEMORY=8G           # Maximum server memory
MC_ONLINE_MODE=false       # Authentication mode
MC_ENABLE_PROXY_CONNECTIONS=true  # BungeeCord support
```

#### Server-Specific Configuration
```bash
# Memory allocation per server
MC_ILIAS_MEMORY=8G
MC_NILO_MEMORY=12G
MC_BGSTPOELEN_MEMORY=6G
# ... and more for other servers

# MOTD messages
MC_ILIAS_MOTD=mc-Ikaria Games
MC_NILO_MOTD=mc-KDLK.net
# ... and more for other servers
```

#### Network Ports
```bash
PROXY_PORT=25565           # Minecraft server port
ADMIN_API_PORT=3000        # Admin API port
NGINX_PORT=80              # HTTP port
NGINX_HTTPS_PORT=443       # HTTPS port
```

### Services Architecture
```
External Access → Nginx → BungeeCord → Minecraft Servers
                ↓         ↓           ↓
           Admin API ←→ Dockerode ←→ Data Volumes
```

## Development Conventions

### File Structure
```
mc-server/
├── admin-api/              # Backend Node.js API
│   ├── controllers/        # API controllers
│   ├── routes/             # Express routes
│   ├── services/           # Business logic
│   ├── tests/              # Unit and integration tests
│   └── datapacks.json      # Datapack repository
├── admin-ui-spa/           # Vue.js SPA frontend
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── dist/               # Built assets (admin-ui-dist)
├── minecraft-base/         # Universal Minecraft Docker image
│   ├── Dockerfile.consolidated  # Docker image definition
│   ├── start-server.sh     # Server startup script
├── nginx/                  # Nginx configuration
├── bungeecord/             # BungeeCord proxy configuration
├── mc-[server]/            # Individual server data directories
├── docker-compose.yml      # Main orchestration
├── .env                    # Configuration file
├── deploy.sh               # Development deployment script
└── README.md               # Documentation
```

### Security Practices
1. **Server Validation**: All server names validated against ALLOWED_SERVERS list
2. **Path Traversal Protection**: Input sanitization in file operations
3. **Authentication**: All API endpoints require basic authentication
4. **Environment Variables**: Sensitive data stored in environment variables

### Testing Strategy
- **Unit Tests**: Service-level testing with mocks
- **Integration Tests**: End-to-end API testing
- **Security Tests**: Validation and vulnerability checks
- **Coverage Requirement**: 90%+ code coverage

## Deployment

### Development
```bash
# Build SPA
cd admin-ui-spa && npm run build && cd ..

# Deploy with default settings
./deploy.sh deploy

# Check status
./deploy.sh status
```

### Production
- Use `deploy-prod.sh` for production environments
- Ensure environment variables are properly configured
- Monitor logs with `./deploy.sh logs`

### CI/CD Pipeline
- GitHub Actions for automated builds
- Multi-platform support (amd64/arm64)
- Automated testing on PRs
- Deployment on main branch changes

## Common Tasks

### Managing Servers
- Access admin panel at `http://your-domain:80`
- Use BungeeCord port (`25565`) for Minecraft connections
- Configure individual server settings in `.env`

### Updating Versions
- Modify `MC_VERSION` in `.env` to update all servers
- For individual server updates, adjust the specific service configuration

### Monitoring
- Check container status with `docker-compose ps`
- View logs with `docker-compose logs -f`
- Monitor performance with `docker stats`

## Troubleshooting

### Common Issues
1. **Server won't start**: Check that `MC_EULA=TRUE` in `.env`
2. **Authentication issues**: Verify admin credentials in environment
3. **Container health**: Check `docker-compose logs [service_name]`
4. **Performance**: Adjust memory allocation based on server activity

### Useful Commands
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart [service_name]

# Monitor resources
docker stats

# Execute command in container
docker-compose exec [service_name] [command]
```

## Maintenance

### Backup Strategy
- All server data stored in Docker volumes
- Implement regular volume backups
- Environment configuration should be version controlled

### Updates
- Watchtower automatically updates containers
- Manual updates via `./deploy.sh update`
- Always backup before major updates

### Security
- Regular security audits of dependencies
- Monitor for new Minecraft/Paper security patches
- Keep Docker images updated