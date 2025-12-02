# BlueMap Local Deployment Guide

**Version**: 1.0.0
**Datum**: 2025-12-01
**Environment**: Local Development/Testing

---

## 🎯 Übersicht

Diese Anleitung führt Sie durch die lokale Bereitstellung der **BlueMap Integration** für die 7-Server Minecraft-Infrastruktur. Das System umfasst:

- **BlueMap API** (Port 3001) - Zentrales Management
- **7 BlueMap Web Interfaces** (Ports 8081-8087) - 3D-Karten pro Server
- **BlueMap Render Engine** (Port 8088) - Lazy Rendering
- **Prometheus Monitoring** (Port 9090) - Metrics-Sammlung
- **Grafana Dashboard** (Port 3001) - Visualisierung
- **Minecraft Plugin Integration** - Real-time Updates

---

## 🚀 Schnellstart

### 1. Voraussetzungen prüfen

```bash
# Docker prüfen
docker --version
docker-compose --version

# Docker läuft?
docker info
```

### 2. Deployment starten

```bash
# Vollautomatisches Deployment
./deploy_bluemap_locally.sh
```

Das Script führt automatisch aus:
- ✅ Directory-Erstellung
- ✅ Docker Image Build
- ✅ Service-Start in korrekter Reihenfolge
- ✅ Health-Checks
- ✅ Status-Übersicht

### 3. Zugriff auf Services

Nach erfolgreichem Deployment sind folgende URLs verfügbar:

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Admin UI** | http://localhost:80 | Haupt-Admin-Interface |
| **BlueMap API** | http://localhost:3001 | API Documentation & Health |
| **BlueMap Web (mc-basop-bafep-stp)** | http://localhost:8081 | 3D-Karte Server 1 |
| **BlueMap Web (mc-bgstpoelten)** | http://localhost:8082 | 3D-Karte Server 2 |
| **BlueMap Web (mc-borgstpoelten)** | http://localhost:8083 | 3D-Karte Server 3 |
| **BlueMap Web (mc-hakstpoelten)** | http://localhost:8084 | 3D-Karte Server 4 |
| **BlueMap Web (mc-htlstp)** | http://localhost:8085 | 3D-Karte Server 5 |
| **BlueMap Web (mc-ilias)** | http://localhost:8086 | 3D-Karte Server 6 |
| **BlueMap Web (mc-niilo)** | http://localhost:8087 | 3D-Karte Server 7 |
| **Prometheus** | http://localhost:9090 | Metrics & Monitoring |
| **Grafana** | http://localhost:3001 | Dashboards & Visualisierung |

---

## 🔧 Manuelle Bereitstellung (Optional)

Falls Sie das Deployment manuell durchführen möchten:

### 1. Verzeichnisse erstellen

```bash
mkdir -p ./bluemap-data/{mc-basop-bafep-stp,mc-bgstpoelten,mc-borgstpoelten,mc-hakstpoelten,mc-htlstp,mc-ilias,mc-niilo}
mkdir -p ./bluemap-render-cache
mkdir -p ./bluemap-render-logs
mkdir -p ./prometheus-data
mkdir -p ./grafana-data
chmod -R 755 ./bluemap-data
```

### 2. Docker Images builden

```bash
# BlueMap API
docker build -f admin-api/Dockerfile.bluemap -t bluemap-api:dev ./admin-api

# BlueMap Plugin
cd bluemap-plugin
docker build -f Dockerfile.dev -t bluemap-plugin:dev .
cd ..

# BlueMap Render Engine
docker build -t bluemap-render-engine:dev ./bluemap-render-engine
```

### 3. Services starten

```bash
# Core Services
docker-compose up -d redis admin-api

# BlueMap Services
docker-compose up -d bluemap-api
docker-compose up -d bluemap-web-mc-basop-bafep-stp
docker-compose up -d bluemap-web-mc-bgstpoelten
docker-compose up -d bluemap-web-mc-borgstpoelten
docker-compose up -d bluemap-web-mc-hakstpoelten
docker-compose up -d bluemap-web-mc-htlstp
docker-compose up -d bluemap-web-mc-ilias
docker-compose up -d bluemap-web-mc-niilo
docker-compose up -d bluemap-render-engine

# Monitoring
docker-compose up -d prometheus grafana
```

---

## 📊 Monitoring & Debugging

### Service Status prüfen

```bash
# Alle BlueMap Services
docker-compose ps | grep bluemap

# Detaillierter Status
docker-compose ps bluemap-api bluemap-render-engine prometheus grafana
```

### Logs einsehen

```bash
# BlueMap API Logs
docker-compose logs -f bluemap-api

# BlueMap Render Engine Logs
docker-compose logs -f bluemap-render-engine

# Alle BlueMap Services
docker-compose logs -f bluemap

# Prometheus Logs
docker-compose logs -f prometheus

# Grafana Logs
docker-compose logs -f grafana
```

### Health Checks

```bash
# API Health Check
curl http://localhost:3001/api/bluemap/health

# Prometheus Health
curl http://localhost:9090/-/healthy

# Einzelne BlueMap Web Interfaces testen
curl http://localhost:8081/ | head -20
curl http://localhost:8082/ | head -20
```

### Performance Monitoring

