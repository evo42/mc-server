# Minecraft Server Infrastructure Production Deployment Guide

## Overview
This guide describes how to deploy the Minecraft server infrastructure to a production server. The infrastructure includes:
- mc-ilias server with dedicated admin UI
- mc-niilo server with dedicated admin UI
- School server with dedicated admin UI
- General server with dedicated admin UI
- Main admin UI

All servers are configured with MEMORY=5G and MAX_MEMORY=100G.

## Prerequisites
- Docker installed (version 20.0 or higher)
- Docker Compose installed (version v2.x or higher)
- At least 400GB free disk space
- At least 420GB available RAM (5G * 6 containers + overhead)
- Ports 3000-3004 available
- Internet connectivity for initial setup

## Deployment Steps

### Step 1: Prepare Production Server Environment
1. SSH into your production server
2. Ensure Docker and Docker Compose are installed:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose-plugin
   sudo usermod -aG docker $USER
   ```
3. Log out and log back in to apply Docker group membership
4. Verify Docker installation:
   ```bash
   docker version
   docker compose version
   ```

### Step 2: Transfer Files to Production Server
Using SCP or any secure transfer method, upload the deployment files to your production server:

```bash
scp -r deployment-package/ user@production-server:/home/user/mc-server-deployment/
```

### Step 3: Push Docker Images to Registry (Recommended)
For production environments, it's recommended to push the images to a registry like Docker Hub or a private registry:

```bash
# Login to your registry
docker login [your-registry]

# Tag and push all images
docker tag mc-server/admin-ui:prod-v1.0 [your-registry]/mc-server/admin-ui:prod-v1.0
docker tag mc-server/mc-ilias:prod-v1.0 [your-registry]/mc-server/mc-ilias:prod-v1.0
docker tag mc-server/ilias-admin-ui:prod-v1.0 [your-registry]/mc-server/ilias-admin-ui:prod-v1.0
docker tag mc-server/mc-niilo:prod-v1.0 [your-registry]/mc-server/mc-niilo:prod-v1.0
docker tag mc-server/niilo-admin-ui:prod-v1.0 [your-registry]/mc-server/niilo-admin-ui:prod-v1.0
docker tag mc-server/school-server:prod-v1.0 [your-registry]/mc-server/school-server:prod-v1.0
docker tag mc-server/school-admin-ui:prod-v1.0 [your-registry]/mc-server/school-admin-ui:prod-v1.0
docker tag mc-server/general-server:prod-v1.0 [your-registry]/mc-server/general-server:prod-v1.0
docker tag mc-server/general-admin-ui:prod-v1.0 [your-registry]/mc-server/general-admin-ui:prod-v1.0

# Push all images
docker push [your-registry]/mc-server/admin-ui:prod-v1.0
docker push [your-registry]/mc-server/mc-ilias:prod-v1.0
docker push [your-registry]/mc-server/ilias-admin-ui:prod-v1.0
docker push [your-registry]/mc-server/mc-niilo:prod-v1.0
docker push [your-registry]/mc-server/niilo-admin-ui:prod-v1.0
docker push [your-registry]/mc-server/school-server:prod-v1.0
docker push [your-registry]/mc-server/school-admin-ui:prod-v1.0
docker push [your-registry]/mc-server/general-server:prod-v1.0
docker push [your-registry]/mc-server/general-admin-ui:prod-v1.0
```

Then update the image names in the docker-compose files to reference your registry.

### Step 4: Alternative - Transfer Images Directly
If you prefer to transfer images directly without a registry:

```bash
# On build server, save images
docker save mc-server/admin-ui:prod-v1.0 mc-server/mc-ilias:prod-v1.0 \
  mc-server/ilias-admin-ui:prod-v1.0 mc-server/mc-niilo:prod-v1.0 \
  mc-server/niilo-admin-ui:prod-v1.0 mc-server/school-server:prod-v1.0 \
  mc-server/school-admin-ui:prod-v1.0 mc-server/general-server:prod-v1.0 \
  mc-server/general-admin-ui:prod-v1.0 -o mc-server-images.tar

# Transfer the tar file to production server
scp mc-server-images.tar user@production-server:/home/user/

# On production server, load the images
docker load -i mc-server-images.tar
```

### Step 5: Deploy the Infrastructure
Navigate to the deployment directory and run the deployment script:

```bash
cd /home/user/mc-server-deployment/
chmod +x deploy-to-production.sh stop-production.sh
./deploy-to-production.sh
```

### Step 6: Verify Deployment
Check that all services are running:

```bash
docker ps
```

You should see containers for:
- mc-admin-ui (port 3000)
- mc-ilias + ilias-admin-ui (port 3001)
- mc-niilo + niilo-admin-ui (port 3002)
- school-server + school-admin-ui (port 3003)
- general-server + general-admin-ui (port 3004)

## Service Access Points
Once deployed, the services will be accessible at:
- Main Admin UI: http://[server-ip]:3000
- mc-ilias Admin UI: http://[server-ip]:3001
- mc-niilo Admin UI: http://[server-ip]:3002
- School Server Admin UI: http://[server-ip]:3003
- General Server Admin UI: http://[server-ip]:3004

## Managing Services
### To stop the infrastructure:
```bash
./stop-production.sh
```

### To check logs for a specific service:
```bash
docker-compose -f docker-compose-ilias.yml logs -f mc-ilias
```

### To update services:
1. Pull new images
2. Run the deployment script again with `--force-recreate` flag

## Security Recommendations
- Configure firewall to restrict access to admin UIs
- Use reverse proxy (nginx) with SSL certificates
- Implement basic authentication or OAuth for admin UIs
- Regular security updates for base images
- Monitor resource usage and set up alerts

## Troubleshooting
If services fail to start:
1. Check Docker daemon status: `sudo systemctl status docker`
2. Check available disk space: `df -h`
3. Check available memory: `free -h`
4. View specific container logs: `docker logs [container-name]`
5. Check compose file syntax: `docker-compose -f [file] config`

## Maintenance
Regular maintenance tasks include:
- Backing up server data and configurations
- Updating Docker and Docker Compose
- Monitoring container health and performance
- Rotating logs to prevent disk space issues
- Updating Minecraft server versions periodically