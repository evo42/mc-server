# MCDash Integration Plan

## Executive Summary

Strategischer Plan zur Integration von MCDash (Java-basiertes Minecraft Dashboard) in die bestehende Minecraft SaaS Platform (Node.js/Express). Ziel ist die Kombination der besten Features beider Systeme für eine erweiterte Minecraft-Server-Verwaltung.

## Integrations-Strategie

### Option 1: Hybrid Architecture (Empfohlen)
```
┌─────────────────────────────────────────┐
│           Frontend Layer                │
├─────────────────────────────────────────┤
│  Vue.js SPA (Node.js) + React UI (Java) │
├─────────────────────────────────────────┤
│           API Gateway Layer             │
├─────────────────────────────────────────┤
│  Node.js API  │  MCDash Java Service   │
├─────────────────────────────────────────┤
│           Data Layer                    │
└─────────────────────────────────────────┘
```

### Option 2: Feature Migration
- Migration einzelner MCDash-Features in Node.js
- Keine separaten Services erforderlich
- Höhere Komplexität aber einheitliche Architektur

### Option 3: Service Orchestration
- MCDash als optionaler Service
- API-Interface für Feature-Bridging
- Load-balancing zwischen Services

## Detaillierter Integrations-Plan

### Phase 1: Environment Setup (Woche 1)

#### 1.1 MCDash Build & Test
```bash
# MCDash Repository Setup
cd /Users/rene/ikaria/MCDash
mvn clean compile

# WebUI Build
cd webui
npm install
npm run build

# Full Application Build
mvn package
```

#### 1.2 Docker-Container Konfiguration
```dockerfile
# Dockerfile.mcdash
FROM openjdk:8-jdk-alpine

WORKDIR /app
COPY target/MCDash-*.jar /app/mcdash.jar
COPY webui/dist /app/webui

EXPOSE 8080
CMD ["java", "-jar", "mcdash.jar"]
```

#### 1.3 Docker-Compose Integration
```yaml
# docker-compose.yml Erweiterung
mcdash:
  build:
    context: ./mcdash-integration
    dockerfile: Dockerfile.mcdash
  container_name: mc-mcdash
  ports:
    - "8080:8080"
  environment:
    - MINECRAFT_SERVER_DIR=/data
    - ADMIN_USER=${ADMIN_USER}
    - ADMIN_PASS=${ADMIN_PASS}
  volumes:
    - ./mcdash-data:/data
    - ./minecraft-data:/minecraft-data
  networks:
    - proxy
    - minecraft-net
  depends_on:
    - admin-api
```

### Phase 2: API Gateway Development (Woche 2-3)

#### 2.1 Bridge API Development
```javascript
// routes/mcdash.js - Express Router
const express = require('express');
const axios = require('axios');
const router = express.Router();

const MCDASH_BASE_URL = process.env.MCDASH_URL || 'http://mcdash:8080';

// File Browser Bridge
router.get('/files/:server', async (req, res) => {
    try {
        const { server } = req.params;
        const response = await axios.get(`${MCDASH_BASE_URL}/api/files/${server}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'MCDash file service unavailable' });
    }
});

