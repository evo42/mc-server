<template>
  <div class="server-list">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-server"></i> Minecraft Servers</h2>
      <button class="btn btn-primary" @click="refreshStatus">
        <i class="bi bi-arrow-clockwise"></i> Refresh
      </button>
    </div>

    <div class="row">
      <div class="col-md-6 col-lg-4 mb-4" v-for="server in servers" :key="server.server">
        <div class="card h-100 server-card" :class="getStatusClass(server.status)">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">{{ getServerDisplayName(server.server) }}</h5>
            <span class="badge" :class="getStatusBadgeClass(server.status)">
              {{ server.status }}
            </span>
          </div>
          <div class="card-body">
            <div class="server-stats">
              <p class="card-text"><i class="bi bi-cpu"></i> <strong>CPU:</strong> {{ server.cpu }}</p>
              <p class="card-text"><i class="bi bi-memory"></i> <strong>Memory:</strong> {{ server.memory }}</p>
              <p class="card-text"><i class="bi bi-people"></i> <strong>Players:</strong> {{ server.playerCount }}</p>
            </div>
          </div>
          <div class="card-footer">
            <div class="btn-group w-100" role="group">
              <button 
                class="btn btn-success btn-sm" 
                @click="startServer(server.server)"
                :disabled="server.status === 'running'"
              >
                <i class="bi bi-play-circle"></i> Start
              </button>
              <button 
                class="btn btn-warning btn-sm" 
                @click="stopServer(server.server)"
                :disabled="server.status !== 'running'"
              >
                <i class="bi bi-x-circle"></i> Stop
              </button>
              <button 
                class="btn btn-info btn-sm" 
                @click="restartServer(server.server)"
              >
                <i class="bi bi-arrow-repeat"></i> Restart
              </button>
            </div>
            <div class="mt-2">
              <router-link :to="`/datapacks/${server.server}`" class="btn btn-secondary btn-sm w-100">
                <i class="bi bi-box-seam"></i> Manage Datapacks
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="isOperationPending" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
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
      isOperationPending: false,
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
    async startServer(serverName) {
      this.isOperationPending = true;
      try {
        await axios.post(`/api/servers/start/${serverName}`);
        // Refresh the status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);
      } catch (error) {
        console.error('Error starting server:', error);
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
        } else {
          alert(`Error starting ${serverName}: ${error.message}`);
        }
      } finally {
        this.isOperationPending = false;
      }
    },
    async stopServer(serverName) {
      this.isOperationPending = true;
      try {
        await axios.post(`/api/servers/stop/${serverName}`);
        // Refresh the status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);
      } catch (error) {
        console.error('Error stopping server:', error);
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
        } else {
          alert(`Error stopping ${serverName}: ${error.message}`);
        }
      } finally {
        this.isOperationPending = false;
      }
    },
    async restartServer(serverName) {
      this.isOperationPending = true;
      try {
        await axios.post(`/api/servers/restart/${serverName}`);
        // Refresh the status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);
      } catch (error) {
        console.error('Error restarting server:', error);
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
        } else {
          alert(`Error restarting ${serverName}: ${error.message}`);
        }
      } finally {
        this.isOperationPending = false;
      }
    },
    refreshStatus() {
      this.loadServerStatus();
    },
    getStatusClass(status) {
      const statusMap = {
        'running': 'border-success',
        'exited': 'border-danger',
        'stopped': 'border-warning',
        'paused': 'border-info'
      };
      return statusMap[status] || 'border-secondary';
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
.server-card {
  transition: transform 0.2s;
}

.server-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.server-stats p {
  margin-bottom: 0.5rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
</style>