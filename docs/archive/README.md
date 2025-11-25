# Minecraft SaaS Platform - Production Ready

A comprehensive, scalable, and secure Minecraft Multi-Server SaaS Platform supporting Minecraft 1.21.1 with enterprise-grade management capabilities.

## 🚀 Key Features

### ✅ **Minecraft 1.21.1 Support**
- Full support for Minecraft 1.21.1 across all servers
- Dynamic PaperMC download via universal base image
- Java 21 runtime for optimal performance
- Version flexibility with parameterized configuration

### ✅ **Universal Server Image**
- Single base image supports any PaperMC-compatible version
- Dynamic download of correct builds based on environment
- Java 21 base (eclipse-temurin:21-jdk-jammy)
- Secure non-root container execution

### ✅ **Centralized Management**
- Single `docker-compose.yml` for all services
- Comprehensive `.env` configuration system
- SPA admin panel with Vue.js frontend
- Real-time server monitoring and control

### ✅ **Enterprise Security**
- Server name validation against approved list
- Path traversal protection in file operations
- Secure Docker daemon communication (dockerode)
- Authentication required for all endpoints

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    External Access                          │
├─────────────┬──────────────┬──────────────┬────────────────┤
│   Players   │ Admin Panel  │ API Clients  │ Monitoring     │
│             │              │              │                │
└─────────────┴──────────────┴──────────────┴────────────────┘
                           │
                    ┌──────────────┐
                    │    Nginx     │ ← HTTPS/HTTP Proxy
                    │  (Port 80/443) │
                    └──────────────┘
                           │
                    ┌──────────────┐
                    │ BungeeCord   │ ← Server Switching
                    │  (Port 25565) │
                    └──────────────┘
                           │
        ┌─────────────────────────────────────────────────────┐
        │                  Internal Services                  │
        ├─────────────┬──────────────┬─────────────────┬──────┤
        │ Minecraft   │ Admin API    │ Watchtower      │ Data │
        │ Servers     │              │ (Auto-updates)  │      │
        │ (1.21.1)    │ (Dockerode)  │                 │ Volumes
        └─────────────┴──────────────┴─────────────────┴──────┘
```

## 📋 Components

### 1. Universal Minecraft Base Image (`minecraft-base/`)
- **Version Support**: Minecraft 1.21.1 (also supports other PaperMC versions)
- **Dynamic Download**: Automatically fetches correct PaperMC build
- **Java 21 Runtime**: Optimized for Minecraft 1.21.x
- **Secure Execution**: Non-root user container operation

### 2. Admin API (`admin-api/`)
- **REST Interface**: Full server management API
- **Dockerode Integration**: Secure Docker daemon communication
- **Authentication**: Basic auth with configurable credentials
- **Security**: Server validation and path traversal protection

### 3. SPA Admin Panel (`admin-ui-spa/`)
- **Vue.js Frontend**: Modern single-page application
- **Real-time Monitoring**: Server status and resource usage
- **Datapack Management**: Install/uninstall datapacks
- **Bootstrap UI**: Responsive, professional interface

### 4. Infrastructure Services
- **BungeeCord**: Server switching proxy
- **Nginx**: Web server and API proxy
- **Watchtower**: Automatic container updates

## ⚙️ Configuration

### Essential Environment Variables (`.env`)
```bash
# Admin credentials
ADMIN_USER=admin
ADMIN_PASS=admin123

# Minecraft server defaults
MC_VERSION=1.21.1           # Target version for all servers
MC_EULA=TRUE               # Required for Minecraft operation
MC_MEMORY=4G               # Default initial RAM allocation
MC_MAX_MEMORY=8G           # Default maximum RAM allocation
MC_ONLINE_MODE=false       # Authentication method
MC_ENABLE_PROXY_CONNECTIONS=true  # BungeeCord support

# Server-specific configurations
MC_ILIAS_MEMORY=8G
MC_NILO_MEMORY=12G
MC_BGSTPOELEN_MEMORY=6G
# ... and more for all server instances

# Network settings
PROXY_PORT=25565           # Main Minecraft port
ADMIN_API_PORT=3000        # Admin API port
NGINX_PORT=80              # HTTP port
NGINX_HTTPS_PORT=443       # HTTPS port
```

### Per-Server Configuration
Each server can be customized with:
- Memory allocation (6G-24G possible)
- Game modes (survival, creative, adventure, spectator)
- Player limits (40-150 players)
- View distances (adjust for performance)
- Spawn settings (animals, monsters, NPCs)
- World settings (dimensions, structures)

## 🚀 Deployment

### Quick Start
```bash
# 1. Install SPA frontend dependencies
cd admin-ui-spa
npm install
npm run build
cd ..

# 2. Customize environment variables
cp example-config/.env.example .env
# Edit .env with your specific values

# 3. Start the platform
docker-compose up -d
```

### Production Deployment
Use the comprehensive deployment scripts:
```bash
# Development deployment
./deploy.sh deploy

# Production deployment (with additional safety checks)
./deploy-prod.sh deploy

# Update to latest versions
./deploy.sh update

# Check system status
./deploy.sh status

# View logs
./deploy.sh logs

