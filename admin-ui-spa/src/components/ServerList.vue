<template>
  <div class="server-stats-page">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-bar-chart-line"></i> Server Statistics</h2>
      <button class="btn btn-primary" @click="refreshStatus">
        <i class="bi bi-arrow-clockwise"></i> Refresh
      </button>
    </div>

    <div class="row">
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
import axios from 'axios'

export default {
  name: 'ServerList',
  data() {
    return {
      servers: {},
      serverDisplayNames: {
        'mc-ilias': 'ILIAS Server',
        'mc-niilo': 'Niilo Server',
        'mc-bgstpoelten': 'BGST Pöelten Server',
        'mc-htlstp': 'HTLSTP Server',
        'mc-borgstpoelten': 'BORGST Pöelten Server',
        'mc-hakstpoelten': 'HAKST Pöelten Server',
        'mc-basop-bafep-stp': 'BASOP BAFEP STP Server',
        'mc-play': 'Play Server'
      }
    }
  },
  async mounted() {
    await this.loadServerStatus();
    // Set up auto-refresh every 30 seconds
    setInterval(this.loadServerStatus, 30000);
  },
  methods: {
    async loadServerStatus() {
      try {
        const response = await axios.get('/api/servers/status');
        this.servers = response.data;
      } catch (error) {
        console.error('Error loading server status:', error);
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
        }
      }
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
</style>
