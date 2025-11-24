# Deployment Instructions for Minecraft Server

This document provides instructions for deploying the Minecraft server setup to the production server.

## Prerequisites

Before deployment, ensure you have:

1. SSH key authentication set up for `root@mc.ikaria.dev`
2. A Cloudflare API token with DNS edit permissions (for DNS setup after deployment)
3. Access to the server's firewall configuration to allow required ports (25565 for Minecraft, 3000 for admin UI, 80/443 for Nginx proxy)

## Environment Variables

Before running the DNS setup after deployment, you'll need to set up the Cloudflare API token:

```bash
export CF_API_TOKEN="your_cloudflare_api_token_here"
```

## Deployment Process

### 1. Run the Deployment Script

Execute the deployment script locally:

```bash
./deploy.sh
```

The script will:
- Create a backup of any existing installation
- Copy all necessary files to the server
- Install Docker and Docker Compose if not already present
- Install Node.js and dependencies for the admin UI
- Set up the required directory structure
- Make necessary files executable

### 2. Start the Services

After the deployment script completes successfully, SSH to the server and start the services:

```bash
# SSH to the server
ssh root@mc.ikaria.dev

# Navigate to the deployment directory
cd /opt/minecraft-server

# Start the full stack (Minecraft servers + BungeeCord + Admin UI + Nginx Proxy)
docker-compose -f docker-compose-full.yml up -d
```

### 3. Configure DNS Records (Optional)

If you want to set up DNS records using the Cloudflare API:

```bash
# In the /opt/minecraft-server directory on the server
export CF_API_TOKEN="your_cloudflare_api_token_here"
./setup-cloudflare-dns.sh
```

## Service Configuration

The deployment includes:

- **Two Minecraft servers**: mc-ilias and mc-niilo
- **BungeeCord proxy**: Routes players between servers, accessible at mc.ikaria.dev
- **Admin UI**: Web interface at port 3000 for managing servers
- **Nginx Proxy Manager**: For managing web-based services

## Ports and Access

- **Minecraft Server Port**: 25565 (BungeeCord proxy)
- **Admin UI**: 3000 (accessible via the server's IP)
- **Nginx Proxy Manager Admin**: 81 (if using full setup)

## Firewall Configuration

Make sure the following ports are open on your server:

```bash
# For Minecraft server access
sudo ufw allow 25565

# For admin UI
sudo ufw allow 3000

# For Nginx proxy (if using full setup)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 81  # For Nginx Proxy Manager admin panel
```

## Verification

After deployment and startup:

1. Check if all containers are running:
```bash
docker ps
```

2. Check the logs for each service:
```bash
docker logs mc-bungeecord
docker logs mc-ilias
docker logs mc-niilo
docker logs mc-admin-ui
```

3. Verify the Minecraft servers are accessible via:
   - mc.ikaria.dev (through BungeeCord)
   - Direct subdomains if DNS is configured

4. Verify the Admin UI is accessible at `http://[your-server-ip]:3000`

## Management

### Restart Services
```bash
docker-compose -f docker-compose-full.yml restart
```

### Update Services
```bash
# Pull latest images
docker-compose -f docker-compose-full.yml pull

# Restart to use updated images
docker-compose -f docker-compose-full.yml up -d
```

### Check Logs
```bash
# View logs for mc-ilias
docker logs mc-ilias

# View logs for mc-niilo
docker logs mc-niilo

# View logs for BungeeCord
docker logs mc-bungeecord

# View logs for admin UI
docker logs mc-admin-ui
```

## Troubleshooting

### If containers fail to start:
1. Check the logs: `docker logs [container_name]`
2. Verify the configuration files
3. Check available disk space: `df -h`
4. Check available memory: `free -h`

### If Minecraft servers are not accessible:
1. Verify that port 25565 is open in the firewall
2. Check that BungeeCord is routing correctly
3. Verify that the backend Minecraft servers are running

### If Admin UI is not accessible:
1. Verify port 3000 is accessible
2. Check the admin UI logs
3. Verify Docker networking