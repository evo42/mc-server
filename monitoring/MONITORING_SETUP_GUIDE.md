# Monitoring Setup Guide - Minecraft Server Platform

## 🚀 Übersicht

Dieses Monitoring-Setup bietet umfassende Überwachung Ihrer Minecraft Server Platform mit:

- **Prometheus** - Metriken-Sammlung und Storage
- **Grafana** - Visualisierung und Dashboards
- **AlertManager** - Alerting und Benachrichtigungen
- **Jaeger** - Distributed Tracing
- **Redis** - High-Performance Caching
- **Node Exporter** - System Metriken
- **cAdvisor** - Container Metriken

## 📊 Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │    │   Monitoring    │    │   Visualization │
│                 │    │                 │    │                 │
│ • Admin API     │───▶│ • Prometheus    │───▶│ • Grafana       │
│ • Minecraft     │    │ • AlertManager  │    │ • Jaeger UI     │
│   Servers       │    │ • Node Exporter │    │ • Custom        │
│ • Redis Cache   │    │ • cAdvisor      │    │   Dashboards    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠 Installation

### 1. Monitoring Stack Starten

```bash
# Im Root-Verzeichnis des Projekts
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Oder mit dem Hauptsystem integriert
docker-compose -f docker-compose.yml -f monitoring/docker-compose.monitoring.yml up -d
```

### 2. Verfügbare Services

| Service | URL | Beschreibung |
|---------|-----|-------------|
| **Grafana** | http://localhost:3001 | Haupt-Dashboard |
| **Prometheus** | http://localhost:9090 | Metriken Browser |
| **AlertManager** | http://localhost:9093 | Alert Management |
| **Jaeger** | http://localhost:16686 | Distributed Tracing |
| **Node Exporter** | http://localhost:9100 | System Metriken |
| **cAdvisor** | http://localhost:8080 | Container Metriken |
| **Redis** | localhost:6379 | Cache Service |

### 3. Default Credentials

- **Grafana**: admin / admin123 (ändern nach erster Anmeldung)
- **Redis**: Keine Authentifizierung (in Produktion aktivieren)

## 📈 Dashboards

### Verfügbare Grafana Dashboards

1. **Minecraft Platform Overview**
   - Server Status Übersicht
   - Player Statistics
   - System Health

2. **Application Performance**
   - API Response Times
   - Error Rates
   - Throughput Metrics

3. **Infrastructure Monitoring**
   - CPU/Memory Usage
   - Disk Space
   - Network Traffic

4. **Container Performance**
   - Docker Container Stats
   - Resource Usage per Service
   - Container Health

## 🚨 Alerting

### Alert Categories

#### Kritische Alerts (Sofortige Benachrichtigung)
- Server Down (>1min)
- Critical CPU/Memory Usage (>95%)
- High API Error Rate (>10%)
- Disk Space kritisch (<5%)

#### Warning Alerts (Wartungszeit)
- High CPU/Memory Usage (>85%)
- High API Response Time (>1s)
- Low Disk Space (<15%)
- Redis High Memory Usage (>80%)

#### Info Alerts
- Niedrige Player Count
- Container Restart Loops
- Authentication Attempts

### Alert Channels

```bash
# Email Alerts
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=alerts@yourdomain.com
SMTP_PASSWORD=your-app-password

# Slack Integration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# PagerDuty Integration (optional)
PAGERDUTY_SERVICE_KEY=your-service-key
```

## 🔧 Konfiguration

### Prometheus Rules

Die Alert Rules befinden sich in `monitoring/rules/alert-rules.yml`:

```yaml
groups:
  - name: minecraft-platform.rules
    rules:
      - alert: MinecraftServerDown
        expr: up{job="minecraft-servers"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Server {{ $labels.instance }} ist down"
```

### Custom Metrics

Die Admin API sendet folgende Metriken an Prometheus:

- `http_request_duration_seconds` - Request Latency
- `http_requests_total` - Request Count
- `server_operations_total` - Server Operation Count
- `minecraft_servers_online` - Online Server Count
- `minecraft_players_online_total` - Total Player Count
- `docker_container_status` - Container Health
- `cache_hits_total` - Cache Performance

### Redis Configuration

Optimierte Redis Konfiguration für High-Performance:

```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1 300 10 60 10000
appendonly yes
appendfsync everysec
```

## 📊 Performance Targets

### SLA Targets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| API Response Time (p95) | <100ms | >200ms |
| API Availability | >99.9% | <99.5% |
| Server Uptime | >99.5% | <99% |
| Cache Hit Rate | >90% | <80% |
| Error Rate | <1% | >5% |

### Resource Limits

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| Prometheus | 0.5 cores | 1GB | 10GB |
| Grafana | 0.2 cores | 512MB | 5GB |
| AlertManager | 0.1 cores | 256MB | 1GB |
| Redis | 1 core | 2GB | 5GB |
| Jaeger | 0.5 cores | 1GB | 10GB |

## 🔍 Troubleshooting

