# Direct Fix for mc.ikaria.dev/mc-admin Redirect Loop

## Immediate Steps (to be run on the server)

### 1. Check Current Admin UI Logs
```bash
docker logs mc-admin-ui
```

### 2. Check Traefik Logs
```bash
docker logs <traefik-container-name>
```

### 3. Temporarily Stop All Services and Reconfigure
```bash
cd /opt/minecraft-server
docker compose -f docker-compose-full.yml down

# Edit the docker-compose file to add the Traefik labels properly:
# (Use nano, vim, or any text editor to modify the file)
nano docker-compose-full.yml
```

### 4. Use a Simpler Configuration First
Try a basic Traefik configuration without complex middleware that might interfere with authentication:

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
      - ADMIN_USER=admin
      - ADMIN_PASS=admin123
    restart: unless-stopped
    networks:
      - minecraft-net
    depends_on:
      - mc-ilias
      - mc-niilo
    labels:
      - "traefik.enable=true"
      # Main statistics page
      - "traefik.http.routers.stats.rule=Host(`mc.ikaria.dev`) && Path(`/`)"
      - "traefik.http.routers.stats.tls=true"
      - "traefik.http.routers.stats.entrypoints=websecure"
      - "traefik.http.services.stats.loadbalancer.server.port=3000"
      - "traefik.http.services.stats.loadbalicer.server.scheme=http"
      # Admin interface
      - "traefik.http.routers.admin.rule=Host(`mc.ikaria.dev`) && PathPrefix(`/mc-admin`)"
      - "traefik.http.routers.admin.tls=true"
      - "traefik.http.routers.admin.entrypoints=websecure"
      - "traefik.http.services.admin.loadbalancer.server.port=3000"
      - "traefik.http.services.admin.loadbalancer.server.scheme=http"
```

### 5. Alternative: Test Direct Access First
Before implementing complex routing, test if the admin UI works directly:

```bash
# Remove the Traefik labels temporarily and access directly via server IP
# Just make sure ports are exposed:
docker compose -f docker-compose-full.yml down
docker compose -f docker-compose-full.yml up -d
```

Then access: `http://[SERVER_IP]:3000/mc-admin`

If this works, then the issue is definitely with Traefik routing.

### 6. Check Authentication Configuration
The server.js uses express-basic-auth, which sends a 401 Unauthorized response for login challenges. Some reverse proxies (including Traefik) may not handle this properly. Check if the basic auth configuration is causing issues:

The authentication in server.js:
```javascript
basicAuth({
    users: { [ADMIN_USER]: ADMIN_PASS },
    challenge: true,  // This creates the authentication challenge
    realm: 'Minecraft Admin Area'
})
```

The `challenge: true` option causes the browser to show the login dialog, but in combination with some proxy configurations, this can cause redirect loops.

### 7. If Direct Access Works, Reconfigure Traefik Properly
If accessing directly works, then add minimal Traefik labels that just route to the service without interfering with authentication:

```yaml
  admin-ui:
    # ... other config ...
    labels:
      - "traefik.enable=true"
      # Route all paths under mc-admin to the admin UI
      - "traefik.http.routers.minecraft-admin.rule=Host(`mc.ikaria.dev`) && PathPrefix(`/mc-admin`)"
      - "traefik.http.routers.minecraft-admin.tls.certresolver=letsencrypt"  # adjust if needed
      - "traefik.http.routers.minecraft-admin.entrypoints=websecure"
      - "traefik.http.routers.minecraft-admin.service=minecraft-service"
      # Route the root stats page
      - "traefik.http.routers.minecraft-stats.rule=Host(`mc.ikaria.dev`) && Path(`/`)"
      - "traefik.http.routers.minecraft-stats.tls.certresolver=letsencrypt"  # adjust if needed
      - "traefik.http.routers.minecraft-stats.entrypoints=websecure"
      - "traefik.http.routers.minecraft-stats.service=minecraft-service"
      # Service definition
      - "traefik.http.services.minecraft-service.loadbalancer.server.port=3000"
      - "traefik.http.services.minecraft-service.loadbalancer.server.scheme=http"
```

### 8. Restart and Test
```bash
docker compose -f docker-compose-full.yml down
docker compose -f docker-compose-full.yml up -d
```

### 9. Test Authentication Headers
The issue might be that Traefik is not passing the authentication headers properly. You can try:

```yaml
    labels:
      # ... previous labels ...
      # Ensure authentication headers are passed through
      - "traefik.http.middlewares.auth-headers.headers.customrequestheaders.Authorization=true"
      # Add headers middleware to router if needed
      # - "traefik.http.routers.admin.middlewares=auth-headers"
```

## Debugging Steps

If the issue continues:

1. Check if the domain resolves correctly: `nslookup mc.ikaria.dev`
2. Check SSL certificate status: `openssl s_client -connect mc.ikaria.dev:443`
3. Test with curl to see headers: `curl -I https://mc.ikaria.dev/mc-admin`
4. Verify that the admin UI can be accessed directly via IP before applying Traefik routing

## Temporary Workaround

If all else fails, you can temporarily access the admin UI directly via the server IP on port 3000 until the Traefik configuration is fixed properly.