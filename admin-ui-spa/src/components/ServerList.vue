<template>
  <div class="server-stats-page">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-bar-chart-line"></i> Server Statistics</h2>
      <button class="btn btn-primary" @click="refreshStatus" :disabled="loading">
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
      v-if="loading && Object.keys(servers).length === 0"
      loading-text="Loading server statistics..."
      container-class="my-5"
    />

    <!-- 3D Visualization Section -->
    <div v-if="!loading || Object.keys(servers).length > 0" class="row mb-4">
      <div class="col-12">
        <stats-3d-visualization :server-status="servers" />
      </div>
    </div>

    <!-- Traditional Table View -->
    <div v-if="!loading || Object.keys(servers).length > 0" class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5><i class="bi bi-hdd-stack"></i> All Servers</h5>
          </div>
          <div class="card-body">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Server Name</th>
                  <th>Status</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Players</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="server in servers" :key="server.server">
                  <td>{{ getServerDisplayName(server.server) }}</td>
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
</template>

<script>
import { useServerStore } from '../stores/serverStore';
import Stats3DVisualization from './Stats3DVisualization.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import ErrorDisplay from './ErrorDisplay.vue';

export default {
  name: 'ServerList',
  components: {
    Stats3DVisualization,
    LoadingSpinner,
    ErrorDisplay
  },
  setup() {
    const serverStore = useServerStore();
    return { serverStore };
  },
  data() {
    return {
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
    servers() {
      return this.serverStore.servers;
    },
    loading() {
      return this.serverStore.loading;
    },
    error() {
      return this.serverStore.error;
    }
  },
  async mounted() {
    await this.serverStore.loadServerStatus();
    // Set up auto-refresh every 30 seconds
    setInterval(() => this.serverStore.loadServerStatus(), 30000);
  },
  methods: {
    async loadServerStatus() {
      await this.serverStore.loadServerStatus();
    },
    refreshStatus() {
      this.loadServerStatus();
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
.server-stats-page {
  padding: 2rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
