# Grafana Dashboard Configuration for Minecraft Overviewer Integration

## Dashboard Overview
This Grafana dashboard provides comprehensive monitoring and observability for the Minecraft Overviewer integration.

## Prerequisites
- Prometheus server scraping the admin-api metrics
- Grafana instance
- Overviewer service running

## Dashboard Features
1. **Overview Metrics**: High-level service health
2. **Render Job Performance**: Success rates, duration, queue sizes
3. **API Performance**: Response times, error rates, throughput
4. **Redis Operations**: Cache hit rates, operation success rates
5. **System Metrics**: Memory usage, CPU usage, uptime

## Grafana Dashboard JSON

```json
{
  "dashboard": {
    "id": null,
    "title": "Minecraft Overviewer Integration",
    "tags": ["minecraft", "overviewer", "monitoring"],
    "style": "dark",
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Service Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"minecraft-admin-api\"}",
            "legendFormat": "Service Status"
          },
          {
            "expr": "overviewer_active_jobs",
            "legendFormat": "Active Jobs"
          },
          {
            "expr": "overviewer_job_queue_size",
            "legendFormat": "Queue Size"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "red", "value": 0}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Render Job Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(overviewer_jobs_total{status=\"completed\"}[5m]) / rate(overviewer_jobs_total[5m]) * 100",
            "legendFormat": "Success Rate %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 80},
                {"color": "green", "value": 95}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Render Duration Distribution",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(overviewer_render_duration_seconds_bucket[5m])",
            "legendFormat": "{{le}}"
          }
        ]
      },
      {
        "id": 4,
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(overviewer_api_request_duration_seconds_count[5m])",
            "legendFormat": "{{endpoint}} - {{method}}"
          }
        ]
      },
      {
        "id": 5,
        "title": "API Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(overviewer_api_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(overviewer_api_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "id": 6,
        "title": "Redis Operations",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(overviewer_redis_operations_total{status=\"success\"}[5m])",
            "legendFormat": "Successful operations"
          },
          {
            "expr": "rate(overviewer_redis_operations_total{status=\"error\"}[5m])",
            "legendFormat": "Failed operations"
          }
        ]
      },
      {
        "id": 7,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes",
            "legendFormat": "Resident Memory"
          },
          {
            "expr": "process_virtual_memory_bytes",
            "legendFormat": "Virtual Memory"
          }
        ]
      },
      {
        "id": 8,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(process_cpu_seconds_total[5m]) * 100",
            "legendFormat": "CPU Usage %"
          }
        ]
      },
      {
        "id": 9,
        "title": "Active Jobs by Server",
        "type": "table",
        "targets": [
          {
            "expr": "overviewer_active_jobs",
            "format": "table"
          }
        ]
      },
      {
        "id": 10,
        "title": "Top API Endpoints",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, rate(overviewer_api_request_duration_seconds_count[5m]))",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

## Dashboard Panels Description

### 1. Service Overview Panel
- **Purpose**: Quick health check of the service
- **Metrics**: Service uptime, active jobs, queue size
- **Alerting**: Alert if service is down or queue is too large

### 2. Render Job Success Rate Panel
- **Purpose**: Monitor render job success rate
- **Metrics**: Percentage of successful render jobs
- **Alerting**: Alert if success rate drops below 95%

### 3. Render Duration Distribution Panel
- **Purpose**: Understand render job performance distribution
- **Metrics**: Histogram of render durations
- **Optimization**: Identify slow renders and optimize

### 4. API Request Rate Panel
- **Purpose**: Monitor API usage and throughput
- **Metrics**: Requests per second by endpoint and method
- **Scaling**: Determine if more instances are needed

### 5. API Response Times Panel
- **Purpose**: Monitor API performance
- **Metrics**: 95th and 50th percentile response times
- **Alerting**: Alert if response times are too high

### 6. Redis Operations Panel
- **Purpose**: Monitor Redis performance and health
- **Metrics**: Successful vs failed Redis operations
- **Alerting**: Alert if error rate is too high

### 7. Memory Usage Panel
- **Purpose**: Monitor memory consumption
- **Metrics**: Resident and virtual memory usage
- **Optimization**: Identify memory leaks

### 8. CPU Usage Panel
- **Purpose**: Monitor CPU utilization
- **Metrics**: CPU usage percentage
- **Scaling**: Determine if more CPU resources are needed

### 9. Active Jobs by Server Panel
- **Purpose**: Monitor load distribution
- **Metrics**: Number of active jobs per server
- **Balancing**: Identify servers under heavy load

### 10. Top API Endpoints Panel
- **Purpose**: Identify most used endpoints
- **Metrics**: Request count for top endpoints
- **Optimization**: Focus performance improvements on hot paths

## Prometheus Configuration

Ensure your Prometheus configuration includes:

```yaml
scrape_configs:
  - job_name: 'minecraft-admin-api'
    static_configs:
      - targets: ['admin-api:3000']
    metrics_path: '/api/monitoring/metrics'
    scrape_interval: 15s
```

## Alerting Rules

Create alerting rules for:

1. **Service Down**: `up{job="minecraft-admin-api"} == 0`
2. **High Error Rate**: `rate(overviewer_api_request_duration_seconds_count{status_code=~"5.."}[5m]) > 0.1`
3. **Slow API Responses**: `histogram_quantile(0.95, rate(overviewer_api_request_duration_seconds_bucket[5m])) > 2`
4. **Low Success Rate**: `rate(overviewer_jobs_total{status="completed"}[5m]) / rate(overviewer_jobs_total[5m]) < 0.95`
5. **High Memory Usage**: `process_resident_memory_bytes / 1024 / 1024 > 1024`
6. **Redis Errors**: `rate(overviewer_redis_operations_total{status="error"}[5m]) > 0.01`

## Installation Steps

1. **Import Dashboard**:
   - Copy the JSON configuration
   - Import into Grafana via UI or API

2. **Configure Prometheus**:
   - Add the scrape config to prometheus.yml
   - Reload Prometheus configuration

3. **Set up Alerting**:
   - Create alerting rules
   - Configure notification channels

4. **Test Monitoring**:
   - Generate some API traffic
   - Start a render job
   - Verify metrics are being collected

## Best Practices

1. **Regular Review**: Review dashboard panels weekly
2. **Alert Tuning**: Tune alert thresholds based on historical data
3. **Retention**: Configure appropriate data retention in Prometheus
4. **Backup**: Keep dashboard configurations in version control
5. **Documentation**: Document any custom metrics or panels

---

**Status**: ✅ **Phase 2 Monitoring & Observability Complete**