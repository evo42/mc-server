<template>
  <div class="mcdash-integration">
    <h2>MCDash Integration</h2>

    <!-- MCDash Service Status -->
    <div class="status-card" :class="{ 'status-healthy': mcdashStatus, 'status-unhealthy': !mcdashStatus }">
      <h3>MCDash Service Status</h3>
      <div class="status-indicator">
        <span class="status-dot" :class="{ 'dot-green': mcdashStatus, 'dot-red': !mcdashStatus }"></span>
        <span>{{ mcdashStatus ? 'Connected' : 'Disconnected' }}</span>
        <button @click="checkMCDashHealth" :disabled="isChecking">
          {{ isChecking ? 'Checking...' : 'Check Status' }}
        </button>
      </div>
    </div>

    <!-- MCDash Features -->
    <div v-if="mcdashStatus" class="features-grid">
      <!-- File Browser -->
      <div class="feature-card">
        <h3>📁 File Browser</h3>
        <p>Browse server files and directories</p>
        <select v-model="selectedServerForFiles" @change="loadFiles">
          <option value="">Select Server</option>
          <option v-for="server in servers" :key="server" :value="server">
            {{ server }}
          </option>
        </select>
        <div v-if="fileBrowserLoading" class="loading">Loading files...</div>
        <div v-else-if="files.length > 0" class="file-list">
          <div v-for="file in files" :key="file.path" class="file-item">
            <i :class="file.isDirectory ? 'fas fa-folder' : 'fas fa-file'"></i>
            <span>{{ file.name }}</span>
          </div>
        </div>
      </div>

      <!-- Console Access -->
      <div class="feature-card">
        <h3>💬 Console</h3>
        <p>View real-time server console output</p>
        <select v-model="selectedServerForConsole" @change="loadConsole">
          <option value="">Select Server</option>
          <option v-for="server in servers" :key="server" :value="server">
            {{ server }}
          </option>
        </select>
        <div class="console-area">
          <div v-if="consoleLoading" class="loading">Loading console...</div>
          <div v-else-if="consoleOutput.length > 0" class="console-output">
            <div v-for="line in consoleOutput" :key="line.timestamp" class="console-line">
              {{ line.message }}
            </div>
          </div>
        </div>

        <!-- Command Input -->
        <div class="command-input">
          <input
            v-model="commandInput"
            @keyup.enter="sendCommand"
            placeholder="Enter command..."
            :disabled="!selectedServerForConsole"
          >
          <button @click="sendCommand" :disabled="!commandInput || !selectedServerForConsole">
            Send
          </button>
        </div>
      </div>

      <!-- Plugin Store -->
      <div class="feature-card">
        <h3>🔌 Plugin Store</h3>
        <p>Browse and install plugins from SpigotMC</p>
        <div class="search-controls">
          <input v-model="pluginSearch" @input="searchPlugins" placeholder="Search plugins...">
          <select v-model="pluginCategory" @change="searchPlugins">
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div v-if="pluginStoreLoading" class="loading">Loading plugins...</div>
        <div v-else-if="plugins.length > 0" class="plugin-list">
          <div v-for="plugin in plugins" :key="plugin.id" class="plugin-item">
            <div class="plugin-info">
              <h4>{{ plugin.name }}</h4>
              <p>{{ plugin.description }}</p>
              <small>Version: {{ plugin.version }}</small>
            </div>
            <button @click="installPlugin(plugin)" :disabled="installingPlugin === plugin.id">
              {{ installingPlugin === plugin.id ? 'Installing...' : 'Install' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Backup Management -->
      <div class="feature-card">
        <h3>💾 Backup Management</h3>
        <p>Enhanced backup and restore functionality</p>
        <select v-model="selectedServerForBackup" @change="loadBackups">
          <option value="">Select Server</option>
          <option v-for="server in servers" :key="server" :value="server">
            {{ server }}
          </option>
        </select>
        <div class="backup-controls">
          <input v-model="backupName" placeholder="Backup name (optional)">
          <select v-model="backupType">
            <option value="full">Full Backup</option>
            <option value="incremental">Incremental</option>
            <option value="world_only">World Only</option>
          </select>
          <button @click="createBackup" :disabled="!selectedServerForBackup || creatingBackup">
            {{ creatingBackup ? 'Creating...' : 'Create Backup' }}
          </button>
        </div>
        <div v-if="backupLoading" class="loading">Loading backups...</div>
        <div v-else-if="backups.length > 0" class="backup-list">
          <div v-for="backup in backups" :key="backup.name" class="backup-item">
            <div class="backup-info">
              <h4>{{ backup.name }}</h4>
              <p>{{ backup.type }} - {{ backup.size }}</p>
              <small>{{ backup.date }}</small>
            </div>
            <div class="backup-actions">
              <button @click="restoreBackup(backup)">Restore</button>
              <button @click="deleteBackup(backup)">Delete</button>
            </div>
          </div>
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
  name: 'MCDashIntegration',
  data() {
    return {
      mcdashStatus: false,
      isChecking: false,
      selectedServerForFiles: '',
      selectedServerForConsole: '',
      selectedServerForBackup: '',
      files: [],
      consoleOutput: [],
      plugins: [],
      categories: [],
      backups: [],
      fileBrowserLoading: false,
      consoleLoading: false,
      pluginStoreLoading: false,
      backupLoading: false,
      commandInput: '',
      pluginSearch: '',
      pluginCategory: '',
      installingPlugin: null,
      backupName: '',
      backupType: 'full',
      creatingBackup: false,
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
    this.checkMCDashHealth();
  },
  methods: {
    async checkMCDashHealth() {
      this.isChecking = true;
      try {
        const response = await axios.get('/api/mcdash/health');
        this.mcdashStatus = response.data.success;
      } catch (error) {
        console.error('MCDash health check failed:', error);
        this.mcdashStatus = false;
        this.error = 'Failed to connect to MCDash service';
      } finally {
        this.isChecking = false;
      }
    },

    async loadFiles() {
      if (!this.selectedServerForFiles) return;

      this.fileBrowserLoading = true;
      try {
        const response = await axios.get(`/api/mcdash/files/${this.selectedServerForFiles}`);
        this.files = response.data.files || [];
      } catch (error) {
        console.error('Failed to load files:', error);
        this.error = 'Failed to load file browser';
      } finally {
        this.fileBrowserLoading = false;
      }
    },

    async loadConsole() {
      if (!this.selectedServerForConsole) return;

      this.consoleLoading = true;
      try {
        const response = await axios.get(`/api/mcdash/console/${this.selectedServerForConsole}`);
        this.consoleOutput = response.data.console || [];
      } catch (error) {
        console.error('Failed to load console:', error);
        this.error = 'Failed to load console';
      } finally {
        this.consoleLoading = false;
      }
    },

    async sendCommand() {
      if (!this.commandInput || !this.selectedServerForConsole) return;

      try {
        await axios.post(`/api/mcdash/console/${this.selectedServerForConsole}/command`, {
          command: this.commandInput
        });
        this.commandInput = '';
        // Refresh console to show the command result
        this.loadConsole();
      } catch (error) {
        console.error('Failed to send command:', error);
        this.error = 'Failed to send command';
      }
    },

    async searchPlugins() {
      this.pluginStoreLoading = true;
      try {
        const params = {};
        if (this.pluginSearch) params.search = this.pluginSearch;
        if (this.pluginCategory) params.category = this.pluginCategory;

        const response = await axios.get('/api/mcdash/plugins/store', { params });
        this.plugins = response.data.plugins || [];
        this.categories = response.data.categories || [];
      } catch (error) {
        console.error('Failed to search plugins:', error);
        this.error = 'Failed to load plugin store';
      } finally {
        this.pluginStoreLoading = false;
      }
    },

    async installPlugin(plugin) {
      this.installingPlugin = plugin.id;
      try {
        await axios.post(`/api/mcdash/plugins/${this.selectedServerForFiles}/install`, {
          pluginId: plugin.id,
          version: plugin.version
        });
        alert(`Plugin ${plugin.name} installed successfully!`);
      } catch (error) {
        console.error('Failed to install plugin:', error);
        this.error = 'Failed to install plugin';
      } finally {
        this.installingPlugin = null;
      }
    },

    async loadBackups() {
      if (!this.selectedServerForBackup) return;

      this.backupLoading = true;
      try {
        const response = await axios.get(`/api/mcdash/backups/${this.selectedServerForBackup}`);
        this.backups = response.data.backups || [];
      } catch (error) {
        console.error('Failed to load backups:', error);
        this.error = 'Failed to load backups';
      } finally {
        this.backupLoading = false;
      }
    },

    async createBackup() {
      if (!this.selectedServerForBackup) return;

      this.creatingBackup = true;
      try {
        await axios.post(`/api/mcdash/backups/${this.selectedServerForBackup}/create`, {
          name: this.backupName,
          type: this.backupType
        });
        this.backupName = '';
        this.loadBackups(); // Refresh the backup list
        alert('Backup created successfully!');
      } catch (error) {
        console.error('Failed to create backup:', error);
        this.error = 'Failed to create backup';
      } finally {
        this.creatingBackup = false;
      }
    },

    async restoreBackup(backup) {
      if (!confirm(`Are you sure you want to restore backup "${backup.name}"?`)) return;

      try {
        await axios.post(`/api/mcdash/backups/${this.selectedServerForBackup}/restore`, {
          backupName: backup.name
        });
        alert('Backup restored successfully!');
      } catch (error) {
        console.error('Failed to restore backup:', error);
        this.error = 'Failed to restore backup';
      }
    },

    async deleteBackup(backup) {
      if (!confirm(`Are you sure you want to delete backup "${backup.name}"?`)) return;

      try {
        await axios.delete(`/api/mcdash/backups/${this.selectedServerForBackup}/${backup.name}`);
        this.loadBackups(); // Refresh the backup list
        alert('Backup deleted successfully!');
      } catch (error) {
        console.error('Failed to delete backup:', error);
        this.error = 'Failed to delete backup';
      }
    },

    clearError() {
      this.error = null;
    }
  }
};
</script>

<style scoped>
.mcdash-integration {
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

.file-list, .console-output, .plugin-list, .backup-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;
}

.file-item, .console-line, .plugin-item, .backup-item {
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
}

.file-item:last-child, .console-line:last-child, .plugin-item:last-child, .backup-item:last-child {
  border-bottom: none;
}

.command-input {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.command-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-controls {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.search-controls input, .search-controls select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.backup-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 10px 0;
}

.backup-controls input, .backup-controls select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.plugin-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.plugin-info p {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #666;
}

.backup-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.backup-info p {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #666;
}

.backup-actions {
  display: flex;
  gap: 5px;
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