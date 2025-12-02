# Public Access Sitemap - Minecraft Server Platform

**Stand:** 1. Dezember 2025
**Provider:** Estonian company K42 Ventures OÜ
**Domain:** lerncraft.xyz

## 📋 Übersicht

Diese Sitemap dokumentiert alle öffentlich zugänglichen Seiten und Services der Minecraft Server Platform. Alle endpoints unter `/api/public/*` erfordern keine Authentifizierung.

---

## 🌐 Hauptseiten (Öffentlich)

### Statistikseiten
| URL | Beschreibung | Authentifizierung |
|-----|-------------|-------------------|
| `/` oder `/index.html` | Haupt-Statistikseite mit Server-Übersicht | ❌ Öffentlich |
| `/stats.html` | Detaillierte Server-Statistiken | ❌ Öffentlich |
| `/docs.html` | API-Dokumentation | ❌ Öffentlich |

### School/Server Landing Pages
| URL | Zielserver | Beschreibung |
|-----|------------|-------------|
| `/bgstpoelten` | bgstpoelten | BGST Pölten Server Landing Page |
| `/htlstp` | htlstp | HTL St. Pölten Server Landing Page |
| `/borgstpoelten` | borgstpoelten | BORG St. Pölten Server Landing Page |
| `/hakstpoelten` | hakstpoelten | HAK St. Pölten Server Landing Page |
| `/basop-bafep-stp` | basopbafepstp | BASOP/BAFEP St. Pölten Server Landing Page |
| `/play` | play | Allgemeiner Spielserver Landing Page |

### School World Maps (Overviewer Integration)
| URL | Zielserver | Beschreibung |
|-----|------------|-------------|
| `/bgstpoelten/map` | bgstpoelten | BGST Pölten Interactive World Map |
| `/htlstp/map` | htlstp | HTL St. Pölten Interactive World Map |
| `/borgstpoelten/map` | borgstpoelten | BORG St. Pölten Interactive World Map |
| `/hakstpoelten/map` | hakstpoelten | HAK St. Pölten Interactive World Map |
| `/basop-bafep-stp/map` | basopbafepstp | BASOP/BAFEP St. Pölten Interactive World Map |
| `/play/map` | play | Allgemeiner Spielserver Interactive World Map |

---

## 🎮 Minecraft Server (7 Server)

### Server Details
| Server Name | Identifier | Version | Max Players |
|-------------|------------|---------|-------------|
| Ikaria Games | `mc-ilias` | 1.21.1 | 20 |
| Königreich der letzten Krieger | `mc-niilo` | 1.21.1 | 20 |
| BGST Pölten | `mc-bgstpoelten` | 1.21.1 | 20 |
| HTL St. Pölten | `mc-htlstp` | 1.21.1 | 20 |
| BORG St. Pölten | `mc-borgstpoelten` | 1.21.1 | 20 |
| HAK St. Pölten | `mc-hakstpoelten` | 1.21.1 | 20 |
| BASOP/BAFEP St. Pölten | `mc-basop-bafep-stp` | 1.21.1 | 20 |
| Allgemeiner Spielserver | `mc-play` | 1.21.1 | 20 |

---

## 🔗 API Endpoints (Öffentlich)

### Status Endpoints
| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/public/status/all` | GET | Status aller Server |
| `/api/public/status/{server}` | GET | Status eines spezifischen Servers |

### Historische Daten
| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/public/history/{server}` | GET | Historische Daten für Server |

### Datapacks
| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/public/datapacks/{server}` | GET | Installierte Datapacks für Server |

### Verfügbare Datapacks
| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/datapacks/{server}` | GET | Alle verfügbaren Datapacks (mit Auth) |
| `/api/datapacks/search` | GET | Datapacks durchsuchen (mit Auth) |

---

## 🗺️ Overviewer Maps (Öffentlich)

### Weltkarten Rendering
| URL | Beschreibung |
|-----|-------------|
| `/public/overviewer/` | Übersicht aller gerenderten Welten |
| `/public/overviewer/{world}/` | Spezifische Weltkarte |
| `/public/overviewer/{world}/index.html` | Interaktive Weltkarte |

