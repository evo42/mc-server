<template>
  <div class="server-list">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-server"></i> Minecraft Servers</h2>
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
      loading-text="Loading server data..."
      container-class="my-5"
    />

    <div v-if="!loading || Object.keys(servers).length > 0" class="row">
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
                :disabled="server.status === 'running' || operationPending[server.server]"
              >
                <i class="bi bi-play-circle"></i> Start
              </button>
              <button
                class="btn btn-warning btn-sm"
                @click="stopServer(server.server)"
                :disabled="server.status !== 'running' || operationPending[server.server]"
              >
                <i class="bi bi-x-circle"></i> Stop
              </button>
              <button
                class="btn btn-info btn-sm"
                @click="restartServer(server.server)"
                :disabled="operationPending[server.server]"
              >
                <i class="bi bi-arrow-repeat"></i> Restart
              </button>
            </div>
            <div class="mt-2">
              <router-link :to="`/datapacks/${server.server}`" class="btn btn-secondary btn-sm w-100 mb-1">
                <i class="bi bi-box-seam"></i> Manage Datapacks
              </router-link>
              <router-link :to="`/server-config/${server.server}`" class="btn btn-outline-primary btn-sm w-100 mb-1">
                <i class="bi bi-gear"></i> Configure Server
              </router-link>
              <router-link :to="`/backup/${server.server}`" class="btn btn-outline-info btn-sm w-100">
                <i class="bi bi-arrow-repeat"></i> Backup/Restore
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Server filter input -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input
            type="text"
            class="form-control"
            placeholder="Filter servers..."
            v-model="serverFilter"
            @input="applyFilter"
          >
        </div>
      </div>
    </div>

    <!-- Server status filter buttons -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="btn-group" role="group">
          <button
            type="button"
            class="btn"
            :class="statusFilter === '' ? 'btn-primary' : 'btn-outline-primary'"
            @click="statusFilter = ''"
          >
            All Statuses
          </button>
          <button
            type="button"
            class="btn"
            :class="statusFilter === 'running' ? 'btn-success' : 'btn-outline-success'"
            @click="statusFilter = 'running'"
          >
            Running
          </button>
          <button
            type="button"
            class="btn"
            :class="statusFilter === 'stopped' ? 'btn-warning' : 'btn-outline-warning'"
            @click="statusFilter = 'stopped'"
          >
            Stopped
          </button>
          <button
            type="button"
            class="btn"
            :class="statusFilter === 'exited' ? 'btn-danger' : 'btn-outline-danger'"
            @click="statusFilter = 'exited'"
          >
            Exited
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination controls -->
    <div class="row mb-3">
      <div class="col-12 d-flex justify-content-between align-items-center">
        <div>
          Showing {{ Math.min((currentPage * itemsPerPage), filteredServers.length) }} of {{ filteredServers.length }} servers
        </div>
        <div class="btn-group">
          <button
            class="btn btn-outline-primary btn-sm"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Previous
          </button>
          <button
            class="btn btn-outline-primary btn-sm"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading || Object.keys(servers).length > 0" class="row">
      <div class="col-md-6 col-lg-4 mb-4" v-for="server in paginatedServers" :key="server.server">
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
                :disabled="server.status === 'running' || operationPending[server.server]"
              >
                <i class="bi bi-play-circle"></i> Start
              </button>
              <button
                class="btn btn-warning btn-sm"
                @click="stopServer(server.server)"
                :disabled="server.status !== 'running' || operationPending[server.server]"
              >
                <i class="bi bi-x-circle"></i> Stop
              </button>
              <button
                class="btn btn-info btn-sm"
                @click="restartServer(server.server)"
                :disabled="operationPending[server.server]"
              >
                <i class="bi bi-arrow-repeat"></i> Restart
              </button>
            </div>
            <div class="mt-2">
              <router-link :to="`/datapacks/${server.server}`" class="btn btn-secondary btn-sm w-100 mb-1">
                <i class="bi bi-box-seam"></i> Manage Datapacks
              </router-link>
              <router-link :to="`/server-config/${server.server}`" class="btn btn-outline-primary btn-sm w-100 mb-1">
                <i class="bi bi-gear"></i> Configure Server
              </router-link>
              <router-link :to="`/backup/${server.server}`" class="btn btn-outline-info btn-sm w-100">
                <i class="bi bi-arrow-repeat"></i> Backup/Restore
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination controls again at the bottom -->
    <div class="row">
      <div class="col-12 d-flex justify-content-center">
        <div class="btn-group">
          <button
            class="btn btn-outline-primary"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Previous
          </button>
          <span class="btn btn-outline-secondary">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            class="btn btn-outline-primary"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Operation pending indicator -->
    <div v-if="anyOperationPending" class="alert alert-info text-center">
      <div class="d-flex justify-content-center align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        <span>Server operation in progress...</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner.vue';
