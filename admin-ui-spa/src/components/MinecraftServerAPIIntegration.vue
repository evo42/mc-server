<template>
  <div class="minecraft-serverapi-integration">
    <h2>MinecraftServerAPI Integration</h2>

    <!-- MinecraftServerAPI Service Status -->
    <div class="status-card" :class="{ 'status-healthy': serverApiStatus, 'status-unhealthy': !serverApiStatus }">
      <h3>MinecraftServerAPI Service Status</h3>
      <div class="status-indicator">
        <span class="status-dot" :class="{ 'dot-green': serverApiStatus, 'dot-red': !serverApiStatus }"></span>
        <span>{{ serverApiStatus ? 'Connected' : 'Disconnected' }}</span>
        <button @click="checkServerApiHealth" :disabled="isChecking">
          {{ isChecking ? 'Checking...' : 'Check Status' }}
        </button>
      </div>
    </div>

    <!-- MinecraftServerAPI Features -->
    <div v-if="serverApiStatus" class="features-grid">
      <!-- Server Status Overview -->
      <div class="feature-card">
        <h3>📊 Server Status Overview</h3>
        <select v-model="selectedServerForStatus" @change="loadServerStatus">
          <option value="">Select Server</option>
          <option v-for="server in servers" :key="server" :value="server">
            {{ server }}
          </option>
        </select>
        <div v-if="statusLoading" class="loading">Loading server status...</div>
        <div v-else-if="serverStatus" class="server-status">
          <div class="status-item">
            <strong>Status:</strong>
            <span :class="serverStatus.running ? 'status-online' : 'status-offline'">
              {{ serverStatus.running ? 'Online' : 'Offline' }}
            </span>
          </div>
          <div class="status-item">
            <strong>Version:</strong> {{ serverStatus.version }}
          </div>
          <div class="status-item">
            <strong>Players:</strong> {{ serverStatus.onlinePlayers }}/{{ serverStatus.maxPlayers }}
          </div>
          <div class="status-item">
            <strong>Uptime:</strong> {{ formatUptime(serverStatus.uptime) }}
          </div>
          <div class="status-item">
            <strong>Memory:</strong> {{ serverStatus.memory.used }}/{{ serverStatus.memory.max }}MB
          </div>
        </div>
      </div>

      <!-- Player Management -->
      <div class="feature-card">
        <h3>👥 Player Management</h3>
        <select v-model="selectedServerForPlayers" @change="loadPlayers">
          <option value="">Select Server</option>
          <option v-for="server in servers" :key="server" :value="server">
            {{ server }}
          </option>
        </select>
        <div v-if="playersLoading" class="loading">Loading players...</div>
        <div v-else-if="players.length > 0" class="player-list">
          <div v-for="player in players" :key="player.uuid" class="player-item">
            <div class="player-info">
              <h4>{{ player.name }}</h4>
              <p>UUID: {{ player.uuid }}</p>
              <small>Status: {{ player.online ? 'Online' : 'Offline' }}</small>
            </div>
            <div class="player-actions">
              <button @click="kickPlayer(player)" :disabled="!player.online">Kick</button>
              <button @click="banPlayer(player)" :disabled="!player.online">Ban</button>
              <button @click="getPlayerStats(player)">Stats</button>
            </div>
          </div>
        </div>
      </div>

      <!-- World Management -->
      <div class="feature-card">
        <h3>🌍 World Management</h3>
        <select v-model="selectedServerForWorld" @change="loadWorlds">
          <option value="">Select Server</option>
          <option v-for="server in servers" :key="server" :value="server">
            {{ server }}
          </option>
        </select>
        <div v-if="worldsLoading" class="loading">Loading worlds...</div>
        <div v-else-if="worlds.length > 0" class="world-list">
          <div v-for="world in worlds" :key="world.name" class="world-item">
            <div class="world-info">
              <h4>{{ world.name }}</h4>
              <p>Type: {{ world.type }}</p>
              <small>Size: {{ world.size }}MB | Players: {{ world.players }}</small>
            </div>
            <div class="world-actions">
              <button @click="saveWorld(world)">Save</button>
              <button @click="loadWorld(world)">Load</button>
              <button @click="unloadWorld(world)">Unload</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Plugin Management -->
      <div class="feature-card">
        <h3>🔌 Plugin Management</h3>
        <select v-model="selectedServerForPlugins" @change="loadPlugins">
          <option value="">Select Server</option>
          <option v-for="server in servers" :key="server" :value="server">
            {{ server }}
          </option>
        </select>
        <div v-if="pluginsLoading" class="loading">Loading plugins...</div>
        <div v-else-if="plugins.length > 0" class="plugin-list">
          <div v-for="plugin in plugins" :key="plugin.name" class="plugin-item">
            <div class="plugin-info">
              <h4>{{ plugin.name }}</h4>
              <p>Version: {{ plugin.version }}</p>
              <small>Author: {{ plugin.author }}</small>
            </div>
            <div class="plugin-actions">
              <button @click="reloadPlugin(plugin)" :disabled="plugin.name === 'MinecraftServerAPI'">Reload</button>
              <button @click="disablePlugin(plugin)" :disabled="plugin.name === 'MinecraftServerAPI'">Disable</button>
              <button @click="enablePlugin(plugin)" :disabled="plugin.enabled">Enable</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Monitoring -->
      <div class="feature-card">
        <h3>⚡ Performance Monitoring</h3>
        <select v-model="selectedServerForPerformance" @change="loadPerformance">
          <option value="">Select Server</option>
          <option v-for="server in servers" :key="server" :value="server">
            {{ server }}
          </option>
        </select>
        <div v-if="performanceLoading" class="loading">Loading performance data...</div>
        <div v-else-if="performance" class="performance-data">
          <div class="metric">
            <strong>TPS:</strong>
            <span :class="getTPSClass(performance.tps)">{{ performance.tps.toFixed(2) }}</span>
          </div>
          <div class="metric">
            <strong>CPU:</strong> {{ performance.cpu.toFixed(1) }}%
          </div>
          <div class="metric">
            <strong>Memory:</strong> {{ performance.memory.toFixed(1) }}%
          </div>
          <div class="metric">
            <strong>Disk:</strong> {{ performance.disk.toFixed(1) }}%
          </div>
          <div class="metric">
            <strong>Network:</strong> ↑{{ performance.network.up }}KB/s ↓{{ performance.network.down }}KB/s
          </div>
        </div>
      </div>

      <!-- WebHook Events -->
      <div class="feature-card">
        <h3>🔔 WebHook Events</h3>
        <div class="webhook-events">
          <div v-if="webhookEvents.length === 0" class="no-events">
            No recent events
          </div>
          <div v-else class="event-list">
            <div v-for="event in webhookEvents" :key="event.id" class="event-item">
              <div class="event-info">
                <strong>{{ event.type }}</strong>
                <span>{{ event.server }}</span>
                <small>{{ formatTime(event.timestamp) }}</small>
              </div>
              <div class="event-data">
                <pre>{{ JSON.stringify(event.data, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="webhook-controls">
          <button @click="refreshEvents" :disabled="eventsLoading">
            {{ eventsLoading ? 'Refreshing...' : 'Refresh Events' }}
          </button>
          <button @click="clearEvents">Clear Events</button>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      <h4>Error</h4>
      <p>{{ error }}</p>
      <button @click="clearError">Dismiss</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MinecraftServerAPIIntegration',
  data() {
    return {
      serverApiStatus: false,
      isChecking: false,
      selectedServerForStatus: '',
      selectedServerForPlayers: '',
      selectedServerForWorld: '',
      selectedServerForPlugins: '',
      selectedServerForPerformance: '',
      serverStatus: null,
      players: [],
      worlds: [],
      plugins: [],
      performance: null,
      webhookEvents: [],
      statusLoading: false,
      playersLoading: false,
      worldsLoading: false,
      pluginsLoading: false,
      performanceLoading: false,
      eventsLoading: false,
      error: null,
      servers: [
        'mc-ilias',
        'mc-niilo',
        'mc-bgstpoelten',
        'mc-htlstp',
        'mc-borgstpoelten',
        'mc-hakstpoelten',
        'mc-basop-bafep-stp',
        'mc-play'
      ]
    };
  },
  mounted() {
    this.checkServerApiHealth();
    this.refreshEvents();
    // Auto-refresh events every 30 seconds
    setInterval(() => {
      if (this.serverApiStatus) {
        this.refreshEvents();
      }
    }, 30000);
  },
  methods: {
    async checkServerApiHealth() {
      this.isChecking = true;
      try {
        const response = await axios.get('/api/minecraft-serverapi/health');
        this.serverApiStatus = response.data.success;
      } catch (error) {
        console.error('MinecraftServerAPI health check failed:', error);
        this.serverApiStatus = false;
        this.error = 'Failed to connect to MinecraftServerAPI service';
      } finally {
        this.isChecking = false;
      }
    },

    async loadServerStatus() {
      if (!this.selectedServerForStatus) return;

      this.statusLoading = true;
      try {
        const response = await axios.get(`/api/minecraft-serverapi/${this.selectedServerForStatus}/status`);
        this.serverStatus = response.data;
      } catch (error) {
        console.error('Failed to load server status:', error);
        this.error = 'Failed to load server status';
      } finally {
        this.statusLoading = false;
      }
    },

    async loadPlayers() {
      if (!this.selectedServerForPlayers) return;

      this.playersLoading = true;
      try {
        const response = await axios.get(`/api/minecraft-serverapi/${this.selectedServerForPlayers}/players`);
        this.players = response.data.players || [];
      } catch (error) {
        console.error('Failed to load players:', error);
        this.error = 'Failed to load players';
      } finally {
        this.playersLoading = false;
      }
    },

    async loadWorlds() {
      if (!this.selectedServerForWorld) return;

      this.worldsLoading = true;
      try {
        const response = await axios.get(`/api/minecraft-serverapi/${this.selectedServerForWorld}/worlds`);
        this.worlds = response.data.worlds || [];
      } catch (error) {
        console.error('Failed to load worlds:', error);
        this.error = 'Failed to load worlds';
      } finally {
        this.worldsLoading = false;
      }
    },

    async loadPlugins() {
      if (!this.selectedServerForPlugins) return;

      this.pluginsLoading = true;
      try {
        const response = await axios.get(`/api/minecraft-serverapi/${this.selectedServerForPlugins}/plugins`);
        this.plugins = response.data.plugins || [];
      } catch (error) {
        console.error('Failed to load plugins:', error);
        this.error = 'Failed to load plugins';
      } finally {
        this.pluginsLoading = false;
      }
    },

    async loadPerformance() {
      if (!this.selectedServerForPerformance) return;

      this.performanceLoading = true;
      try {
        const response = await axios.get(`/api/minecraft-serverapi/${this.selectedServerForPerformance}/performance`);
        this.performance = response.data;
      } catch (error) {
        console.error('Failed to load performance data:', error);
        this.error = 'Failed to load performance data';
      } finally {
        this.performanceLoading = false;
      }
    },

    async refreshEvents() {
      this.eventsLoading = true;
      try {
        const response = await axios.get('/api/minecraft-serverapi/webhooks/events');
        this.webhookEvents = response.data.events || [];
      } catch (error) {
        console.error('Failed to load webhook events:', error);
        this.error = 'Failed to load webhook events';
      } finally {
        this.eventsLoading = false;
      }
    },

    async kickPlayer(player) {
      if (!confirm(`Are you sure you want to kick player "${player.name}"?`)) return;

      try {
        await axios.post(`/api/minecraft-serverapi/${this.selectedServerForPlayers}/player/${player.uuid}/kick`);
        alert(`Player ${player.name} has been kicked`);
        this.loadPlayers(); // Refresh the player list
      } catch (error) {
        console.error('Failed to kick player:', error);
        this.error = 'Failed to kick player';
      }
    },

    async banPlayer(player) {
      if (!confirm(`Are you sure you want to ban player "${player.name}"?`)) return;

      try {
        await axios.post(`/api/minecraft-serverapi/${this.selectedServerForPlayers}/player/${player.uuid}/ban`);
        alert(`Player ${player.name} has been banned`);
        this.loadPlayers(); // Refresh the player list
      } catch (error) {
        console.error('Failed to ban player:', error);
        this.error = 'Failed to ban player';
      }
    },

    async getPlayerStats(player) {
      try {
        const response = await axios.get(`/api/minecraft-serverapi/${this.selectedServerForPlayers}/player/${player.uuid}/stats`);
        alert(`Player Stats:\n${JSON.stringify(response.data, null, 2)}`);
      } catch (error) {
        console.error('Failed to get player stats:', error);
        this.error = 'Failed to get player stats';
      }
    },

    async saveWorld(world) {
      try {
        await axios.post(`/api/minecraft-serverapi/${this.selectedServerForWorld}/world/${world.name}/save`);
        alert(`World ${world.name} saved successfully`);
      } catch (error) {
        console.error('Failed to save world:', error);
        this.error = 'Failed to save world';
      }
    },

    async loadWorld(world) {
      try {
        await axios.post(`/api/minecraft-serverapi/${this.selectedServerForWorld}/world/${world.name}/load`);
        alert(`World ${world.name} loaded successfully`);
        this.loadWorlds(); // Refresh the world list
      } catch (error) {
        console.error('Failed to load world:', error);
        this.error = 'Failed to load world';
      }
    },

    async unloadWorld(world) {
      try {
        await axios.post(`/api/minecraft-serverapi/${this.selectedServerForWorld}/world/${world.name}/unload`);
        alert(`World ${world.name} unloaded successfully`);
        this.loadWorlds(); // Refresh the world list
      } catch (error) {
        console.error('Failed to unload world:', error);
        this.error = 'Failed to unload world';
      }
    },

    async reloadPlugin(plugin) {
      if (plugin.name === 'MinecraftServerAPI') return;

      try {
        await axios.post(`/api/minecraft-serverapi/${this.selectedServerForPlugins}/plugin/${plugin.name}/reload`);
        alert(`Plugin ${plugin.name} reloaded successfully`);
        this.loadPlugins(); // Refresh the plugin list
      } catch (error) {
        console.error('Failed to reload plugin:', error);
        this.error = 'Failed to reload plugin';
      }
    },

    async disablePlugin(plugin) {
      if (plugin.name === 'MinecraftServerAPI') return;

      try {
        await axios.post(`/api/minecraft-serverapi/${this.selectedServerForPlugins}/plugin/${plugin.name}/disable`);
        alert(`Plugin ${plugin.name} disabled successfully`);
        this.loadPlugins(); // Refresh the plugin list
      } catch (error) {
        console.error('Failed to disable plugin:', error);
        this.error = 'Failed to disable plugin';
      }
    },

    async enablePlugin(plugin) {
      try {
        await axios.post(`/api/minecraft-serverapi/${this.selectedServerForPlugins}/plugin/${plugin.name}/enable`);
        alert(`Plugin ${plugin.name} enabled successfully`);
        this.loadPlugins(); // Refresh the plugin list
      } catch (error) {
        console.error('Failed to enable plugin:', error);
        this.error = 'Failed to enable plugin';
      }
    },

    async clearEvents() {
      try {
        await axios.delete('/api/minecraft-serverapi/webhooks/events');
        this.webhookEvents = [];
        alert('Events cleared successfully');
      } catch (error) {
        console.error('Failed to clear events:', error);
        this.error = 'Failed to clear events';
      }
    },

    formatUptime(uptime) {
      if (!uptime) return 'Unknown';
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      return `${hours}h ${minutes}m`;
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString();
    },

    getTPSClass(tps) {
      if (tps >= 19) return 'tps-excellent';
      if (tps >= 15) return 'tps-good';
      if (tps >= 10) return 'tps-warning';
      return 'tps-danger';
    },

    clearError() {
      this.error = null;
    }
  }
};
</script>

<style scoped>
.minecraft-serverapi-integration {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.status-card {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #dc3545;
}

.status-card.status-healthy {
  border-left-color: #28a745;
  background-color: #f8fff9;
}

.status-healthy .status-dot {
  background-color: #28a745;
}

.status-unhealthy .status-dot {
  background-color: #dc3545;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-green {
  background-color: #28a745;
}

.dot-red {
  background-color: #dc3545;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.feature-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.feature-card h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.feature-card select {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.server-status, .player-list, .world-list, .plugin-list, .performance-data {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;
}

.status-item, .player-item, .world-item, .plugin-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child, .player-item:last-child, .world-item:last-child, .plugin-item:last-child {
  border-bottom: none;
}

.status-online {
  color: #28a745;
  font-weight: bold;
}

.status-offline {
  color: #dc3545;
  font-weight: bold;
}

.tps-excellent {
  color: #28a745;
  font-weight: bold;
}

.tps-good {
  color: #ffc107;
  font-weight: bold;
}

.tps-warning {
  color: #fd7e14;
  font-weight: bold;
}

.tps-danger {
  color: #dc3545;
  font-weight: bold;
}

.player-info, .world-info, .plugin-info {
  margin-bottom: 8px;
}

.player-info h4, .world-info h4, .plugin-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.player-actions, .world-actions, .plugin-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.webhook-events {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;
}

.no-events {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
}

.event-list {
  max-height: 200px;
  overflow-y: auto;
}

.event-item {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.event-item:last-child {
  border-bottom: none;
}

.event-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-info strong {
  color: #333;
}

.event-info span {
  color: #666;
  font-size: 14px;
}

.event-info small {
  color: #999;
  font-size: 12px;
}

.event-data {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px;
}

.event-data pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.webhook-controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px;
  margin: 20px 0;
}

.error-message h4 {
  margin: 0 0 10px 0;
}

.error-message button {
  background-color: #dc3545;
  margin-top: 10px;
}

.error-message button:hover {
  background-color: #c82333;
}
</style>