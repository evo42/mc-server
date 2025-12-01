# Minecraft Overviewer Integration Plan

## 🎯 Überblick

**Minecraft Overviewer** ist ein Python-Tool, das hochauflösende Karten von Minecraft-Welten rendert und interaktive HTML-Webseiten mit Leaflet erstellt. Diese Integration erweitert unser Minecraft SaaS Platform um **Public World Mapping** für alle Minecraft Server.

## 🏗️ Integration-Strategie

### Core Features
- **Multi-Server World Detection**: Automatische Erkennung aller Minecraft-Welten
- **Automated Rendering**: World-Update-basiertes Re-Rendering
- **Public Web Pages**: Öffentlich zugängliche, interaktive Welt-Karten
- **Real-time Updates**: WebSocket-basierte Live-Updates
- **Performance Optimized**: Caching und inkrementelle Renders

### Technische Architektur

```
┌─────────────────────────────────────────────────────────┐
│                   Admin API (Node.js)                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │        Overviewer Routes                         │   │
│  │  • GET /api/overviewer/worlds                    │   │
│  │  • POST /api/overviewer/render/{world}          │   │
│  │  • GET /api/overviewer/maps/{server}            │   │
│  │  • WebSocket: Live Rendering Status             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              │ Docker Network
                              ▼
┌─────────────────────────────────────────────────────────┐
│              Overviewer Container (Python)              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  • World Data Access (Volume Mounts)            │   │
│  │  • Python Overviewer Core                       │   │
│  │  • C Extensions (Performance)                   │   │
│  │  • Web Server (Static Files)                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              │ Nginx Proxy
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  Public Web Pages                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  • Interactive Leaflet Maps                     │   │
│  │  • Multi-layer Rendering                        │   │
│  │  • Player Markers & POIs                        │   │
│  │  • Real-time Updates                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📋 Implementierungsschritte

### Phase 1: Container Setup ✅
- [ ] Docker Container für Overviewer erstellen
- [ ] Python Dependencies (numpy, Pillow) installieren
- [ ] C Extensions Build-Prozess
- [ ] Volume Mounts für World Data
- [ ] Health Check Implementation

### Phase 2: Backend Integration
- [ ] Express.js Routes für Overviewer erstellen
- [ ] Multi-Server World Detection API
- [ ] Rendering Job Management
- [ ] WebSocket für Live-Status-Updates
- [ ] Integration in bestehende Auth

### Phase 3: Frontend Components
- [ ] Vue.js OverviewerIntegration Component
- [ ] World Selection Interface
- [ ] Rendering Progress Tracking
- [ ] Public Map Viewer
- [ ] Admin Controls für Public Access

### Phase 4: Public Web Integration
- [ ] Nginx Static File Serving
- [ ] Public URL Generation
- [ ] Access Control für Public Maps
- [ ] Mobile-responsive Map Interface
- [ ] SEO-optimierte Public Pages

## 🐳 Docker Implementation Details

### Overviewer Container
```dockerfile
FROM python:3.9-slim

# System Dependencies
RUN apt-get update && apt-get install -y \
    build-essential gcc g++ libc6-dev \
    libjpeg-dev zlib1g-dev libpng-dev \
    pkg-config git curl

# Python Dependencies
RUN pip install numpy>=1.15.0 Pillow>=6.0.0 requests>=2.20.0

# Overviewer Installation
COPY /Users/rene/ikaria/Minecraft-Overviewer/ /app/
RUN python setup.py build_ext --inplace
RUN python setup.py install

# Data Directories
RUN mkdir -p /data/worlds /data/output /data/renders

# Volume Mounts
VOLUME ["/data/worlds", "/data/output"]
```

### Docker Compose Integration
```yaml
overviewer:
  build:
    context: ./overviewer-integration
    dockerfile: Dockerfile
  container_name: mc-overviewer
  ports:
    - "8081:8080"
  volumes:
    - ./mc-ilias/data:/data/worlds/mc-ilias:ro
    - ./mc-niilo/data:/data/worlds/mc-niilo:ro
    - ./overviewer-output:/data/output
  environment:
    - OVERVIEWER_DATA_DIR=/data
    - OVERVIEWER_OUTPUT_DIR=/data/output
  networks:
    - proxy
    - minecraft-net
  depends_on:
    - admin-api
  restart: unless-stopped
