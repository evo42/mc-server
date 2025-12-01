<template>
  <div class="analytics-dashboard">
    <div class="dashboard-header">
      <h1>
        <i class="fas fa-chart-line"></i>
        Analytics Dashboard
      </h1>
      <div class="time-range-selector">
        <select v-model="selectedTimeRange" @change="loadAnalyticsData">
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading analytics data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="loadAnalyticsData" class="btn btn-primary">
        <i class="fas fa-retry"></i>
        Retry
      </button>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">

      <!-- Overview Cards -->
      <div class="overview-cards">
        <div class="card metric-card">
          <div class="card-icon">
            <i class="fas fa-map"></i>
          </div>
          <div class="card-content">
            <h3>Render Jobs</h3>
            <div class="metric-value">{{ analytics.overview.renderJobs.total }}</div>
            <div class="metric-detail">
              <span class="success">{{ analytics.overview.renderJobs.completed }}</span> completed,
              <span class="rate">{{ analytics.overview.renderJobs.successRate }}%</span> success rate
            </div>
          </div>
        </div>

        <div class="card metric-card">
          <div class="card-icon">
            <i class="fas fa-server"></i>
          </div>
          <div class="card-content">
            <h3>API Usage</h3>
            <div class="metric-value">{{ analytics.overview.apiUsage.totalRequests }}</div>
            <div class="metric-detail">
              {{ analytics.overview.apiUsage.uniqueEndpoints }} endpoints,
              Peak: {{ analytics.overview.apiUsage.peakHour }}
            </div>
          </div>
        </div>

        <div class="card metric-card">
          <div class="card-icon">
            <i class="fas fa-heartbeat"></i>
          </div>
          <div class="card-content">
            <h3>System Health</h3>
            <div class="metric-value" :class="analytics.overview.systemHealth.status">
              {{ analytics.overview.systemHealth.status }}
            </div>
            <div class="metric-detail">
              {{ analytics.overview.systemHealth.uptime }} uptime,
              {{ analytics.overview.systemHealth.memoryUsage }} memory
            </div>
          </div>
        </div>

        <div class="card metric-card">
          <div class="card-icon">
            <i class="fas fa-chart-pie"></i>
          </div>
          <div class="card-content">
            <h3>Business Metrics</h3>
            <div class="metric-value">{{ analytics.overview.business.efficiencyScore }}</div>
            <div class="metric-detail">
              {{ analytics.overview.business.totalPublicMaps }} public maps,
              {{ analytics.overview.business.userActivity }} activity
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">

        <!-- Render Success Rate Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>Render Success Rate</h3>
            <i class="fas fa-info-circle" title="Success vs failed render jobs"></i>
          </div>
          <div class="chart-content">
            <div class="donut-chart">
              <canvas ref="successChart" width="200" height="200"></canvas>
              <div class="chart-center-text">
                <div class="percentage">{{ analytics.overview.renderJobs.successRate }}%</div>
                <div class="label">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Server Performance Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>Server Performance</h3>
            <i class="fas fa-info-circle" title="Render jobs per server"></i>
          </div>
          <div class="chart-content">
            <div class="bar-chart">
              <div
                v-for="server in analytics.charts.serverPerformance"
                :key="server.name"
                class="bar-item"
              >
                <div class="bar-label">{{ server.name }}</div>
                <div class="bar-container">
                  <div
                    class="bar-fill"
                    :style="{ width: (server.renderJobs / maxServerJobs * 100) + '%' }"
                  ></div>
                </div>
                <div class="bar-stats">
                  <span class="jobs">{{ server.renderJobs }} jobs</span>
                  <span class="rate">{{ server.successRate }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API Usage by Method -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>API Usage by Method</h3>
            <i class="fas fa-info-circle" title="HTTP method distribution"></i>
          </div>
          <div class="chart-content">
            <div class="pie-chart">
              <canvas ref="methodChart" width="200" height="200"></canvas>
              <div class="chart-legend">
                <div
                  v-for="(value, method) in analytics.charts.apiUsageByMethod"
                  :key="method"
                  class="legend-item"
                >
                  <div class="legend-color" :style="{ backgroundColor: getMethodColor(method) }"></div>
                  <span class="legend-label">{{ method }}</span>
                  <span class="legend-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Time of Day Usage -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>Usage by Time</h3>
            <i class="fas fa-info-circle" title="API usage throughout the day"></i>
          </div>
          <div class="chart-content">
            <div class="line-chart">
              <canvas ref="timeChart" width="300" height="150"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Endpoints Table -->
      <div class="endpoints-table">
        <div class="table-header">
          <h3>Top API Endpoints</h3>
          <button @click="exportAnalytics" class="btn btn-secondary">
            <i class="fas fa-download"></i>
            Export
          </button>
        </div>
        <div class="table-container">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Requests</th>
                <th>Avg Response Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="endpoint in analytics.charts.topEndpoints" :key="`${endpoint.method}-${endpoint.endpoint}`">
                <td>
                  <span :class="`method-badge ${endpoint.method.toLowerCase()}`">
                    {{ endpoint.method }}
                  </span>
                </td>
                <td class="endpoint-path">{{ endpoint.endpoint }}</td>
                <td>{{ endpoint.count }}</td>
                <td>{{ getEndpointResponseTime(endpoint.endpoint) }}ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Insights Section -->
      <div class="insights-section">
        <h3>Insights & Recommendations</h3>
        <div class="insights-grid">
          <div class="insight-card">
            <h4><i class="fas fa-trending-up"></i> Performance</h4>
            <ul>
              <li v-for="insight in analytics.insights.performance" :key="insight">
                {{ insight }}
              </li>
            </ul>
          </div>
          <div class="insight-card">
            <h4><i class="fas fa-chart-line"></i> Trends</h4>
            <ul>
              <li v-for="insight in analytics.insights.trends" :key="insight">
                {{ insight }}
              </li>
            </ul>
          </div>
          <div class="insight-card">
            <h4><i class="fas fa-bullseye"></i> Business KPIs</h4>
            <ul>
              <li v-for="(value, kpi) in analytics.insights.business" :key="kpi">
                {{ kpi }}: {{ value }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Real-time Status -->
      <div class="realtime-status">
        <div class="status-header">
          <h3>Real-time Status</h3>
          <span class="status-indicator" :class="{ active: isConnected }">
            <i :class="isConnected ? 'fas fa-circle' : 'fas fa-circle-notch fa-spin'"></i>
            {{ isConnected ? 'Connected' : 'Connecting...' }}
          </span>
        </div>
        <div class="status-content">
          <div class="status-item">
            <label>Active Render Jobs:</label>
            <span>{{ realtimeData.currentStatus.activeRenderJobs }}</span>
          </div>
          <div class="status-item">
            <label>Pending Jobs:</label>
            <span>{{ realtimeData.currentStatus.pendingJobs }}</span>
          </div>
          <div class="status-item">
            <label>System Uptime:</label>
            <span>{{ realtimeData.currentStatus.systemUptime }}</span>
          </div>
          <div class="status-item">
            <label>Public Maps:</label>
            <span>{{ realtimeData.currentStatus.publicMaps }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsDashboard',
  data() {
    return {
      loading: true,
      error: null,
      selectedTimeRange: '24h',
      analytics: {
        overview: {
          renderJobs: { total: 0, completed: 0, successRate: 0, averageDuration: '0s' },
          apiUsage: { totalRequests: 0, uniqueEndpoints: 0, peakHour: 'N/A' },
          systemHealth: { status: 'unknown', uptime: 'N/A', memoryUsage: 'N/A' },
          business: { totalPublicMaps: 0, efficiencyScore: 0, userActivity: 'unknown' }
        },
        charts: {
          renderSuccessRate: { data: [] },
          serverPerformance: [],
          apiUsageByMethod: {},
          topEndpoints: [],
          timeOfDayUsage: {}
        },
        insights: {
          performance: [],
          trends: [],
          business: {}
        }
      },
      realtimeData: {
        currentStatus: {
          activeRenderJobs: 0,
          pendingJobs: 0,
          totalJobs: 0,
          publicMaps: 0,
          systemUptime: 'N/A'
        }
      },
      isConnected: false,
      realtimeInterval: null,
      chartInstances: {}
    };
  },
  computed: {
    maxServerJobs() {
      return Math.max(...this.analytics.charts.serverPerformance.map(s => s.renderJobs), 1);
    }
  },
  methods: {
    async loadAnalyticsData() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`/api/analytics/dashboard?timeRange=${this.selectedTimeRange}`);
        const data = await response.json();

        if (data.success) {
          this.analytics = data.data;
          this.$nextTick(() => {
            this.renderCharts();
          });
        } else {
          throw new Error(data.error || 'Failed to load analytics data');
        }
      } catch (error) {
        this.error = error.message;
        console.error('Analytics loading error:', error);
      } finally {
        this.loading = false;
      }
    },

    async loadRealtimeData() {
      try {
        const response = await fetch('/api/analytics/realtime');
        const data = await response.json();

        if (data.success) {
          this.realtimeData = data.data;
          this.isConnected = true;
        }
      } catch (error) {
        this.isConnected = false;
        console.error('Real-time data loading error:', error);
      }
    },

    renderCharts() {
      this.renderSuccessChart();
      this.renderMethodChart();
      this.renderTimeChart();
    },

    renderSuccessChart() {
      const canvas = this.$refs.successChart;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 80;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get success/failure data
      const success = this.analytics.overview.renderJobs.completed;
      const failed = this.analytics.overview.renderJobs.total - success;
      const total = success + failed;

      if (total === 0) return;

      // Draw success arc
      const successAngle = (success / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + successAngle);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw remaining arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2 + successAngle, 3 * Math.PI / 2);
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();
    },

    renderMethodChart() {
      const canvas = this.$refs.methodChart;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const methods = this.analytics.charts.apiUsageByMethod;
      const total = Object.values(methods).reduce((sum, val) => sum + val, 0);

      if (total === 0) return;

      let startAngle = -Math.PI / 2;
      const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'];

      Object.entries(methods).forEach(([method, value], index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();

        startAngle = endAngle;
      });
    },

    renderTimeChart() {
      const canvas = this.$refs.timeChart;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const data = this.analytics.charts.timeOfDayUsage;
      const entries = Object.entries(data);

      if (entries.length === 0) return;

      const width = canvas.width;
      const height = canvas.height;
      const padding = 40;
      const chartWidth = width - 2 * padding;
      const chartHeight = height - 2 * padding;

      ctx.clearRect(0, 0, width, height);

      // Find max value
      const maxValue = Math.max(...entries.map(([_, value]) => value));

      // Draw axes
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Draw line chart
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = 2;
      ctx.beginPath();

      entries.forEach(([time, value], index) => {
        const x = padding + (index / (entries.length - 1)) * chartWidth;
        const y = height - padding - (value / maxValue) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Draw points
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      ctx.stroke();
    },

    getMethodColor(method) {
      const colors = {
        'GET': '#4CAF50',
        'POST': '#2196F3',
        'PUT': '#FF9800',
        'DELETE': '#F44336',
        'PATCH': '#9C27B0'
      };
      return colors[method] || '#757575';
    },

    getEndpointResponseTime(endpoint) {
      // Mock response times based on endpoint
      const responseTimes = {
        '/api/overviewer/render': 150,
        '/api/overviewer/jobs': 85,
        '/api/overviewer/public-maps': 120,
        '/api/analytics/dashboard': 200,
        '/api/monitoring/health': 50
      };
      return responseTimes[endpoint] || 100;
    },

    async exportAnalytics() {
      try {
        const response = await fetch(`/api/analytics/export?timeRange=${this.selectedTimeRange}&types=render,usage,business`);
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${this.selectedTimeRange}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export analytics data');
      }
    },

    initializeRealtime() {
      // Update real-time data every 30 seconds
      this.realtimeInterval = setInterval(() => {
        this.loadRealtimeData();
      }, 30000);

      // Initial load
      this.loadRealtimeData();
    }
  },
  mounted() {
    this.loadAnalyticsData();
    this.initializeRealtime();
  },
  beforeUnmount() {
    if (this.realtimeInterval) {
      clearInterval(this.realtimeInterval);
    }
  }
};
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-range-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-state i {
  font-size: 32px;
  margin-bottom: 10px;
  display: block;
}

