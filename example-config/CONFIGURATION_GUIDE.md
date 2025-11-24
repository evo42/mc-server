# Minecraft SaaS Platform - Comprehensive Configuration Guide

This guide details all available configuration options for the Minecraft SaaS Platform, enabling administrators to customize server behavior for different use cases.

## Table of Contents

1. [Environment Variables (.env file)](#environment-variables)
2. [Docker Compose Service Configuration](#docker-compose-configuration)
3. [Minecraft Server Settings](#minecraft-server-settings)
4. [Performance Tuning](#performance-tuning)
5. [Security Configuration](#security-configuration)
6. [Backup and Maintenance](#backup-and-maintenance)
7. [Best Practices](#best-practices)

## Environment Variables

### Administrative Configuration
- `ADMIN_USER`: Username for admin panel access
- `ADMIN_PASS`: Password for admin panel access
- `TZ`: Timezone for the system (e.g., UTC, Europe/Vienna)

### Minecraft Global Defaults
- `MC_VERSION`: Default Minecraft version (e.g., 1.21.10) - All servers will use this unless overridden
- `MC_EULA`: Must be set to TRUE to accept Mojang's EULA
- `MC_MEMORY`: Default initial RAM allocation (e.g., 4G, 8G)
- `MC_MAX_MEMORY`: Default maximum RAM allocation
- `MC_ONLINE_MODE`: TRUE for Mojang authentication, FALSE for cracked server
- `MC_ENABLE_PROXY_CONNECTIONS`: TRUE to allow BungeeCord connections

### Per-Server Memory Configuration
- `MC_[SERVERNAME]_MEMORY`: Initial RAM for specific server (e.g., `MC_ILIAS_MEMORY`)
- `MC_[SERVERNAME]_MAX_MEMORY`: Maximum RAM for specific server (e.g., `MC_ILIAS_MAX_MEMORY`)

### Server Messages
- `MC_[SERVERNAME]_MOTD`: Message of the Day for each server (displayed in server list)

### Network Settings
- `PROXY_PORT`: Main Minecraft port (default 25565)
- `ADMIN_API_PORT`: Admin API port (default 3000)
- `NGINX_PORT`: HTTP port (default 80)
- `NGINX_HTTPS_PORT`: HTTPS port (default 443)

## Docker Compose Configuration

### Service: Minecraft Servers

Each server service follows this pattern:

```yaml
mc-[servername]:
  build:
    context: ./minecraft-base
    args:
      - MC_VERSION=[version]  # Minecraft version to use
  environment:
    # Essential settings
    - EULA=[TRUE/FALSE]  # Accept Mojang EULA
    - VERSION=[version]  # Minecraft version (should match build arg)
    - TYPE=PAPER  # Server software type (PAPER recommended)
    - MEMORY=[size]  # Initial RAM allocation
    - MAX_MEMORY=[size]  # Maximum RAM allocation
    
    # Gameplay settings
    - MOTD=[message]  # Server description
    - ONLINE_MODE=[true/false]  # Authentication requirement
    - ENABLE_PROXY_CONNECTIONS=[true/false]  # BungeeCord support
    
    # Advanced settings (optional)
    - DIFFICULTY=[peaceful/easy/normal/hard]
    - MODE=[survival/creative/adventure/spectator]
    - MAX_PLAYERS=[number]  # Maximum concurrent players
    - VIEW_DISTANCE=[number]  # Render distance (chunks)
    - SIMULATION_DISTANCE=[number]  # Simulation distance (chunks)
    - PVP=[true/false]  # Player vs Player combat
    - SPAWN_ANIMALS=[true/false]
    - SPAWN_MONSTERS=[true/false]
    - SPAWN_NPCS=[true/false]
    - HARDCORE=[true/false]  # Permadeath mode
    - SPAWN_PROTECTION=[number]  # Protected spawn radius
    - MAX_WORLD_SIZE=[number]  # World border size limit
    - ANNOUNCE_PLAYER_ACHIEVEMENTS=[true/false]
    - ENABLE_COMMAND_BLOCK=[true/false]
    - ALLOW_NETHER=[true/false]
    - ALLOW_END=[true/false]
    - GENERATE_STRUCTURES=[true/false]
    - RESOURCE_PACK=[URL]  # Force resource pack URL
    - RCON_PORT=[port]  # Remote console port
    - RCON_PASSWORD=[password]  # RCON access password
```

### Service: BungeeCord
```yaml
bungeecord:
  ports:
    - "${PROXY_PORT:-25565}:25565"  # External access port
  volumes:
    - ./bungeecord/config:/home/bungee/server  # Configuration directory
```

### Service: Admin API
```yaml
admin-api:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock  # Docker access for management
    - ./[server]/datapacks:/app/[server]/datapacks  # Datapack access for each server
  environment:
    - ADMIN_USER=${ADMIN_USER:-admin}
    - ADMIN_PASS=${ADMIN_PASS:-admin123}
```

### Service: Nginx
```yaml
nginx:
  ports:
    - "${NGINX_PORT:-80}:80"  # HTTP access
    - "${NGINX_HTTPS_PORT:-443}:443"  # HTTPS access
  volumes:
    - ./admin-ui-dist:/usr/share/nginx/html  # SPA frontend
```

## Minecraft Server Settings

### Essential Settings (Must Configure)
- `EULA`: Must be TRUE to run Minecraft server
- `VERSION`: Minecraft version to run (1.21.10 supported)
- `TYPE`: Server software (PAPER recommended for performance)
- `MEMORY` / `MAX_MEMORY`: RAM allocation based on expected load
- `MOTD`: Server description shown to players
- `ONLINE_MODE`: Authentication method (TRUE = Mojang, FALSE = cracked)

### Performance Settings
- `VIEW_DISTANCE`: Higher = more visual quality, lower performance (4-32)
- `SIMULATION_DISTANCE`: Higher = more active chunks, lower performance (4-32)
- `MAX_PLAYERS`: Set according to available resources
- `USE_NATIVE_TRANSPORT=true`: Improves network performance on Linux

### Gameplay Settings
- `MODE`: Game mode (survival, creative, adventure, spectator)
- `DIFFICULTY`: Game difficulty (peaceful, easy, normal, hard)
- `PVP`: Enable/disable player combat
- `SPAWN_[ANIMALS/MONSTERS/NPCS]`: Control mob spawning

### World Settings
- `ALLOW_NETHER` / `ALLOW_END`: Enable dimensions
- `GENERATE_STRUCTURES`: Generate villages, temples, etc.
- `MAX_WORLD_SIZE`: Limit world border (max 29999984)
- `SPAWN_PROTECTION`: Protected area around spawn (0-100)

## Performance Tuning

### Memory Allocation Guidelines
- **Small Server (1-20 players)**: 4G-8G RAM
- **Medium Server (20-50 players)**: 8G-16G RAM
- **Large Server (50+ players)**: 16G+ RAM
- **Creative Server**: Higher RAM due to world building
- **Public Server**: Higher RAM for variable load

### View Distance Recommendations
- **High Performance**: 6-8 chunks
- **Balance**: 8-10 chunks
- **Visual Quality**: 10-12 chunks

### Simulation Distance Guidelines
- Usually 2 chunks less than view distance
- Higher = better gameplay experience, more resource usage

## Security Configuration

### Authentication
- `ONLINE_MODE=true`: Requires Mojang account (secure)
- `ONLINE_MODE=false`: Allows any username (less secure, easier access)

### Access Control
- Admin API requires authentication
- Server names validated against whitelist
- Path traversal protection in file operations

### Network Security
- Containers isolated in private networks
- Only proxy port exposed to public
- HTTPS for admin panel access

## Backup and Maintenance

### Data Persistence
All important data is stored in mounted volumes:
- `/data` in each server container: world data, configuration
- `/data/datapacks` in each server container: server-specific datapacks

### Automatic Updates
Watchtower service checks for updates every 30 minutes and applies them automatically.

### Manual Backup
Regular backups should be implemented outside of Docker:
```bash
docker exec -it [container_name] rcon-cli save-all  # Save world
docker exec [container_name] tar -czf backup.tar.gz /data  # Create backup
```

## Best Practices

### Server Configuration
1. **Memory Management**: Never allocate more RAM than available on host system
2. **Player Limits**: Set realistic maximums based on available resources
3. **Version Management**: Keep Minecraft versions updated for security
4. **Regular Backups**: Implement automated backup solution

### Performance
1. **Monitor Resources**: Use `docker stats` to monitor server performance
2. **Optimize Distances**: Balance view/sim distances for your player count
3. **Test Changes**: Always test configuration changes on staging first

### Security
1. **Update Regularly**: Keep Docker images updated
2. **Strong Passwords**: Use strong credentials for admin access
3. **Limit Access**: Restrict admin panel access to trusted users
4. **EULA Compliance**: Always set EULA=TRUE to avoid legal issues

### Maintenance
1. **Monitor Logs**: Regularly check container logs for issues
2. **Update Plugins**: Keep server plugins updated
3. **World Optimization**: Periodically optimize world files
4. **Resource Management**: Plan for growth and scaling needs

## Troubleshooting

### Common Issues
- **Server won't start**: Check EULA=TRUE in environment
- **Performance issues**: Review memory allocation and view distances
- **Connection problems**: Verify proxy configuration and ports
- **Plugin compatibility**: Ensure plugins are compatible with Paper 1.21.10

### Useful Commands
```bash
# Check all container status
docker-compose ps

# View logs for specific service
docker-compose logs [service_name]

# Restart specific service
docker-compose restart [service_name]

# Check resource usage
docker stats

# Execute command in running container
docker-compose exec [service_name] [command]
```

This configuration supports Minecraft 1.21.10 across all servers and provides flexibility for different educational and public use cases while maintaining security and performance.