```bash
# Container Ressourcen-Verbrauch
docker stats bluemap-api bluemap-render-engine

# Redis Verbindungen prüfen
docker exec mc-redis redis-cli -a redissecure123 info clients

# Prometheus Metrics anzeigen
curl http://localhost:9090/api/v1/label/__name__/values
```

---

## 🛠️ Konfiguration

### Umgebungsvariablen

Die wichtigsten Einstellungen in `.env`:

```bash
# BlueMap API
BLUEMAP_API_PORT=3001
BLUEMAP_API_KEY=bluemap-api-key-dev

# Performance Settings
BLUEMAP_CACHE_SIZE=1GB
BLUEMAP_MAX_CONCURRENT_RENDERS=3
BLUEMAP_RENDER_DISTANCE=5000
BLUEMAP_LAZY_LOADING=true

# Development
BLUEMAP_DEBUG=true
BLUEMAP_LOG_LEVEL=INFO
```

### BlueMap Render Engine Konfiguration

Editieren Sie `bluemap-render-engine/config/bluemap.conf`:

```yaml
blueMap:
  lazyLoading: true
  cacheSize: "1GB"
  maxConcurrentRenders: 3
  renderDistance: 5000

  worlds:
    mc-niilo:
      enabled: true
      lazyLoading: true
      renderDistance: 5000
```

---

## 🔍 Testing

### API Endpoints testen

```bash
# Server Status abfragen
curl http://localhost:3001/api/bluemap/servers/status

# Performance Metrics
curl http://localhost:3001/api/bluemap/performance/metrics

# Health Check
curl http://localhost:3001/api/bluemap/health
```

### Render Job testen

```bash
# Area Render triggern
curl -X POST http://localhost:3001/api/bluemap/servers/mc-niilo/render-area \
  -H "Content-Type: application/json" \
  -d '{"x": 100, "z": 200, "radius": 50, "priority": "normal"}'
```

### Web Interface testen

1. Öffnen Sie http://localhost:8081 (mc-basop-bafep-stp)
2. Öffnen Sie http://localhost:8087 (mc-niilo)
3. Testen Sie 3D-Navigation und Marker

---

## 🐛 Troubleshooting

### Häufige Probleme

#### 1. BlueMap API startet nicht
```bash
# Logs prüfen
docker-compose logs bluemap-api

# Redis-Verbindung testen
docker exec mc-redis redis-cli -a redissecure123 ping

# Port-Konflikt prüfen
netstat -tulpn | grep 3001
```

#### 2. BlueMap Web Interface nicht erreichbar
```bash
# Container Status
docker-compose ps bluemap-web-mc-niilo

# Logs prüfen
docker-compose logs bluemap-web-mc-niilo

# Volume Mounts prüfen
docker inspect mc-bluemap-web-mc-niilo | grep -A 10 Mounts
```

#### 3. Render Engine Performance-Probleme
```bash
# Memory Usage prüfen
docker stats bluemap-render-engine

# Cache leeren
docker exec bluemap-render-engine rm -rf /data/cache/*

# Logs analysieren
docker-compose logs bluemap-render-engine | grep ERROR
```

### Service Neustart

```bash
# Einzelner Service
docker-compose restart bluemap-api

# Alle BlueMap Services
docker-compose restart bluemap-api bluemap-render-engine
docker-compose restart bluemap-web-mc-niilo

# Full Restart (vorsichtig!)
docker-compose down
docker-compose up -d
```

### Logs bereinigen

```bash
# Container Logs löschen
docker system prune -f

# Ungenutzte Volumes
docker volume prune -f

# Everything cleanup (vorsichtig!)
docker system prune -a
```

---

## 🚀 Erweiterte Konfiguration

### Produktions-Deployment

Für Produktionsumgebung ändern Sie in `.env`:

```bash
BLUEMAP_API_KEY=your-production-api-key
REDIS_PASSWORD=secure-production-password
GRAFANA_PASSWORD=secure-grafana-password
BLUEMAP_DEBUG=false
BLUEMAP_LOG_LEVEL=WARNING
```

### Skalierung

```yaml
# docker-compose.yml anpassen für mehr Render Engines
bluemap-render-engine-2:
  # ... copy config und anpassen
  environment:
    - ENGINE_ID=engine-2
    - WORKER_THREADS=4
```

### SSL/HTTPS

```nginx
# nginx/conf.d/lerncraft.xyz.conf erweitern
location /bluemap/ {
    proxy_pass http://bluemap-web-mc-niilo:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 📋 Nächste Schritte

1. **API Testing**: Alle Endpoints mit Postman/curl testen
2. **Frontend Integration**: Vue.js Komponenten testen
3. **Performance Tuning**: Cache-Settings optimieren
4. **Monitoring Setup**: Grafana Dashboards konfigurieren
5. **Security Review**: API-Keys und Permissions prüfen

---

## 📞 Support

Bei Problemen:

1. **Logs prüfen**: `docker-compose logs -f bluemap`
2. **Health Checks**: `curl http://localhost:3001/api/bluemap/health`
3. **Service Status**: `docker-compose ps | grep bluemap`
4. **Performance**: `docker stats`

---

**Deployment erfolgreich abgeschlossen! 🎉**