<template>
  <div class="dashboard">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-speedometer2"></i> Server Performance Dashboard</h2>
      <button class="btn btn-primary" @click="refreshData" :disabled="loading">
        <i class="bi bi-arrow-clockwise" :class="{ 'animate-spin': loading }"></i> Refresh
      </button>
    </div>

    <!-- Error display -->
    <error-display
      v-if="error"
      :error="error"
      @dismiss="error = null"
      class="mb-4"
    />

    <!-- Loading spinner -->
    <loading-spinner
      v-if="loading && Object.keys(serverData).length === 0"
      loading-text="Loading dashboard metrics..."
      container-class="my-5"
    />

    <!-- Summary Cards -->
    <div v-if="!loading || Object.keys(serverData).length > 0" class="row mb-4">
      <div class="col-md-3 col-6">
        <div class="card text-center bg-primary text-white">
          <div class="card-body">
            <i class="bi bi-server h1"></i>
            <h3>{{ runningServersCount }}</h3>
            <p class="card-text">Running Servers</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card text-center bg-success text-white">
          <div class="card-body">
            <i class="bi bi-cpu h1"></i>
            <h3>{{ overallCPULoad }}%</h3>
            <p class="card-text">Avg CPU Load</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card text-center bg-info text-white">
          <div class="card-body">
            <i class="bi bi-memory h1"></i>
            <h3>{{ overallMemoryUsage }}</h3>
            <p class="card-text">Avg Memory</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card text-center bg-warning text-dark">
          <div class="card-body">
            <i class="bi bi-people h1"></i>
            <h3>{{ totalPlayers }}</h3>
            <p class="card-text">Total Players</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div v-if="!loading || Object.keys(serverData).length > 0" class="row mb-4">
      <!-- CPU Usage Chart -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5><i class="bi bi-cpu"></i> CPU Usage by Server</h5>
          </div>
          <div class="card-body">
            <canvas ref="cpuChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Memory Usage Chart -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5><i class="bi bi-memory"></i> Memory Usage by Server</h5>
          </div>
          <div class="card-body">
            <canvas ref="memoryChartCanvas"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Charts Row -->
    <div v-if="!loading || Object.keys(serverData).length > 0" class="row mb-4">
      <!-- Status Distribution Chart -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5><i class="bi bi-pie-chart"></i> Server Status Distribution</h5>
          </div>
          <div class="card-body">
            <canvas ref="statusChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Player Count Chart -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5><i class="bi bi-people"></i> Players by Server</h5>
          </div>
          <div class="card-body">
            <canvas ref="playersChartCanvas"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Server Status Table -->
    <div v-if="!loading || Object.keys(serverData).length > 0" class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5><i class="bi bi-list"></i> Server Status Overview</h5>
            <div class="d-flex gap-2">
              <input
                type="text"
                class="form-control form-control-sm"
                placeholder="Filter servers..."
                v-model="tableFilter"
                style="width: 200px;"
              >
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th @click="sortBy('server')" class="sortable">
                      Server <i v-if="sortKey === 'server'" :class="sortOrder === 'asc' ? 'bi bi-sort-alpha-down' : 'bi bi-sort-alpha-up-alt'"></i>
                    </th>
                    <th @click="sortBy('status')" class="sortable">
                      Status <i v-if="sortKey === 'status'" :class="sortOrder === 'asc' ? 'bi bi-sort-alpha-down' : 'bi bi-sort-alpha-up-alt'"></i>
                    </th>
                    <th @click="sortBy('cpu')" class="sortable">
                      CPU <i v-if="sortKey === 'cpu'" :class="sortOrder === 'asc' ? 'bi bi-sort-numeric-down' : 'bi bi-sort-numeric-up-alt'"></i>
                    </th>
                    <th @click="sortBy('memory')" class="sortable">
                      Memory <i v-if="sortKey === 'memory'" :class="sortOrder === 'asc' ? 'bi bi-sort-numeric-down' : 'bi bi-sort-numeric-up-alt'"></i>
                    </th>
                    <th @click="sortBy('playerCount')" class="sortable">
                      Players <i v-if="sortKey === 'playerCount'" :class="sortOrder === 'asc' ? 'bi bi-sort-numeric-down' : 'bi bi-sort-numeric-up-alt'"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="server in filteredAndSortedData"
                    :key="server.server"
                    :class="{ 'table-success': server.status === 'running', 'table-warning': server.status === 'stopped', 'table-danger': server.status === 'exited' }"
                  >
                    <td>
                      <router-link :to="`/server-config/${server.server}`" class="text-decoration-none">
                        {{ getServerDisplayName(server.server) }}
                      </router-link>
                    </td>
                    <td>
                      <span class="badge" :class="getStatusBadgeClass(server.status)">
                        {{ server.status }}
                      </span>
                    </td>
                    <td>{{ server.cpu }}</td>
                    <td>{{ server.memory }}</td>
                    <td>{{ server.playerCount }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import LoadingSpinner from './LoadingSpinner.vue';
import ErrorDisplay from './ErrorDisplay.vue';

// Register Chart.js components
Chart.register(...registerables);

export default {
  name: 'Dashboard',
  components: {
    LoadingSpinner,
    ErrorDisplay
  },
  data() {
    return {
      serverData: {},
      loading: false,
      error: null,
      cpuChart: null,
      memoryChart: null,
      statusChart: null,
      playersChart: null,
      tableFilter: '',
      sortKey: 'server',
      sortOrder: 'asc',
      serverDisplayNames: {
        'mc-ilias': 'Ikaria Games',
        'mc-niilo': 'KDLK.net',
        'mc-bgstpoelten': 'BG St. Pölten Server',
        'mc-htlstp': 'HTL St. Pölten Server',
        'mc-borgstpoelten': 'BORG St. Pölten Server',
        'mc-hakstpoelten': 'HAK St. Pölten Server',
        'mc-basop-bafep-stp': 'BASOP BAFEP St. Pölten Server',
        'mc-play': 'Play Server'
      }
    }
  },
  computed: {
    runningServersCount() {
      return Object.values(this.serverData).filter(server => server.status === 'running').length;
    },
    overallCPULoad() {
      const cpus = Object.values(this.serverData)
        .map(server => parseFloat(server.cpu.replace('%', '')) || 0)
        .filter(cpu => !isNaN(cpu));

      if (cpus.length === 0) return '0.00';

      const avg = cpus.reduce((a, b) => a + b, 0) / cpus.length;
      return avg.toFixed(2);
    },
    overallMemoryUsage() {
      const memories = Object.values(this.serverData)
        .map(server => server.memory)
        .filter(mem => mem && mem !== 'N/A');

      if (memories.length === 0) return 'N/A';

      // Calculate average memory usage (simplified)
      const total = memories.length;
      return `${total} servers`;
    },
    totalPlayers() {
      return Object.values(this.serverData)
        .map(server => server.playerCount || 0)
        .reduce((a, b) => a + b, 0);
    },
    filteredAndSortedData() {
      let data = Object.values(this.serverData);

      // Apply filter
      if (this.tableFilter) {
        const filter = this.tableFilter.toLowerCase();
        data = data.filter(server =>
          server.server.toLowerCase().includes(filter) ||
          this.getServerDisplayName(server.server).toLowerCase().includes(filter)
        );
      }

      // Apply sorting
      data.sort((a, b) => {
        let valA = a[this.sortKey];
        let valB = b[this.sortKey];

        // Handle numeric values for CPU, memory, player count
        if (this.sortKey === 'cpu') {
          valA = parseFloat(valA.replace('%', '')) || 0;
          valB = parseFloat(valB.replace('%', '')) || 0;
        } else if (this.sortKey === 'memory') {
          // For memory, we could parse the values, but for simplicity we'll compare as strings for now
        } else if (this.sortKey === 'playerCount') {
          valA = valA || 0;
          valB = valB || 0;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return data;
    }
  },
  async mounted() {
    await this.loadData();
    this.createCharts();

    // Refresh data every 30 seconds
    setInterval(this.loadData, 30000);
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get('/api/servers/status');
        this.serverData = response.data;

        this.updateCharts();
      } catch (error) {
        console.error('Error loading dashboard data:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        this.error = error.response?.data?.error || error.message || 'Failed to load dashboard data';
        this.$emit('show-toast', this.error, 'error', 'Load Failed');
      } finally {
        this.loading = false;
      }
    },
    createCharts() {
      this.createCPUChart();
      this.createMemoryChart();
      this.createStatusChart();
      this.createPlayersChart();
    },
    updateCharts() {
      this.updateCPUChart();
      this.updateMemoryChart();
      this.updateStatusChart();
      this.updatePlayersChart();
    },
    createCPUChart() {
      const ctx = this.$refs.cpuChartCanvas.getContext('2d');

      // Prepare data - extract CPU percentages
      const serverNames = Object.keys(this.serverData);
      const cpuData = serverNames.map(name => {
        const cpuStr = this.serverData[name].cpu;
        return cpuStr && cpuStr.includes('%') ? parseFloat(cpuStr.replace('%', '')) : 0;
      });

      this.cpuChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: serverNames.map(name => this.getServerDisplayName(name)),
          datasets: [{
            label: 'CPU Usage (%)',
            data: cpuData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'CPU Usage by Server'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'CPU Usage (%)'
              }
            }
          }
        }
      });
    },
    updateCPUChart() {
      if (!this.cpuChart) {
        this.createCPUChart();
        return;
      }

      // Prepare data - extract CPU percentages
      const serverNames = Object.keys(this.serverData);
      const cpuData = serverNames.map(name => {
        const cpuStr = this.serverData[name].cpu;
        return cpuStr && cpuStr.includes('%') ? parseFloat(cpuStr.replace('%', '')) : 0;
      });

      this.cpuChart.data.labels = serverNames.map(name => this.getServerDisplayName(name));
      this.cpuChart.data.datasets[0].data = cpuData;
      this.cpuChart.update();
    },
    createMemoryChart() {
      const ctx = this.$refs.memoryChartCanvas.getContext('2d');

      // Prepare data - extract memory values (simplified)
      const serverNames = Object.keys(this.serverData);
      const memoryData = serverNames.map(name => {
        const memStr = this.serverData[name].memory;
        // Extract number from memory string like "1234.56MB"
        if (memStr && memStr !== 'N/A') {
          const match = memStr.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : 0;
        }
        return 0;
      });

      this.memoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: serverNames.map(name => this.getServerDisplayName(name)),
          datasets: [{
            label: 'Memory Usage (MB)',
            data: memoryData,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Memory Usage by Server'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Memory (MB)'
              }
            }
          }
        }
      });
    },
    updateMemoryChart() {
      if (!this.memoryChart) {
        this.createMemoryChart();
        return;
      }

      // Prepare data - extract memory values
      const serverNames = Object.keys(this.serverData);
      const memoryData = serverNames.map(name => {
        const memStr = this.serverData[name].memory;
        // Extract number from memory string like "1234.56MB"
        if (memStr && memStr !== 'N/A') {
          const match = memStr.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : 0;
        }
        return 0;
      });

      this.memoryChart.data.labels = serverNames.map(name => this.getServerDisplayName(name));
      this.memoryChart.data.datasets[0].data = memoryData;
      this.memoryChart.update();
    },
    createStatusChart() {
      const ctx = this.$refs.statusChartCanvas.getContext('2d');

      // Count statuses
      const statuses = Object.values(this.serverData).map(s => s.status);
      const statusCounts = {};
      statuses.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusLabels = Object.keys(statusCounts);
      const statusData = Object.values(statusCounts);

      const backgroundColors = statusLabels.map(status => {
        const statusMap = {
          'running': 'rgba(40, 167, 69, 0.6)',
          'exited': 'rgba(220, 53, 69, 0.6)',
          'stopped': 'rgba(255, 193, 7, 0.6)',
          'paused': 'rgba(13, 110, 253, 0.6)'
        };
        return statusMap[status] || 'rgba(108, 117, 125, 0.6)';
      });

      this.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusData,
            backgroundColor: backgroundColors,
            borderColor: statusLabels.map(status => {
              const statusMap = {
                'running': 'rgba(40, 167, 69, 1)',
                'exited': 'rgba(220, 53, 69, 1)',
                'stopped': 'rgba(255, 193, 7, 1)',
                'paused': 'rgba(13, 110, 253, 1)'
              };
              return statusMap[status] || 'rgba(108, 117, 125, 1)';
            }),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Server Status Distribution'
            }
          }
        }
      });
    },
    updateStatusChart() {
      if (!this.statusChart) {
        this.createStatusChart();
        return;
      }

      // Count statuses
      const statuses = Object.values(this.serverData).map(s => s.status);
      const statusCounts = {};
      statuses.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusLabels = Object.keys(statusCounts);
      const statusData = Object.values(statusCounts);

      const backgroundColors = statusLabels.map(status => {
        const statusMap = {
          'running': 'rgba(40, 167, 69, 0.6)',
          'exited': 'rgba(220, 53, 69, 0.6)',
          'stopped': 'rgba(255, 193, 7, 0.6)',
          'paused': 'rgba(13, 110, 253, 0.6)'
        };
        return statusMap[status] || 'rgba(108, 117, 125, 0.6)';
      });

      this.statusChart.data.labels = statusLabels;
      this.statusChart.data.datasets[0].data = statusData;
      this.statusChart.data.datasets[0].backgroundColor = backgroundColors;
      this.statusChart.update();
    },
    createPlayersChart() {
      const ctx = this.$refs.playersChartCanvas.getContext('2d');

      // Prepare data - player counts
      const serverNames = Object.keys(this.serverData);
      const playerData = serverNames.map(name => this.serverData[name].playerCount || 0);

      this.playersChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: serverNames.map(name => this.getServerDisplayName(name)),
          datasets: [{
            label: 'Players Online',
            data: playerData,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Players by Server'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Players'
              }
            }
          }
        }
      });
    },
    updatePlayersChart() {
      if (!this.playersChart) {
        this.createPlayersChart();
        return;
      }

      // Prepare data - player counts
      const serverNames = Object.keys(this.serverData);
      const playerData = serverNames.map(name => this.serverData[name].playerCount || 0);

      this.playersChart.data.labels = serverNames.map(name => this.getServerDisplayName(name));
      this.playersChart.data.datasets[0].data = playerData;
      this.playersChart.update();
    },
    refreshData() {
      this.loadData();
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    getStatusBadgeClass(status) {
      const statusMap = {
        'running': 'bg-success',
        'exited': 'bg-danger',
        'stopped': 'bg-warning',
        'paused': 'bg-info'
      };
      return statusMap[status] || 'bg-secondary';
    },
    getServerDisplayName(serverName) {
      return this.serverDisplayNames[serverName] || serverName;
    }
  }
}
</script>

<style scoped>
.sortable {
  cursor: pointer;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.table th.sortable i {
  margin-left: 5px;
}
</style>