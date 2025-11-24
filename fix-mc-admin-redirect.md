# Fix for mc.ikaria.dev/mc-admin "Too Many Redirects" Issue

## Problem Analysis
The `/mc-admin` path is experiencing a redirect loop, which suggests there's an authentication-related redirect cycle happening.

Looking at the server.js code in the admin UI, we can see there's basic authentication applied to routes except for public ones. The authentication middleware is set up as follows:

```javascript
app.use((req, res, next) => {
    // Define public routes that don't require authentication
    const publicRoutes = [
        '/',
        '/debug/historical-data',
        '/api/public/status/mc-ilias',
        '/api/public/status/mc-niilo',
        '/api/public/status/all'
    ];

    if (publicRoutes.includes(req.path) || req.path.startsWith('/api/public/') || req.path.startsWith('/debug/')) {
        // Skip authentication for public routes
        next();
    } else {
        // Apply authentication for all other routes
        basicAuth({
            users: { [ADMIN_USER]: ADMIN_PASS },
            challenge: true,
            realm: 'Minecraft Admin Area'
        })(req, res, next);
    }
});
```

The `/mc-admin` path is NOT in the public routes list, so it requires authentication. This is expected behavior.

## Potential Causes of Redirect Loop

1. **Browser caching authentication challenges**: The browser may be caching an authentication challenge response
2. **Traefik authentication conflicts**: Traefik might be interfering with the authentication process
3. **Missing Traefik labels**: The service isn't properly routed through Traefik
4. **HTTPS redirect conflicts**: Multiple layers might be trying to enforce HTTPS

## Solution Steps

### 1. Clear Browser Cache First
Before making server changes:
- Clear browser cache and cookies for mc.ikaria.dev
- Try in an incognito/private window

### 2. Add Specific Traefik Configuration
On the server, update the docker-compose-full.yml file with the proper Traefik configuration:

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
      # Main router for statistics page
      - "traefik.http.routers.minecraft-stats.rule=Host(`mc.ikaria.dev`) && Path(`/`)"
      - "traefik.http.routers.minecraft-stats.entrypoints=websecure"
      - "traefik.http.routers.minecraft-stats.tls=true"
      - "traefik.http.routers.minecraft-stats.service=minecraft-service"
      # Router for admin interface
      - "traefik.http.routers.minecraft-admin.rule=Host(`mc.ikaria.dev`) && PathPrefix(`/mc-admin`)"
      - "traefik.http.routers.minecraft-admin.entrypoints=websecure"
      - "traefik.http.routers.minecraft-admin.tls=true"
      - "traefik.http.routers.minecraft-admin.service=minecraft-service"
      # Service configuration
      - "traefik.http.services.minecraft-service.loadbalancer.server.port=3000"
      - "traefik.http.services.minecraft-service.loadbalancer.server.scheme=http"
```

### 3. Alternative Configuration (if Traefik is causing issues)
If Traefik configuration is the issue, you could temporarily expose the admin UI directly:

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
```

Then you could access the admin UI directly at `http://[server-ip]:3000/mc-admin`

### 4. Check the Traefik Configuration on Server
Check the current Traefik configuration to see if there are conflicting rules:

```bash
# Check running containers to find Traefik
docker ps | grep traefik

# Check Traefik configuration
docker exec <traefik-container-name> cat /etc/traefik/traefik.yml
```

### 5. Check for Current Routing Rules
Look for any existing mc.ikaria.dev routing rules that might be conflicting:

```bash
# Check current Traefik routers
docker exec <traefik-container-name> traefik --api --entryPoints.web.address=:8080
# Or view through Traefik dashboard if available
```

### 6. Temporarily Use IP Address
As a quick test, you can try accessing the admin UI directly via the server IP:

```
http://[server-ip]:3000/mc-admin
```

Default credentials: admin / admin123 (from the environment variables in the compose file)

### 7. Restart Required Services
After making changes:

```bash
cd /opt/minecraft-server
docker compose -f docker-compose-full.yml down admin-ui
docker compose -f docker-compose-full.yml up -d admin-ui
```

## Important Notes

- The admin UI expects basic authentication for the `/mc-admin` route
- If Traefik is adding an additional authentication layer, this could cause redirect loops
- Check that your SSL certificate is properly configured for mc.ikaria.dev
- Ensure DNS is properly pointing to your server
- Consider that some reverse proxy configurations might interfere with basic authentication headers

## Troubleshooting

If the issue persists:
1. Check browser developer tools Network tab for the redirect sequence
2. Look at admin-ui container logs: `docker logs mc-admin-ui`
3. Look at Traefik container logs: `docker logs <traefik-container-name>`
4. Check if there are any proxy headers being set incorrectly