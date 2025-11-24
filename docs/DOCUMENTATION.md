# Minecraft SaaS Platform - Complete Documentation

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Configuration](#configuration)
5. [Security](#security)
6. [Deployment](#deployment)
7. [Management](#management)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Platform Overview

The Minecraft SaaS Platform is a production-ready multi-server system supporting Minecraft 1.21.1 with comprehensive management capabilities. The platform enables centralized management of multiple Minecraft servers through a unified interface while maintaining security and scalability.

### Key Features
- **Minecraft 1.21.1 Support**: Full compatibility with latest Minecraft version
- **Universal Base Image**: Single image supports any PaperMC-compatible version
- **Secure Management**: Enterprise-grade security with validation and authentication
- **Centralized Configuration**: Single docker-compose.yml with comprehensive .env
- **SPA Admin Interface**: Modern Vue.js admin panel for server management
- **Scalable Architecture**: Designed for horizontal scaling and growth

## Architecture

### Service Architecture
```
External Access → Nginx → BungeeCord → Minecraft Servers
                ↓         ↓           ↓
           Admin API ←→ Dockerode ←→ Data Volumes
```

### Network Architecture
- **minecraft-net**: Internal service communication
- **proxy**: External access network
- **Isolated containers**: Each service runs in secure, isolated environment

### Data Flow
- Player connections routed through BungeeCord to appropriate servers
- Admin actions processed through secured API with Dockerode integration
- Data persisted in Docker volumes with backup capabilities

## Components

### 1. minecraft-base
- **Purpose**: Universal Minecraft server image
- **Version Support**: Minecraft 1.21.1 (dynamic PaperMC download)
- **Runtime**: Java 21 base image
- **Feature**: Parameterized version selection
- **Security**: Non-root execution

### 2. admin-api
- **Purpose**: REST API for server management
- **Technology**: Node.js with Express
- **Security**: Basic auth with server validation
- **Integration**: Dockerode for container management
- **Features**: Server control, status monitoring, datapack management

### 3. admin-ui-spa
- **Purpose**: Modern admin interface
- **Technology**: Vue.js single-page application
- **Features**: Server monitoring, control, datapack management
- **Design**: Bootstrap UI with responsive design

### 4. Supporting Services
- **BungeeCord**: Server switching proxy
- **Nginx**: Web server and API proxy
- **Watchtower**: Automatic container updates

## Configuration

### Environment Variables (.env)
Critical configuration parameters:

#### Admin Credentials
```
ADMIN_USER=admin
ADMIN_PASS=admin123
```

#### Minecraft Defaults
```
MC_VERSION=1.21.1          # Target Minecraft version
MC_EULA=TRUE               # Required for operation
MC_MEMORY=4G               # Default initial RAM
MC_MAX_MEMORY=8G           # Default maximum RAM
MC_ONLINE_MODE=false       # Authentication method
MC_ENABLE_PROXY_CONNECTIONS=true  # BungeeCord support
```

#### Server-Specific Memory Allocation
```
MC_ILIAS_MEMORY=8G
MC_NILO_MEMORY=12G
MC_BGSTPOELEN_MEMORY=6G
# ... etc for all servers
```

#### Network Settings
```
PROXY_PORT=25565           # Main Minecraft port
ADMIN_API_PORT=3000        # Admin API port
NGINX_PORT=80              # HTTP port
NGINX_HTTPS_PORT=443       # HTTPS port
```

### Docker Compose Configuration
The main `docker-compose.yml` orchestrates all services with environment variable support for flexible configuration.

## Security

### API Security Measures
- **Server Validation**: All server names validated against whitelist
- **Path Traversal Protection**: Secure file operations prevent directory traversal
- **Authentication**: Basic auth required for all endpoints
- **Input Sanitization**: All user inputs validated and sanitized

### Container Security
- **Non-root Execution**: Containers run as non-root users where possible
- **Network Isolation**: Services isolated in separate networks
- **Limited Capabilities**: Reduced container privileges
- **Secure Volume Mounts**: Proper mounting practices implemented

### Data Security
- **Volume Persistence**: All critical data stored in Docker volumes
- **Backup Strategy**: Automated backup capabilities
- **Access Control**: Role-based access control for management functions

## Deployment

### Prerequisites
- Docker Engine (version 20.10+)
- Docker Compose (version 2.0+)
- Node.js (for SPA build)

### Development Deployment
```bash
# 1. Build SPA frontend
cd admin-ui-spa
npm install
npm run build
cd ..

# 2. Configure environment
cp example-config/.env.example .env
# Edit .env with your values

# 3. Start platform
docker-compose up -d
```

### Production Deployment
Use provided scripts:
```bash
# Deploy platform
./deploy.sh deploy

# Production-specific deployment
./deploy-prod.sh deploy

# Update to latest versions
./deploy.sh update

# Check status
./deploy-prod.sh health-check
```

### CI/CD Integration
GitHub Actions workflow includes:
- Automated testing
- Multi-platform builds (amd64/arm64)
- Docker image publishing
- Production deployment triggers

## Management

### Server Management Features
- **Start/Stop/Restart**: Remote server control
- **Status Monitoring**: Real-time status and resource usage
- **Player Tracking**: Active player count monitoring
- **Resource Management**: CPU and memory monitoring

### Datapack Management
- **Browse**: Search available datapacks
- **Install**: One-click installation
- **Uninstall**: Easy removal
- **Version Control**: Version management

### Performance Management
- **Memory Tuning**: Per-server memory allocation
- **Distance Settings**: View and simulation distance optimization
- **Player Limits**: Configurable maximum player counts
- **Resource Monitoring**: Real-time resource usage tracking

## Maintenance

### Automated Maintenance
- **Watchtower**: Automatic container updates
- **Health Checks**: Built-in service monitoring
- **Backup Systems**: Automated backup capabilities

### Manual Maintenance Tasks
- **Configuration Updates**: Environment variable adjustments
- **Server Scaling**: Add/remove servers as needed
- **Performance Tuning**: Ongoing optimization
- **Security Updates**: Regular security patching

### Backup Strategy
1. **Volume Backups**: Docker volume snapshots
2. **Configuration Backups**: Environment and compose files
3. **World Backups**: Minecraft world data
4. **Schedule**: Configurable backup intervals

## Troubleshooting

### Common Issues

#### Server Won't Start
- **Check**: EULA=TRUE in environment variables
- **Verify**: Sufficient system resources
- **Review**: Log files in docker-compose logs

#### Performance Issues
- **Monitor**: Resource usage with docker stats
- **Adjust**: Memory allocation and view distances
- **Scale**: Consider hardware upgrade if needed

#### Connection Problems
- **Verify**: Port configuration and firewall settings
- **Check**: BungeeCord configuration
- **Test**: Network connectivity between services

#### Admin Panel Access
- **Confirm**: API endpoint accessibility
- **Check**: Authentication credentials
- **Review**: Nginx configuration

### Useful Commands
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs [service_name]

# Execute command in container
docker-compose exec [service_name] [command]

# Monitor resources
docker stats

# Restart specific service
docker-compose restart [service_name]
```

## Best Practices

### Configuration Best Practices
- **Environment Management**: Use .env for all configurable values
- **Memory Allocation**: Assign based on expected usage patterns
- **Security Settings**: Enable authentication and validation
- **Backup Strategy**: Implement automated backup procedures

### Security Best Practices
- **Regular Updates**: Keep all components updated
- **Access Control**: Restrict admin access to trusted users
- **Monitoring**: Implement comprehensive monitoring
- **Validation**: Validate all user inputs

### Performance Best Practices
- **Resource Monitoring**: Continuously monitor resource usage
- **Optimization**: Adjust settings based on usage patterns
- **Scaling**: Plan for growth and scaling needs
- **Load Distribution**: Use BungeeCord for load distribution

### Operational Best Practices
- **Documentation**: Maintain updated documentation
- **Change Management**: Follow proper change procedures
- **Incident Response**: Have response procedures in place
- **Testing**: Test changes in staging before production

## Use Cases

### Educational Institutions
- **ILIAS Integration**: Educational platform connectivity
- **Subject-Specific**: Technical, healthcare, applied sciences focus
- **Student Projects**: Creative and survival server modes
- **Class Management**: Controlled player limits and access

### Public Servers
- **Sandbox Environment**: Creative building spaces
- **Survival Worlds**: Multiplayer survival experiences  
- **Community Events**: Configurable for events and activities
- **Performance Optimization**: Scalable for high player counts

## Compliance

### Mojang EULA Compliance
- **EULA Acceptance**: EULA=TRUE required for all servers
- **Proper Licensing**: Ensure compliance with Mojang terms
- **Educational Use**: Consider educational licensing requirements

### Data Privacy Compliance
- **User Data Protection**: Implement appropriate safeguards
- **Data Retention**: Follow retention policies
- **Access Controls**: Implement proper access limitations

## Support and Resources

### Documentation Locations
- **Main README**: High-level overview and quick start
- **Configuration Guide**: Detailed setup instructions
- **API Documentation**: Admin API endpoints
- **Troubleshooting Guide**: Common issues and solutions

### Community and Support
- **Issue Tracking**: GitHub issues for bug reports
- **Contributions**: Open source contributions welcome
- **Updates**: Regular updates and improvements

This documentation provides comprehensive guidance for deploying, managing, and maintaining the Minecraft SaaS Platform. The platform is production-ready with full Minecraft 1.21.1 support, comprehensive security measures, and enterprise-level management capabilities.