### API Endpoints für Overviewer
| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/public/overviewer/worlds` | GET | Verfügbare Welten |
| `/api/public/overviewer/renders/{world}` | GET | Render Jobs für Welt |
| `/api/public/overviewer/public-maps` | GET | Öffentliche Karten |

---

## 🏗️ Integrierte Services

### MCDash Integration (Java/Maven)
| Service | Port | Beschreibung |
|---------|------|-------------|
| MCDash Dashboard | 8080 | Minecraft Server Management UI |
| API Integration | - | File Browser, Console, Plugin Store |

**API Endpoints:**
- `/api/mcdash/files/{server}` - File Browser
- `/api/mcdash/console/{server}` - Server Console
- `/api/mcdash/plugins/{server}` - Plugin Store

### MinecraftServerAPI Integration (Java Plugin)
| Service | Port | Beschreibung |
|---------|------|-------------|
| Plugin API | 8123 | REST API für Server Management |
| WebHook System | - | Event Aggregation |

**API Endpoints:**
- `/api/minecraft-serverapi/{server}/status` - Server Status
- `/api/minecraft-serverapi/{server}/players` - Player Management
- `/api/minecraft-serverapi/{server}/performance` - Performance Metrics
- `/api/minecraft-serverapi/{server}/plugins` - Plugin Management
- `/api/minecraft-serverapi/{server}/world` - World Management

### Overviewer Integration (Python)
| Service | Port | Beschreibung |
|---------|------|-------------|
| Overviewer Service | 8000 | World Rendering Service |
| Web Interface | - | Render Job Management |

---

## 🔐 Admin API (Authentifiziert erforderlich)

### Server Management
| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/servers/status` | GET | Alle Server Status |
| `/api/servers/start/{server}` | POST | Server starten |
| `/api/servers/stop/{server}` | POST | Server stoppen |
| `/api/servers/restart/{server}` | POST | Server neustarten |
| `/api/servers/config/{server}` | GET/POST | Server Konfiguration |

### Backup Management
| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/backup/create/{server}` | POST | Backup erstellen |
| `/api/backup/list/{server}` | GET | Backups auflisten |
| `/api/backup/restore/{server}` | POST | Backup wiederherstellen |

---

## 🌟 Design-Konsistenz

### Styling Standards
- **Primärfarbe:** `#3498db` (Blau)
- **Sekundärfarbe:** `#2ecc71` (Grün)
- **Akzentfarbe:** `#e74c3c` (Rot)
- **Hintergrund:** Gradient `linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c)`
- **Schriftart:** `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- **Animation:** Gradient Background Animation

### UI Komponenten
- **Cards:** `border-radius: 15px`, Glassmorphism Effekt
- **Buttons:** `border-radius: 30px`, Hover-Effekte
- **Input Fields:** `border-radius: 4px`, Transparent Background
- **Status Indicators:** Animated, mit Glow-Effekt

---

## 🚀 Public Access Features

### Echtzeit-Daten
- ✅ Server Status Updates (30s Intervall)
- ✅ Player Count Tracking
- ✅ Performance Metrics (CPU/Memory)
- ✅ 3D Chart Visualisierung

### Datapacks
- ✅ Öffentliche Datapack-Anzeige
- ✅ Version Information
- ✅ Installation Status

### Overviewer Maps
- ✅ Öffentliche Weltkarten
- ✅ Interaktive Navigation
- ✅ Multiple Render Quality Levels

---

## 📊 Monitoring & Analytics

### Verfügbare Metriken
- Server Uptime
- Player Online Count
- CPU Usage (%)
- Memory Usage (MB/GB)
- Performance Trends (24h History)

### Automatische Updates
- Stats: Alle 30 Sekunden
- History: Alle 60 Sekunden
- Datapacks: Alle 3 Minuten

---

## 🔧 Technische Details

### Container Setup
```
11 Container gesamt:
- admin-api (Node.js) - Port 3000
- admin-ui-spa (Vue.js) - Port 8080
- overviewer-integration (Python) - Port 8000
- mcdash-integration (Java) - Port 8080
- nginx (Reverse Proxy) - Port 80/443
- 7x Minecraft Server (mc-ilias, mc-niilo, etc.)
```

### Netzwerk
- Interne Docker Network: `minecraft-network`
- Externe Ports: 80, 443, 3000, 8080, 8000
- SSL: Let's Encrypt Zertifikate

---

## 📞 Support & Kontakt

**Provider Information:**
- Estonian company K42 Ventures OÜ
- Domain: lerncraft.xyz
- Email: [Kontakt über Website]

**Server Information:**
- 7 aktive Minecraft Server
- Minecraft Version: 1.21.1
- Platform: Docker Container

---

*Diese Sitemap wird automatisch aktualisiert und spiegelt den aktuellen Stand der Platform wider.*