```

## 🌍 World Rendering Features

### Render Modes
- **Day Lighting**: Klassische Tag-Ansicht
- **Night Lighting**: Nacht-Ansicht mit Beleuchtung
- **Cave Rendering**: Unterirdische Höhlen-Ansicht
- **Mineral Overlays**: Erzlager-Anzeige
- **Biome Colors**: Biome-Farbgebung
- **Smooth Lighting**: Sanfte Schattierung

### Interactive Features
- **Multi-layer Maps**: Verschiedene Render-Modi als Layer
- **Player Markers**: Live-Player-Positionen
- **Spawn Points**: Server-Spawn Markierungen
- **Points of Interest**: Custom POIs und Markierungen
- **Zoom Levels**: Von Chunk-Level bis World-Overview
- **Search Functionality**: Teleport zu Koordinaten

## 📡 API Endpoints Design

### World Management
```
GET /api/overviewer/worlds                    # Alle verfügbaren Welten
GET /api/overviewer/worlds/{server}          # Welten eines Servers
GET /api/overviewer/maps/{server}            # Gerenderte Maps eines Servers
GET /api/overviewer/map/{server}/{world}     # Spezifische Map-Details
```

### Rendering Control
```
POST /api/overviewer/render/{server}/{world} # World rendern
GET  /api/overviewer/status/{job_id}        # Render-Status
POST /api/overviewer/cancel/{job_id}        # Render abbrechen
GET  /api/overviewer/queue                   # Render-Queue
```

### Public Access
```
GET /api/overviewer/public/{server}         # Public Maps eines Servers
POST /api/overviewer/public/{map_id}        # Map öffentlich machen
DELETE /api/overviewer/public/{map_id}      # Public Access entfernen
```

## 🎨 Frontend Components

### OverviewerIntegration.vue
```vue
<template>
  <div class="overviewer-integration">
    <!-- World Selection -->
    <div class="world-selector">
      <select v-model="selectedServer" @change="loadWorlds">
        <option value="">Select Server</option>
        <option v-for="server in servers" :value="server">
          {{ server }}
        </option>
      </select>
    </div>

    <!-- Render Progress -->
    <div v-if="renderingJobs.length > 0" class="render-progress">
      <h3>Active Render Jobs</h3>
      <div v-for="job in renderingJobs" :key="job.id" class="job-item">
        <div class="job-info">
          <strong>{{ job.world }}</strong>
          <span>{{ job.progress }}%</span>
        </div>
        <div class="progress-bar">
          <div :style="{ width: job.progress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Public Maps Gallery -->
    <div class="maps-gallery">
      <h3>Public World Maps</h3>
      <div class="map-grid">
        <div v-for="map in publicMaps" :key="map.id" class="map-card">
          <div class="map-thumbnail">
            <img :src="map.thumbnail" :alt="map.name">
          </div>
          <div class="map-info">
            <h4>{{ map.name }}</h4>
            <p>{{ map.description }}</p>
            <div class="map-actions">
              <a :href="map.publicUrl" target="_blank">View Map</a>
              <button @click="makePublic(map)">Make Public</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

## 🔧 Technical Implementation

### Performance Optimizations
- **Incremental Rendering**: Nur geänderte Chunks neu rendern
- **Tile Caching**: Wiederverwendung von gerenderten Tiles
- **Parallel Processing**: Multi-Process Rendering
- **Memory Management**: Chunk-basierte Verarbeitung
- **Compression**: Optimierte Tile-Kompression

### Public Web Features
- **CDN Integration**: Statische Files über CDN ausliefern
- **Progressive Loading**: Lazy Loading von Map-Tiles
- **Mobile Optimization**: Touch-friendly Interface
- **Offline Support**: Service Worker für Offline-Viewing
- **SEO Friendly**: Meta-Tags für Suchmaschinen

## 📊 Integration Benefits

### For Server Administrators
- **Professional World Visualization**: Hochwertige Welt-Karten
- **Marketing Tool**: Public Maps für Community-Werbung
- **Development Aid**: World-Analyse und Troubleshooting
- **Player Engagement**: Interaktive Exploration

### For Players/Public
- **World Exploration**: Ohne Server-Join World erkunden
- **Community Sharing**: Teilbare Welt-Links
- **Mobile Access**: Smartphone-kompatible Maps
- **Historical Views**: Timeline von World-Änderungen

### For Platform
- **Value-Added Service**: Unique Selling Point
- **Professional Appearance**: Enterprise-grade Mapping
- **Scalability**: Automatisches Multi-Server-Scaling
- **Revenue Potential**: Premium World-Mapping Features

## 🚀 Next Steps

1. **Create Overviewer Docker Container** (Code Mode)
2. **Build Admin API Integration** (Express.js Routes)
3. **Develop Vue.js Components** (World Management UI)
4. **Setup Public Web Serving** (Nginx Static Files)
5. **Test with Example World** (Live Rendering Demo)

---

**Status**: 📋 **PLANNING COMPLETE** - Ready for Implementation
**Priority**: 🔥 **HIGH** - Core Feature für Public World Access
**Complexity**: ⚡ **MEDIUM** - Standard Docker + API Integration
**Timeline**: ⏱️ **~4 hours** implementation time
