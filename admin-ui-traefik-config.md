# Traefik Configuration for Minecraft Admin UI

To fix the redirect issue on https://mc.ikaria.dev/, you need to update the admin-ui service in the docker-compose file to include proper Traefik routing labels.

## Current Issue
- Website mc.ikaria.dev has redirect loop
- Need: https://mc.ikaria.dev/ - Statistics overview home page  
- Need: https://mc.ikaria.dev/mc-admin - Admin area for Minecraft servers

## Solution
Add Traefik labels to the admin-ui service to properly route both paths:

```yaml
  admin-ui:
    build: ./admin-ui
    container_name: mc-admin-ui
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # To interact with Docker
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - minecraft-net
    depends_on:
      - mc-ilias
      - mc-niilo
    labels:
      - "traefik.enable=true"
      # Route the root path to stats page
      - "traefik.http.routers.minecraft-stats.rule=Host(`mc.ikaria.dev`) && Path(`/`)"
      - "traefik.http.routers.minecraft-stats.entrypoints=websecure"
      - "traefik.http.routers.minecraft-stats.tls=true"
      - "traefik.http.routers.minecraft-stats.service=minecraft-service"
      # Route the mc-admin path to admin interface
      - "traefik.http.routers.minecraft-admin.rule=Host(`mc.ikaria.dev`) && PathPrefix(`/mc-admin`)"
      - "traefik.http.routers.minecraft-admin.entrypoints=websecure"
      - "traefik.http.routers.minecraft-admin.tls=true"
      - "traefik.http.routers.minecraft-admin.service=minecraft-service"
      # Define the service
      - "traefik.http.services.minecraft-service.loadbalancer.server.port=3000"
      - "traefik.http.services.minecraft-service.loadbalancer.server.scheme=http"
```

## Steps to Apply

1. Add the above labels to the admin-ui service in `/opt/minecraft-server/docker-compose-full.yml` on the server

2. Restart the admin-ui service:
   ```bash
   cd /opt/minecraft-server
   docker compose -f docker-compose-full.yml down admin-ui
   docker compose -f docker-compose-full.yml up -d admin-ui
   ```

3. Wait a few minutes for Traefik to update the routing rules

After this change:
- https://mc.ikaria.dev/ will serve the statistics page (from server.js route `/`)
- https://mc.ikaria.dev/mc-admin will serve the admin interface (from server.js route `/mc-admin`)

Note: Since there's already a Traefik instance running on the server (evidenced by port 80/443 being in use), adding these labels will make Traefik automatically configure the routing without needing the nginx-proxy-manager service.