// Console Bridge
router.get('/console/:server', async (req, res) => {
    try {
        const { server } = req.params;
        const response = await axios.get(`${MCDASH_BASE_URL}/api/console/${server}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'MCDash console service unavailable' });
    }
});

// Plugin Store Bridge
router.get('/plugins/store', async (req, res) => {
    try {
        const response = await axios.get(`${MCDASH_BASE_URL}/api/plugins/store`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'MCDash plugin service unavailable' });
    }
});

module.exports = router;
```

#### 2.2 Authentication Bridge
```javascript
// middleware/mcdashAuth.js
const axios = require('axios');
const MCDASH_BASE_URL = process.env.MCDASH_URL || 'http://mcdash:8080';

const authenticateWithMCDash = async (username, password) => {
    try {
        const response = await axios.post(`${MCDASH_BASE_URL}/api/auth/login`, {
            username,
            password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('MCDash authentication failed');
    }
};

module.exports = { authenticateWithMCDash };
```

### Phase 3: Frontend Integration (Woche 3-4)

#### 3.1 Vue.js Components für MCDash-Features
```vue
<!-- components/MCDashFileBrowser.vue -->
<template>
    <div class="mcdash-file-browser">
        <div class="browser-header">
            <h3>MCDash File Browser</h3>
            <select v-model="selectedServer" @change="loadFiles">
                <option value="">Select Server</option>
                <option v-for="server in servers" :key="server" :value="server">
                    {{ server }}
                </option>
            </select>
        </div>

        <div class="file-list" v-if="files.length">
            <div v-for="file in files" :key="file.path" class="file-item">
                <i :class="file.isDirectory ? 'fas fa-folder' : 'fas fa-file'"></i>
                <span @click="navigateTo(file)">{{ file.name }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    data() {
        return {
            selectedServer: '',
            files: [],
            servers: ['mc-ilias', 'mc-niilo', 'mc-bgstpoelten']
        };
    },
    methods: {
        async loadFiles() {
            if (!this.selectedServer) return;

            try {
                const response = await axios.get(`/api/mcdash/files/${this.selectedServer}`);
                this.files = response.data.files;
            } catch (error) {
                console.error('Failed to load files:', error);
            }
        }
    }
};
</script>
```

#### 3.2 Dashboard Integration
```vue
<!-- components/Dashboard.vue - Erweiterte Version -->
<template>
    <div class="dashboard">
        <!-- Bestehende Features -->
        <server-overview />
        <ram-management />

        <!-- Neue MCDash Features -->
        <mcdash-file-browser />
        <mcdash-console />
        <mcdash-plugin-store />
        <mcdash-backup-manager />
    </div>
</template>
```

### Phase 4: Feature Synchronization (Woche 4-5)

#### 4.1 Multi-Server MCDash Support
```java
// MCDash Multi-Server Plugin (Java)
public class MultiServerMCDashPlugin {
    private Map<String, MinecraftServer> servers;

    @EventHandler
    public void onServerStatusChange(ServerStatusChangeEvent event) {
        String serverName = event.getServer().getName();
        ServerStatus status = event.getNewStatus();

        // Update MCDash with new server status
        updateMCDashDashboard(serverName, status);
    }

    private void updateMCDashDashboard(String serverName, ServerStatus status) {
        // HTTP call to admin-api
        // Update unified dashboard
    }
}
```

#### 4.2 Shared Authentication System
```javascript
// utils/authSync.js
const syncUserSession = async (user, service) => {
    try {
        // Create unified session
        const session = await createUnifiedSession(user);

        // Propagate to both services
        await Promise.all([
            propagateToNodeJSService(session),
            propagateToMCDashService(session)
        ]);

        return session;
    } catch (error) {
        throw new Error('Session synchronization failed');
    }
};
```

### Phase 5: Testing & Optimization (Woche 5-6)

#### 5.1 Integration Testing
```javascript
// tests/integration/mcdash.test.js
describe('MCDash Integration', () => {
    test('should proxy file browser requests', async () => {
        const response = await request(app)
            .get('/api/mcdash/files/mc-ilias')
            .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('files');
    });

    test('should handle MCDash service unavailability', async () => {
        // Mock MCDash service down
        const response = await request(app)
            .get('/api/mcdash/files/mc-ilias');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('MCDash service unavailable');
    });
});
```

#### 5.2 Performance Testing
```javascript
// tests/performance/load.test.js
const loadTest = async () => {
    const concurrentRequests = 50;

    const requests = Array(concurrentRequests).fill().map(() =>
        axios.get('http://localhost:3000/api/public/status/all')
    );

    const results = await Promise.allSettled(requests);
    const successRate = results.filter(r => r.status === 'fulfilled').length / concurrentRequests;

    console.log(`Success Rate: ${successRate * 100}%`);
};
```

## API Endpoints Übersicht

### Bestehende Node.js Endpoints (Erweitert)
```javascript
GET  /api/public/status/all          # Server Status
GET  /api/public/history/:server     # Performance History
GET  /api/public/datapacks/:server   # Datapack Info

POST /api/servers/start/:server      # Start Server
POST /api/servers/stop/:server       # Stop Server
POST /api/servers/config/:server     # Update Config (RAM, etc.)

GET  /api/mcdash/files/:server       # NEW: MCDash File Browser
GET  /api/mcdash/console/:server     # NEW: MCDash Console
GET  /api/mcdash/plugins/store       # NEW: MCDash Plugin Store
POST /api/mcdash/plugins/install     # NEW: Install Plugin
GET  /api/mcdash/backups/:server     # NEW: Enhanced Backups
```

### MCDash Service Endpoints
```java
GET  /api/files/{server}             # File Browser
GET  /api/console/{server}           # Console Access
GET  /api/plugins/store              # Plugin Store
GET  /api/backups/{server}           # Backup Management
POST /api/backups/{server}/create    # Create Backup
POST /api/backups/{server}/restore   # Restore Backup
```

## Deployment Strategien

### Staging Deployment
```bash
# Staging Environment
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# mit MCDash Service
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d mcdash
```

### Production Deployment
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  mcdash:
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
```

## Monitoring & Observability

### Health Checks
```yaml
services:
  mcdash:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Logging Integration
```yaml
services:
  mcdash:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
```

## Risiko-Assessment

### Technische Risiken
| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Java/Node.js Kompatibilität | Niedrig | Mittel | API Gateway Pattern |
| Performance Degradation | Mittel | Hoch | Load Testing |
| Service Failures | Mittel | Hoch | Circuit Breaker |
| Authentication Issues | Niedrig | Hoch | Unified Auth System |

### Sicherheitsrisiken
| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Cross-Service Authentication | Mittel | Hoch | JWT Token Validation |
| API Injection | Niedrig | Hoch | Input Sanitization |
| Service Isolation | Niedrig | Hoch | Network Segmentation |

## Erfolgs-Metriken

### Performance Metriken
- Response Time: < 500ms für alle MCDash-proxied requests
- Availability: > 99.5% uptime für beide Services
- Memory Usage: < 2GB total für beide Services

### Funktionale Metriken
- Feature Completeness: 100% der MCDash-Features verfügbar
- User Experience: Unified UI für alle Features
- Integration Success: Seamless switching zwischen Services

## Zeitleiste

```
Woche 1: Environment Setup & MCDash Build
Woche 2-3: API Gateway Development
Woche 3-4: Frontend Integration
Woche 4-5: Feature Synchronization
Woche 5-6: Testing & Optimization
Woche 6: Production Deployment
```

## Budget-Estimierung

### Development Costs
- API Development: 40h @ €75/h = €3,000
- Frontend Integration: 30h @ €75/h = €2,250
- Testing & Deployment: 20h @ €75/h = €1,500
- **Total Development: €6,750**

### Infrastructure Costs
- Additional RAM: +1GB = €20/month
- Storage: +10GB = €5/month
- **Monthly Additional: €25**

## Fazit

Die MCDash Integration wird **technisch machbar** und **strategisch vorteilhaft** sein. Die Hybrid-Architecture ermöglicht die Nutzung der besten Features beider Systeme ohne komplette Migration.

**Empfehlung:** Mit Phase 1 beginnen und progressiv durch die Phasen gehen.

---
*Integration Plan erstellt am: 2025-12-01*
*Review Status: Architecture Ready for Implementation*