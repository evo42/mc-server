# Minecraft Server Setup

This setup provides Minecraft servers (mc-xyz) running in Docker containers with the latest Minecraft version (1.21.10) and an admin UI for management.

## Components

- **mc-ilias**: Minecraft server instance 1
- **mc-niilo**: Minecraft server instance 2
- **admin-ui**: Web-based admin interface to manage server states
- **watchtower**: Automatic container updates
- **nginx-proxy-manager**: Reverse proxy for web interfaces (admin UI)

## Network Configuration

- Minecraft servers use direct port mapping since the Minecraft protocol is TCP-based and doesn't work through traditional HTTP proxies
- mc-ilias: accessible on port 25566
- mc-niilo: accessible on port 25567
- Admin UI: accessible on port 3000

## Setup

1. Build and start the Minecraft servers:
   ```bash
   cd /path/to/mc-server
   docker-compose up -d
   ```

2. For the Nginx Proxy Manager:
   ```bash
   cd nginx-proxy
   docker-compose up -d
   ```

3. Access the Admin UI at http://localhost:3000 to manage the servers

4. Configure Nginx Proxy Manager (default: http://localhost:81)
   - Default credentials: Email: admin@example.com, Password: changeme

## Datapack Installation

The servers support datapacks. Follow the instructions in [datapack-installation.md](datapack-installation.md) to install your VanillaTweaks datapack or any other datapacks.

## Admin UI Usage

The admin UI allows you to:
- Check server status
- Start/stop/restart servers
- Monitor server health

## Nginx Proxy Manager Configuration

For the Admin UI, configure a proxy host in Nginx Proxy Manager to forward web traffic to the admin UI container. For the Minecraft servers themselves, since they use the Minecraft protocol, direct port access is required.