import ErrorDisplay from './ErrorDisplay.vue';

export default {
  name: 'ServerAdmin',
  components: {
    LoadingSpinner,
    ErrorDisplay
  },
  data() {
    return {
      servers: {},
      loading: false,
      error: null,
      operationPending: {}, // Track operations per server
      serverDisplayNames: {
        'mc-ilias': 'Ikaria Games',
        'mc-niilo': 'KDLK.net',
        'mc-bgstpoelten': 'BG St. Pölten Server',
        'mc-htlstp': 'HTL St. Pölten Server',
        'mc-borgstpoelten': 'BORG St. Pölten Server',
        'mc-hakstpoelten': 'HAK St. Pölten Server',
        'mc-basop-bafep-stp': 'BASOP BAFEP St. Pölten Server',
        'mc-play': 'Play Server'
      },
      // For lazy loading and filtering
      serverFilter: '',
      statusFilter: '',
      filteredServers: [],
      currentPage: 1,
      itemsPerPage: 12  // Show 12 servers per page
    }
  },
  computed: {
    anyOperationPending() {
      return Object.values(this.operationPending).some(status => status);
    },
    totalPages() {
      return Math.ceil(this.filteredServers.length / this.itemsPerPage);
    },
    paginatedServers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredServers.slice(start, end);
    }
  },
  watch: {
    servers: {
      handler() {
        this.applyFilter();
      },
      deep: true
    }
  },
  async mounted() {
    await this.loadServerStatus();
    // Set up auto-refresh every 30 seconds
    setInterval(this.loadServerStatus, 30000);
  },
  methods: {
    async loadServerStatus() {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get('/api/servers/status');
        this.servers = response.data;
      } catch (error) {
        console.error('Error loading server status:', error);

        // Check for authentication error specifically
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return; // Don't set error if it's an auth issue
        }

        // Set a user-friendly error message
        this.error = error.response?.data?.error ||
                     error.message ||
                     'Failed to load server status. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    applyFilter() {
      // Convert the servers object to an array for filtering
      let serverArray = Object.values(this.servers);

      // Apply name filter
      if (this.serverFilter) {
        const filter = this.serverFilter.toLowerCase();
        serverArray = serverArray.filter(server =>
          server.server.toLowerCase().includes(filter) ||
          this.getServerDisplayName(server.server).toLowerCase().includes(filter)
        );
      }

      // Apply status filter
      if (this.statusFilter) {
        serverArray = serverArray.filter(server => server.status === this.statusFilter);
      }

      this.filteredServers = serverArray;
      this.currentPage = 1;  // Reset to first page when filter changes
    },
    async startServer(serverName) {
      this.operationPending[serverName] = true;

      try {
        await axios.post(`/api/servers/start/${serverName}`);
        // Refresh the status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);

        // Show success toast notification
        this.$emit('show-toast', `Server ${serverName} started successfully`, 'success', 'Server Started');
      } catch (error) {
        console.error('Error starting server:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast notification
        const errorMessage = `Error starting ${serverName}: ${error.response?.data?.error || error.message}`;
        this.$emit('show-toast', errorMessage, 'error', 'Start Failed');
      } finally {
        this.operationPending[serverName] = false;
      }
    },
    async stopServer(serverName) {
      this.operationPending[serverName] = true;

      try {
        await axios.post(`/api/servers/stop/${serverName}`);
        // Refresh the status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);

        // Show success toast notification
        this.$emit('show-toast', `Server ${serverName} stopped successfully`, 'success', 'Server Stopped');
      } catch (error) {
        console.error('Error stopping server:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast notification
        const errorMessage = `Error stopping ${serverName}: ${error.response?.data?.error || error.message}`;
        this.$emit('show-toast', errorMessage, 'error', 'Stop Failed');
      } finally {
        this.operationPending[serverName] = false;
      }
    },
    async restartServer(serverName) {
      this.operationPending[serverName] = true;

      try {
        await axios.post(`/api/servers/restart/${serverName}`);
        // Refresh the status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);

        // Show success toast notification
        this.$emit('show-toast', `Server ${serverName} restarted successfully`, 'success', 'Server Restarted');
      } catch (error) {
        console.error('Error restarting server:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast notification
        const errorMessage = `Error restarting ${serverName}: ${error.response?.data?.error || error.message}`;
        this.$emit('show-toast', errorMessage, 'error', 'Restart Failed');
      } finally {
        this.operationPending[serverName] = false;
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

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>