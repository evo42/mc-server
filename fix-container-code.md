# Fix for Admin UI Container - Application Code Changes

## Problem
The application code in server.js has routes that don't match the desired external routing:
- Root path `/` serves admin interface but requires auth
- `/stats` path serves stats page but is not properly exposed externally

## Solution
Update the application code to have the correct internal routing:

### 1. Update server.js routes:
```javascript
// Serve the statistics page as root (public route)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'stats.html'));
});

// Serve the admin interface at /mc-admin (requires auth)
app.get('/mc-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
```

### 2. Update public routes list:
```javascript
const publicRoutes = [
    '/',  // Root serves stats page now
    '/api/public/status/mc-ilias',
    '/api/public/status/mc-niilo',
    '/api/public/status/all'
];
```

### 3. Simplified Traefik configuration:
Since the internal routing matches external expectations, the Traefik config can be simpler:

```yaml
    labels:
      - "traefik.enable=true"
      # Router for statistics page (root path serves stats.html)
      - "traefik.http.routers.minecraft-stats.rule=Host(`mc.ikaria.dev`) && Path(`/`)"
      - "traefik.http.routers.minecraft-stats.entrypoints=websecure"
      - "traefik.http.routers.minecraft-stats.tls=true"
      - "traefik.http.routers.minecraft-stats.service=minecraft-service"
      # Router for admin interface (mc-admin path serves admin interface)
      - "traefik.http.routers.minecraft-admin.rule=Host(`mc.ikaria.dev`) && Path(`/mc-admin`)"
      - "traefik.http.routers.minecraft-admin.entrypoints=websecure"
      - "traefik.http.routers.minecraft-admin.tls=true"
      - "traefik.http.routers.minecraft-admin.service=minecraft-service"
      # Define the backend service
      - "traefik.http.services.minecraft-service.loadbalancer.server.port=3000"
      - "traefik.http.services.minecraft-service.loadbalancer.server.scheme=http"
```

## Implementation Steps (when server is accessible)

1. Update server.js in the admin-ui directory with the correct route mappings
2. Rebuild the admin-ui image: `docker build -t minecraft-server-admin-ui .`
3. Redeploy the service with simpler Traefik configuration
4. Remove complex middleware that was causing redirect loops

## Why This Approach is Better

- No complex path rewriting that can cause redirect loops
- Clear, straightforward routing that matches external expectations
- Internal application routing matches external routing
- Authentication only applies where needed