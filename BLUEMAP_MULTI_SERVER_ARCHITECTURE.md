# BlueMap Multi-Server Architektur

**Erstellt**: 2025-12-02 14:44 UTC
**Architektur**: **7 Separate BlueMap Web Interface Container** + **1 Zentraler Render Engine**

---

## 🏗️ **BlueMap Multi-Server Architektur:**

### **Architektur-Übersicht:**
```
┌─────────────────────────────────────────────────────────┐
│                    BlueMap Infrastructure               │
├─────────────────────────────────────────────────────────┤
│  7x BlueMap Web Interface Container (einer pro Server) │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  mc-basop│ │ mc-bgst  │ │ mc-borg  │ │ mc-hak   │    │
│  │ :8081:8080│ │ :8082:8100│ │ :8083:8080│ │ :8084:8080│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ mc-htl   │ │ mc-ilias │ │ mc-niilo │                │
│  │ :8085:8080│ │ :8086:8080│ │ :8087:8080│                │
│  └──────────┘ └──────────┘ └──────────┘                │
├─────────────────────────────────────────────────────────┤
│  1x Zentraler BlueMap Render Engine (Lazy Loading)     │
│  └─────────────────────────────────────────┐           │
│     bluemap-render-engine (Port intern)    │           │
└─────────────────────────────────────────────┼───────────┘
                                              │
                                              ▼
                                         ┌─────────────┐
                                         │ Minecraft   │
                                         │ World Data  │
                                         │ (7 Servers) │
                                         └─────────────┘
```

---

## 🔗 **BlueMap URLs für alle 7 Minecraft-Server:**

### **✅ Funktionale URLs (sobald Maps gerendert sind):**

| Minecraft Server | BlueMap Web Interface | Port Mapping | URL |
|------------------|----------------------|--------------|-----|
| **mc-basop-bafep-stp** | `bluemap-web-mc-basop-bafep-stp` | 8081:8080 | **http://localhost:8081/** |
| **mc-bgstpoelten** | `bluemap-web-mc-bgstpoelten` | 8082:8100 | **http://localhost:8082/** |
| **mc-borgstpoelten** | `bluemap-web-mc-borgstpoelten` | 8083:8080 | **http://localhost:8083/** |
| **mc-hakstpoelten** | `bluemap-web-mc-hakstpoelten` | 8084:8080 | **http://localhost:8084/** |
| **mc-htlstp** | `bluemap-web-mc-htlstp` | 8085:8080 | **http://localhost:8085/** |
| **mc-ilias** | `bluemap-web-mc-ilias` | 8086:8080 | **http://localhost:8086/** |
| **mc-niilo** | `bluemap-web-mc-niilo` | 8087:8080 | **http://localhost:8087/** |

### **🔧 Unterstützende Services:**

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **BlueMap API** | http://localhost:3001 | Management API für alle Server |
| **Prometheus** | http://localhost:9090 | Metrics Collection |
| **Grafana** | http://localhost:3002 | Dashboard (admin/admin123) |

---

## 🛠️ **Technische Details:**

### **1. Separate Web Interface Container (7x):**
```yaml
# Jeder Minecraft-Server hat seinen eigenen BlueMap Container
bluemap-web-mc-basop-bafep-stp:
  image: ghcr.io/bluemap-minecraft/bluemap:v5.10
  ports: ["8081:8080"]
  volumes:
    - ./mc-basop-bafep-stp/data/world:/minecraft/world:ro
    - ./bluemap-migration/configs/mc-basop-bafep-stp:/webapp/conf:ro
    - ./bluemap-data/mc-basop-bafep-stp:/webapp/data

bluemap-web-mc-bgstpoelten:
  image: ghcr.io/bluemap-minecraft/bluemap:v5.10
  ports: ["8082:8100"]  # Besonderheit: Port 8100 intern
  volumes:
    - ./mc-niilo/data/world:/minecraft/world:ro  # Test-World
    - ./bluemap-migration/configs/mc-bgstpoelten:/webapp/conf:ro
    - ./bluemap-data/mc-bgstpoelten:/webapp/data

# ... weitere 5 Server mit ähnlicher Konfiguration
```