# Create backup
./deploy.sh backup
```

## 🔐 Security Features

### API Security
- **Server Validation**: All server names checked against whitelist
- **Path Traversal Prevention**: Secure file operation handling
- **Authentication**: Basic auth on all endpoints
- **Input Validation**: Sanitized user inputs

### Container Security
- **Non-root Execution**: Containers run as non-root users
- **Isolated Networks**: Service isolation with Docker networking
- **Limited Capabilities**: Reduced container privileges
- **Secure Mounts**: Proper volume mounting practices

## 📊 Monitoring & Management

### Server Management
- **Start/Stop/Restart**: Remote server control
- **Status Monitoring**: Real-time server status
- **Resource Tracking**: CPU/Memory usage monitoring
- **Player Count**: Active player tracking

### Datapack Management
- **Browse Available**: Search and view available datapacks
- **Install/Uninstall**: One-click installation/removal
- **Version Control**: Datapack version management
- **Repository Integration**: Pre-configured datapack repository

## 🔄 CI/CD Pipeline

The GitHub Actions workflow provides:
- **Automated Builds**: Multi-platform support (amd64/arm64)
- **Testing**: Unit and security tests
- **Docker Registry**: Automatic image pushes to GHCR
- **Production Deployment**: Automated deployment on main branch

## 📁 Project Structure

```
mc-server/
├── admin-api/                    # Secure Node.js API service
│   ├── controllers/              # API controllers
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   ├── tests/                    # Unit tests
│   └── e2e/                      # End-to-end tests
├── admin-ui-spa/                 # Vue.js SPA frontend
│   ├── src/                      # Source code
│   ├── public/                   # Static assets
│   └── dist/                     # Built assets (admin-ui-dist)
├── minecraft-base/               # Universal Minecraft image
│   ├── Dockerfile               # Base image definition
│   ├── download-server.sh       # Dynamic download script
│   └── start-server.sh          # Server startup script
├── nginx/                        # Web server configuration
│   └── nginx.conf               # Nginx configuration
├── bungeecord/                   # Proxy server
├── example-config/              # Complete example configuration
│   ├── docker-compose-full.yml  # Full multi-server config
│   ├── .env.example            # Example environment vars
│   └── CONFIGURATION_GUIDE.md   # Comprehensive guide
├── .github/workflows/           # CI/CD pipelines
├── docker-compose.yml           # Main orchestration
├── .env                         # Environment configuration
├── deploy.sh                    # Development deployment
├── deploy-prod.sh               # Production deployment
├── build.sh                     # Build automation
├── rules/                     # AI management guidelines
└── README.md                    # This document
```

## 🛠️ Customization

### Adding New Minecraft Servers
1. Define server in `docker-compose.yml`
2. Add data directory structure
3. Update `ALLOWED_SERVERS` list in `admin-api/services/serversService.js`
4. Configure environment variables in `.env`

### Extending Datapack Repository
1. Add datapack definitions to `admin-api/services/datapacksService.js`
2. Follow naming conventions for automatic detection
3. Include version and compatibility information

## 📈 Scaling & Performance

### Resource Optimization
- **Memory Management**: Configurable per-server allocation
- **Performance Tuning**: Adjustable view/simulation distances
- **Load Distribution**: BungeeCord handles player routing
- **Auto-Scaling**: Watchtower manages updates

### Performance Guidelines
- **Small Servers**: 4G-8G RAM for 1-20 players
- **Medium Servers**: 8G-16G RAM for 20-50 players
- **Large Servers**: 16G+ RAM for 50+ players
- **Creative Servers**: Higher RAM for building activities

## 🔄 Maintenance & Updates

### Automated Updates
- **Watchtower**: Automatic container updates
- **CI/CD Pipeline**: Automated testing and deployment
- **Rollback Capability**: Quick rollback to previous versions
- **Health Checks**: Built-in service monitoring

### Backup Strategy
- **Volume Persistence**: All data stored in Docker volumes
- **Configuration Backups**: Environment and compose files
- **Database Backups**: Minecraft world and player data
- **Automated Scheduling**: Configurable backup intervals

## 🎯 Use Cases

### Educational Institutions
- **Ikaria Games**: Educational platform integration
- **Subject-Specific**: Technical, healthcare, applied sciences
- **Student Projects**: Creative and survival modes
- **Class Management**: Controlled player limits

### Public Servers
- **Sandbox Environment**: Creative building
- **Survival Worlds**: Multiplayer survival experiences
- **Community Events**: Configurable based on usage
- **Performance Optimized**: Scalable for high player counts

## 🛡️ Compliance & Legal

### Mojang EULA Compliance
- EULA acceptance required for all servers
- Proper licensing implementation
- Educational use considerations

### Data Privacy
- User data protection measures
- Privacy-compliant data handling
- Secure data storage and transmission

## 📚 Documentation

- **Configuration Guide**: Complete setup documentation
- **API Documentation**: Admin API endpoints
- **Troubleshooting**: Common issues and solutions
- **Security Guidelines**: Best practices and procedures

## 🚀 Getting Started

1. **Prerequisites**: Docker and Docker Compose
2. **Clone Repository**: Download the platform code
3. **Configure Environment**: Set up `.env` file
4. **Build SPA**: Compile the admin panel
5. **Deploy Services**: Start all platform services
6. **Configure Servers**: Customize per your needs

The Minecraft SaaS Platform is production-ready with full Minecraft 1.21.1 support, comprehensive security measures, and enterprise-level management capabilities.