.error-state i {
  font-size: 32px;
  color: #f44336;
  margin-bottom: 10px;
  display: block;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid #2196F3;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-icon {
  background: #2196F3;
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.card-content h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.metric-value.healthy {
  color: #4CAF50;
}

.metric-value.warning {
  color: #FF9800;
}

.metric-value.critical {
  color: #F44336;
}

.metric-detail {
  font-size: 12px;
  color: #666;
}

.metric-detail .success {
  color: #4CAF50;
  font-weight: 500;
}

.metric-detail .rate {
  color: #2196F3;
  font-weight: 500;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.chart-header i {
  color: #999;
  cursor: help;
}

.chart-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.donut-chart {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-center-text {
  position: absolute;
  text-align: center;
}

.chart-center-text .percentage {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.chart-center-text .label {
  font-size: 12px;
  color: #666;
}

.bar-chart {
  width: 100%;
}

.bar-item {
  margin-bottom: 15px;
}

.bar-label {
  font-size: 12px;
  color: #333;
  margin-bottom: 5px;
  font-weight: 500;
}

.bar-container {
  background: #f0f0f0;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 5px;
}

.bar-fill {
  background: linear-gradient(90deg, #2196F3, #64B5F6);
  height: 100%;
  transition: width 0.3s ease;
}

.bar-stats {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
}

.pie-chart {
  display: flex;
  gap: 20px;
  align-items: center;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  color: #333;
  font-weight: 500;
}

.legend-value {
  color: #666;
  margin-left: auto;
}

.line-chart {
  width: 100%;
}

.endpoints-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-header h3 {
  margin: 0;
  color: #333;
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
}

.analytics-table th,
.analytics-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.analytics-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.method-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.method-badge.get {
  background: #e8f5e8;
  color: #2e7d32;
}

.method-badge.post {
  background: #e3f2fd;
  color: #1565c0;
}

.method-badge.put {
  background: #fff3e0;
  color: #ef6c00;
}

.method-badge.delete {
  background: #ffebee;
  color: #c62828;
}

.endpoint-path {
  font-family: 'Courier New', monospace;
  color: #333;
}

.insights-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.insights-section h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.insight-card {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #2196F3;
}

.insight-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.insight-card ul {
  margin: 0;
  padding-left: 20px;
}

.insight-card li {
  margin-bottom: 5px;
  color: #555;
  font-size: 14px;
}

.realtime-status {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-header h3 {
  margin: 0;
  color: #333;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.status-indicator.active {
  color: #4CAF50;
}

.status-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.status-item label {
  font-weight: 500;
  color: #333;
}

.status-item span {
  color: #666;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .analytics-dashboard {
    padding: 10px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .overview-cards {
    grid-template-columns: 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .status-content {
    grid-template-columns: 1fr;
  }
}
</style>