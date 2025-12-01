# Docker Setup Anleitung - Minecraft SaaS Platform

## Übersicht

Diese Anleitung beschreibt das Setup und die Verwaltung der Docker-Container für die Minecraft SaaS Platform.

## Voraussetzungen

- Docker (≥ 20.0)
- Docker Compose (≥ 2.0)
- Mindestens 4GB RAM
- 10GB freier Speicherplatz

## Schnellstart

### 1. Repository klonen
```bash
git clone <repository-url>
cd mc-server
```

### 2. Umgebungsvariablen konfigurieren
```bash
# .env Datei bearbeiten
cp .env.example .env
# Bearbeiten Sie die .env Datei mit Ihren Einstellungen
```

### 3. Container starten (Nur Admin-Services)
```bash
# Admin-Services ohne Minecraft-Server starten
docker-compose up -d admin-api admin-ui nginx
```

### 4. Verfügbarkeit prüfen
```bash
# Admin API testen
curl http://localhost:3000/api/public/status/all

# Admin UI testen
curl http://localhost:61273/ | head -5
```

## Service-Konfiguration

### Port-Mapping
| Service | Interner Port | Externer Port | Beschreibung |
|---------|---------------|---------------|--------------|
| admin-api | 3000 | 3000 | REST API Backend |
| admin-ui | 80 | 61273 | Vue.js Admin Interface |
| nginx | 80 | 8080 | Reverse Proxy (optional) |
| mc-ilias | 25565 | 25565 | Minecraft Server 1 |
| mc-niilo | 25565 | 25566 | Minecraft Server 2 |
| bungeecord | 25565 | 25565 | Proxy Server |

### Netzwerk-Topologie
```
minecraft-net (Bridge)
├── mc-ilias
├── mc-niilo
├── mc-bgstpoelten
└── mc-htlstp

proxy-net (Bridge)
├── bungeecord
├── admin-api
├── admin-ui
└── nginx
```

## Deployment-Szenarien

### Development Deployment
```bash
# Nur Admin-Services (Schnellstart)
docker-compose up -d admin-api admin-ui nginx

# Logs verfolgen
docker-compose logs -f admin-api
```

### Production Deployment
```bash
# Alle Services (inkl. Minecraft-Server)
docker-compose up -d

# Services überwachen
docker-compose ps
docker-compose logs -f
```

### Selective Server Deployment
```bash
# Nur spezifische Minecraft-Server
docker-compose up -d admin-api admin-ui nginx mc-ilias mc-niilo
```

## Service-Management

### Einzelne Services starten/stoppen
```bash
# Service starten
docker-compose start admin-api

# Service stoppen
docker-compose stop admin-api

# Service neustarten
docker-compose restart admin-api
```

### Service-Logs
```bash
# Alle Services
docker-compose logs

# Einzelner Service
docker-compose logs admin-api

# Follow Logs
docker-compose logs -f admin-api
```

### Container-Status prüfen
```bash
# Service-Status
docker-compose ps

# Ressourcen-Usage
docker stats

# Container-Health
docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
```

## Erweiterte Konfiguration

### Umgebungsvariablen
```bash
# .env Konfiguration
ADMIN_USER=admin
ADMIN_PASS=admin123
MC_MAX_PLAYERS=42
MC_MEMORY=5G
ADMIN_API_PORT=3000
NGINX_PORT=8080
```

### Custom docker-compose.override.yml
```yaml
version: '3.8'
services:
  admin-api:
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
  nginx:
    ports:
      - "80:80"
      - "443:443"
```

### Port-Anpassungen
```bash
# Ports in docker-compose.yml ändern
# Vorher: ports: - "3000:3000"
# Nachher: ports: - "8080:3000"
```

## Troubleshooting

### Häufige Probleme

#### Container startet nicht
```bash
# Logs prüfen
docker-compose logs <service-name>

# Container-Details
docker-compose ps -a

# Volume-Permissions
sudo chown -R $USER:$USER ./data
```

#### API-Verbindung fehlschlägt
```bash
# Container-Status
docker-compose ps

# Netzwerk-Konnektivität
docker network ls
docker network inspect mc-server_proxy

# Port-Verfügbarkeit
netstat -tlnp | grep 3000
```

#### Memory-Probleme
```bash
# System-Ressourcen prüfen
docker system df
docker system prune

# Container-Ressourcen
docker stats --no-stream
```

### Debug-Modus
```bash
# Container in interaktivem Modus
docker-compose exec admin-api /bin/sh

# Entwicklungsumgebung
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Sicherheits-Konfiguration

### SSL/TLS Setup
```bash
# Let's Encrypt Integration
# certificates volume zu nginx-service hinzufügen
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

### Firewall-Regeln
```bash
# UFW-Konfiguration
sudo ufw allow 3000/tcp  # Admin API
sudo ufw allow 8080/tcp  # Nginx
sudo ufw allow 25565/tcp # Minecraft
```

### Authentifizierung
```bash
# Standard-Credentials ändern in .env
ADMIN_USER=secure_username
ADMIN_PASS=secure_password
```

## Backup & Restore

### Container-Daten backup
```bash
# Volume-Backup
docker run --rm -v mc-server_minecraft-data:/data -v $(pwd):/backup alpine tar czf /backup/minecraft-backup.tar.gz /data

# Database-Backup (falls vorhanden)
docker-compose exec admin-api mongodump --out /backup
```

### Konfiguration exportieren
```bash
# Docker-Compose Config exportieren
docker-compose config > docker-compose.backup.yml

# Umgebungsvariablen sichern
env > .env.backup
```

## Performance-Optimierung

### Resource-Limits
```yaml
services:
  admin-api:
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Image-Size optimieren
```bash
# Unused Images entfernen
docker image prune -a

# Build-Cache nutzen
docker-compose build --no-cache
```

## Monitoring & Alerting

### Health Checks
```bash
# Service Health prüfen
curl -f http://localhost:3000/api/public/status/all || echo "Admin API down"

# Container Health
docker-compose ps --format "{{.Service}}: {{.Status}}"
```

### Logging-Konfiguration
```yaml
# Logging für Admin API
admin-api:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

## Migration & Updates

### Service-Updates
```bash
# Images neu laden
docker-compose pull

# Services updaten
docker-compose up -d --force-recreate

# Zero-Downtime Update
docker-compose up -d --no-deps admin-api
```

### Schema-Updates
```bash
# Migration-Scripts ausführen
docker-compose exec admin-api npm run migrate

# Datenbank-Updates
docker-compose exec admin-api node scripts/migrate.js
```

## MCDash Integration

### Zusätzlicher Service
```yaml
# docker-compose.yml hinzufügen
mcdash:
  build: /path/to/mcdash-repo
  ports:
    - "8080:8080"
  environment:
    - MINECRAFT_SERVER_DIR=/data
  volumes:
    - ./mcdash-data:/data
  networks:
    - proxy
    - minecraft-net
```

### Start mit MCDash
```bash
docker-compose up -d admin-api admin-ui nginx mcdash
```

---

*Diese Anleitung wurde getestet unter Docker 20.10+ und Docker Compose 2.0+*
*Letzte Aktualisierung: 2025-12-01*