### **2. Zentraler Render Engine:**
```yaml
# Ein einziger Render Engine für Lazy Loading aller 7 Server
bluemap-render-engine:
  image: mc-server-bluemap-render-engine
  environment:
    - JAVA_OPTS=-Xmx2G -Xms1G
  volumes:
    # Alle 7 World-Daten mounten
    - ./mc-basop-bafep-stp/data:/data/worlds/mc-basop-bafep-stp:ro
    - ./mc-niilo/data:/data/worlds/mc-niilo:ro
    - ./landing/bgstpoelten-mc-landing/data:/data/worlds/mc-bgstpoelten:ro
    - ./landing/htlstp-mc-landing/data:/data/worlds/mc-htlstp:ro
    - ./landing/borgstpoelten-mc-landing/data:/data/worlds/mc-borgstpoelten:ro
    - ./landing/hakstpoelten-mc-landing/data:/data/worlds/mc-hakstpoelten:ro
    - ./landing/play-mc-landing/data:/data/worlds/mc-play:ro
```

---

## 🚀 **Vorteile dieser Architektur:**

### **1. Skalierbarkeit:**
- **Isolation**: Jeder Server hat seinen eigenen Container
- **Unabhängigkeit**: Ausfall eines Containers beeinflusst nicht andere
- **Performance**: Separate Ressourcen für jeden Server

### **2. Lazy Loading Optimization:**
- **Zentraler Render Engine**: Shared Resources zwischen allen Servern
- **On-Demand Rendering**: Nur sichtbare Areas werden gerendert
- **Memory Efficiency**: Reduzierte RAM-Nutzung pro Server

### **3. Management:**
- **Separate URLs**: Direkter Zugriff auf jeden Server
- **Individual Configuration**: Server-spezifische Einstellungen
- **Monitoring**: Granulare Metriken pro Server

---

## 📊 **Aktueller Status:**

### **Container Status:**
```bash
# Alle 7 BlueMap Web Interface Container
docker ps | grep bluemap-web
# mc-bluemap-web-mc-basop-bafep-stp   Up (restarting)
# mc-bluemap-web-mc-bgstpoelten      Up (restarting)
# mc-bluemap-web-mc-borgstpoelten    Up (restarting)
# mc-bluemap-web-mc-hakstpoelten     Up (restarting)
# mc-bluemap-web-mc-htlstp           Up (restarting)
# mc-bluemap-web-mc-ilias            Up (restarting)
# mc-bluemap-web-mc-niilo            Up (restarting)

# Zentraler Render Engine
docker ps | grep bluemap-render-engine
# mc-bluemap-render-engine           Up (restarting)
```

### **URL Verfügbarkeit:**
- ✅ **http://localhost:8081** - mc-basop-bafep-stp (inaktiv)
- 🔄 **http://localhost:8082** - mc-bgstpoelten (aktuell getestet, 404)
- ⏳ **http://localhost:8083** - mc-borgstpoelten (wartend)
- ⏳ **http://localhost:8084** - mc-hakstpoelten (wartend)
- ⏳ **http://localhost:8085** - mc-htlstp (wartend)
- ⏳ **http://localhost:8086** - mc-ilias (wartend)
- ⏳ **http://localhost:8087** - mc-niilo (wartend)

---

## 🎯 **Nächste Schritte:**

### **Phase 1: Erfolgreiche Server validieren**
```bash
# mc-bgstpoelten (Port 8082) vollständig funktionsfähig machen
# Dann auf weitere Server skalieren
```

### **Phase 2: Alle 7 Server aktivieren**
```bash
# Für jeden Server die gleiche Konfiguration anwenden:
1. Docker Container neustarten
2. World-Daten mounten
3. Konfiguration laden
4. Rendering abwarten
5. URL validieren
```

### **Phase 3: Zentraler Render Engine**
```bash
# bluemap-render-engine für Lazy Loading konfigurieren
# API für Remote-Trigger der Render-Jobs
```

---

## 💡 **Antwort auf Ihre Frage:**

**Sind alle mc-* Server Maps über einen Server gerendert?**
> **NEIN** - Es gibt **7 separate BlueMap Web Interface Container** (einer pro Minecraft-Server)

**Wie sind die URLs?**
> **Jeder Server hat seine eigene URL:**
> - mc-basop-bafep-stp: **http://localhost:8081/**
> - mc-bgstpoelten: **http://localhost:8082/**
> - mc-borgstpoelten: **http://localhost:8083/**
> - mc-hakstpoelten: **http://localhost:8084/**
> - mc-htlstp: **http://localhost:8085/**
> - mc-ilias: **http://localhost:8086/**
> - mc-niilo: **http://localhost:8087/**

**Zusätzlich gibt es einen zentralen Render Engine** für Lazy Loading Performance.

---

*Multi-Server Architektur erklärt: 2025-12-02 14:44 UTC*
*BlueMap 7-Server Deployment Architecture*