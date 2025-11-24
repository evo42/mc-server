# Fix for mc.ikaria.dev Redirect Loop

## Problem
- mc.ikaria.dev shows "too many redirects" error
- Need to serve: 
  - `https://mc.ikaria.dev/` → Statistics overview home page
  - `https://mc.ikaria.dev/mc-admin` → Admin area for Minecraft servers

## Analysis
The admin UI application is already configured properly in server.js:
- `/` route serves stats.html (statistics page)
- `/mc-admin` route serves index.html (admin interface)

The issue is with Traefik routing configuration. The server already has Traefik running (ports 80/443 in use), but the admin-ui container needs proper labels for routing.

## Solution Steps

### 1. Update docker-compose-full.yml on the server

Connect to the server and modify the admin-ui service to add Traefik labels:

```yaml
  admin-ui:
    build: ./admin-ui
    container_name: mc-admin-ui
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - minecraft-net
    depends_on:
      - mc-ilias
      - mc-niilo
    labels:
      # Enable Traefik for this service
      - "traefik.enable=true"
      
      # Router for statistics page (root path)
      - "traefik.http.routers.minecraft-stats.rule=Host(`mc.ikaria.dev`) && Path(`/`)"
      - "traefik.http.routers.minecraft-stats.entrypoints=websecure"
      - "traefik.http.routers.minecraft-stats.tls=true"
      - "traefik.http.routers.minecraft-stats.service=minecraft-service"
      
      # Router for admin interface (mc-admin path)  
      - "traefik.http.routers.minecraft-admin.rule=Host(`mc.ikaria.dev`) && PathPrefix(`/mc-admin`)"
      - "traefik.http.routers.minecraft-admin.entrypoints=websecure"
      - "traefik.http.routers.minecraft-admin.tls=true"
      - "traefik.http.routers.minecraft-admin.service=minecraft-service"
      
      # Define the backend service
      - "traefik.http.services.minecraft-service.loadbalancer.server.port=3000"
      - "traefik.http.services.minecraft-service.loadbalancer.server.scheme=http"
      
      # Additional path stripping if needed
      - "traefik.http.middlewares.strip-admin-prefix.stripprefix.prefixes=/mc-admin"
      - "traefik.http.routers.minecraft-admin.middlewares=strip-admin-prefix"
```

### 2. Commands to apply the fix

```bash
# Connect to the server
ssh root@mc.ikaria.dev

# Navigate to the directory
cd /opt/minecraft-server

# Stop and restart the admin-ui service
docker compose -f docker-compose-full.yml down admin-ui
docker compose -f docker-compose-full.yml up -d admin-ui

# Verify the service is running
docker compose -f docker-compose-full.yml ps
```

### 3. Alternative: If SSH is not accessible

If SSH is blocked or timing out, check these things:

1. Firewall configuration may have changed
2. Check if the server is up and accessible
3. Contact your hosting provider if there are network issues

### 4. Verification

After applying the fix:
- Visit https://mc.ikaria.dev/ → Should show statistics page
- Visit https://mc.ikaria.dev/mc-admin → Should show admin interface

## Additional Notes

- The nginx-proxy-manager was previously removed since it conflicted with the existing Traefik
- The admin UI service handles both routes internally in server.js
- Traefik should now properly route based on the path prefixes
- Make sure the domain mc.ikaria.dev points to the server IP

## Troubleshooting 

If redirect issues persist:
1. Check Traefik logs: `docker logs traefik`
2. Verify DNS resolution: `nslookup mc.ikaria.dev`
3. Check if HTTPS certificates are properly configured for the domain
4. Confirm that no other services are conflicting with the host path routing