### Häufige Probleme

#### 1. Prometheus sammelt keine Metriken

```bash
# Logs prüfen
docker logs mc-prometheus

# Target Status prüfen
curl http://localhost:9090/api/v1/targets

# Service Connectivity testen
docker exec mc-prometheus wget -qO- admin-api:3000/metrics
```

#### 2. Grafana zeigt keine Daten

```bash
# Grafana Logs
docker logs mc-grafana

# Datenquelle testen
curl -u admin:admin123 http://localhost:3001/api/datasources/proxy/1/api/v1/query?query=up
```

#### 3. AlertManager sendet keine Benachrichtigungen

```bash
# AlertManager Logs
docker logs mc-alertmanager

# Alert Status prüfen
curl http://localhost:9093/api/v1/alerts

# SMTP Test
docker exec mc-alertmanager nc -zv smtp.gmail.com 587
```

#### 4. Redis Cache funktioniert nicht

```bash
# Redis Logs
docker logs mc-redis

# Connectivity testen
docker exec mc-redis redis-cli ping

# Memory Usage prüfen
docker exec mc-redis redis-cli info memory
```

### Performance Optimierung

#### 1. Prometheus Tuning

```yaml
# prometheus.yml optimizations
global:
  scrape_interval: 15s        # Reduce from 30s for faster alerts
  evaluation_interval: 15s

# Retention
storage:
  tsdb:
    retention.time: 30d       # Adjust based on storage
    retention.size: 10GB
```

#### 2. Grafana Tuning

```bash
# Grafana Environment Variables
GF_DATABASE_MAX_IDLE_CONN=10
GF_DATABASE_MAX_OPEN_CONN=100
GF_SESSION_PROVIDER_CONFIG=/tmp/grafana.db
GF_USERS_ALLOW_SIGN_UP=false
```

#### 3. Redis Optimierung

```conf
# redis.conf optimizations
tcp-keepalive 60
timeout 300
maxclients 10000
```

## 🔒 Security

### Production Checklist

- [ ] Grafana Default Passwort ändern
- [ ] Redis Authentication aktivieren
- [ ] TLS für alle Services konfigurieren
- [ ] Network Policies implementieren
- [ ] Regular Security Updates
- [ ] Monitoring Access Logging

### Access Control

```bash
# Grafana Security
GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
GF_USERS_ALLOW_SIGN_UP=false
GF_AUTH_ANONYMOUS_ENABLED=false

# Redis Security
requirepass ${REDIS_PASSWORD}
bind 127.0.0.1  # In production

# Prometheus Security
# Add authentication proxy behind nginx
```

## 📝 Maintenance

### Regelmäßige Aufgaben

#### Täglich
- [ ] Alert Status überprüfen
- [ ] System Health Dashboard prüfen
- [ ] Error Rate überwachen

#### Wöchentlich
- [ ] Grafana Dashboards aktualisieren
- [ ] Alert Rules überprüfen und anpassen
- [ ] Performance Trends analysieren
- [ ] Backup der Konfigurationen

#### Monatlich
- [ ] Prometheus Retention Policy anpassen
- [ ] Grafana Dashboard Optimization
- [ ] Alert Sensitivity tuning
- [ ] Capacity Planning Review

### Backup & Restore

```bash
# Grafana Backup
docker exec mc-grafana grafana-cli admin export-dashboard

# Prometheus Config Backup
cp -r monitoring/ backup/prometheus-$(date +%Y%m%d)/

# Redis Backup
docker exec mc-redis redis-cli BGSAVE
docker cp mc-redis:/data/dump.rdb ./backup/redis-$(date +%Y%m%d).rdb
```

## 🚀 Erweiterte Features

### Custom Alerting Rules

```yaml
# Custom business logic alerts
- alert: LowPlayerEngagement
  expr: minecraft_players_online_total < 5
  for: 30m
  labels:
    severity: warning
    service: minecraft-business
  annotations:
    summary: "Niedrige Spieleraktivität"
    description: "Weniger als 5 Spieler online für 30 Minuten"
```

### Advanced Dashboards

#### Minecraft Server Performance
```json
{
  "dashboard": {
    "title": "Minecraft Server Performance",
    "panels": [
      {
        "title": "Player Count by Server",
        "type": "graph",
        "targets": [
          {
            "expr": "minecraft_players_online_total",
            "legendFormat": "{{ server }}"
          }
        ]
      }
    ]
  }
}
```

#### Infrastructure Overview
```json
{
  "dashboard": {
    "title": "Infrastructure Overview",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{ instance }}"
          }
        ]
      }
    ]
  }
}
```

## 📞 Support

Bei Problemen oder Fragen:

1. Logs überprüfen: `docker-compose logs <service-name>`
2. Service Status: `docker ps | grep mc-`
3. Network Connectivity: `docker network ls`
4. Resource Usage: `docker stats`

---

**Erstellt am:** 2025-12-01
**Version:** 1.0
**Maintainer:** DevOps Team