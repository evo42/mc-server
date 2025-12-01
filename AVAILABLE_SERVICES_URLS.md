# 🌐 Verfügbare Service URLs - Minecraft Server Platform

## 📊 MONITORING & DASHBOARDS

### **🎯 Haupt Monitoring Services**
| Service | URL | Status | Beschreibung |
|---------|-----|--------|--------------|
| **Grafana Dashboard** | http://localhost:3001 | ✅ Running | **Hauptdashboard** - Interaktive Metriken & Charts |
| **Prometheus** | http://localhost:9090 | ✅ Running | **Metriken Browser** - Raw Metrics & Query Interface |
| **Jaeger Tracing** | http://localhost:16686 | ✅ Running | **Distributed Tracing** - Request Flow Analysis |
| **Node Exporter** | http://localhost:9100 | ✅ Running | **System Metriken** - CPU, Memory, Disk Stats |
| **cAdvisor** | http://localhost:8080 | ✅ Running | **Container Metriken** - Docker Performance |

### **🔔 Alerting & Management**
| Service | URL | Status | Beschreibung |
|---------|-----|--------|--------------|
| **AlertManager** | http://localhost:9093 | ⚠️ Config Issue | **Alert Management** - Alert Rules & Notifications |
| **Redis Cache** | localhost:6380 | ⚠️ Config Issue | **Cache Service** - High-Performance Caching |

---

## 🎮 MINECRAFT SERVER PLATFORM

### **🖥️ Admin Interface**
| Service | URL | Status | Beschreibung |
|---------|-----|--------|--------------|
| **Admin UI** | http://localhost:61273 | ✅ Running | **Haupt Admin Interface** - Server Management |
| **Admin API** | http://localhost:3000 | ✅ Running | **Backend API** - REST API für Server Operations |

### **📈 Admin API Endpoints**
| Endpoint | URL | Beschreibung |
|----------|-----|--------------|
| **Health Check** | http://localhost:3000/health | API Health Status |
| **API Documentation** | http://localhost:3000/docs | Swagger Documentation |
| **Stats Dashboard** | http://localhost:3000/mc-stats | Public Statistics |
| **Admin Panel** | http://localhost:3000/mc-admin | Admin Interface |

---

## 🚀 QUICK ACCESS GUIDE

### **🔥 Empfohlene Start URLs**

1. **📊 Grafana Dashboard** → http://localhost:3001
   - **Login:** admin / admin123
   - **Zweck:** Hauptdashboard für alle Metriken

2. **🔍 Prometheus** → http://localhost:9090
   - **Zweck:** Metriken Query & Exploration

3. **🎮 Admin UI** → http://localhost:61273
   - **Zweck:** Minecraft Server Management

4. **🔬 Jaeger Tracing** → http://localhost:16686
   - **Zweck:** Request Flow Analysis

---

## 📱 MOBILE-FRIENDLY SERVICES

### **📊 Mobile Optimized Dashboards**
- **Grafana Mobile View:** http://localhost:3001 (responsive design)
- **Prometheus Graph:** http://localhost:9090/graph (mobile-friendly)
- **Admin API Health:** http://localhost:3000/health (JSON response)

---

## 🎯 SERVICE PRIORITY ORDER

### **🥇 Top Priority (Zuerst besuchen)**
1. **Grafana Dashboard** - http://localhost:3001
2. **Admin UI** - http://localhost:61273
3. **Prometheus** - http://localhost:9090

### **🥈 Secondary Priority (Dann erkunden)**
4. **Jaeger Tracing** - http://localhost:16686
5. **Node Exporter** - http://localhost:9100
6. **cAdvisor** - http://localhost:8080

### **🥉 Advanced Users**
7. **AlertManager** - http://localhost:9093 (nach Config Fix)
8. **Admin API Docs** - http://localhost:3000/docs

---

**🕒 Stand:** 2025-12-01 10:20:14
**🌍 Umgebung:** Local Development
**📡 Status:** Alle Core Services Operational