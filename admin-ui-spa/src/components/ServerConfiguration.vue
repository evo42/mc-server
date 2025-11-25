<template>
  <div class="server-configuration">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-gear"></i>
        Server Configuration for {{ getServerDisplayName(server) }}
        <span class="badge bg-secondary ms-2">{{ server }}</span>
      </h2>
      <button class="btn btn-secondary" @click="$router.go(-1)">
        <i class="bi bi-arrow-left"></i> Back to Servers
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
      v-if="loading"
      loading-text="Loading server configuration..."
      container-class="my-5"
    />

    <!-- Configuration Form -->
    <div v-if="!loading" class="row">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5><i class="bi bi-gear-fill"></i> Server Settings</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveConfiguration">
              <!-- Server Name -->
              <div class="mb-3">
                <label class="form-label">Server Name</label>
                <input
                  type="text"
                  class="form-control"
                  :value="server"
                  readonly
                  disabled
                />
              </div>

              <!-- Server Status -->
              <div class="mb-3">
                <label class="form-label">Current Status</label>
                <input
                  type="text"
                  class="form-control"
                  :value="serverStatus.status"
                  readonly
                  disabled
                />
              </div>

              <!-- Server Memory Settings -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="minMemory" class="form-label">Initial Memory (MB)</label>
                    <input
                      id="minMemory"
                      type="number"
                      class="form-control"
                      v-model="config.minMemory"
                      :min="128"
                      :max="serverMaxMemory"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="maxMemory" class="form-label">Max Memory (MB)</label>
                    <input
                      id="maxMemory"
                      type="number"
                      class="form-control"
                      v-model="config.maxMemory"
                      :min="config.minMemory"
                      :max="32768"  <!-- 32GB max -->
                      required
                    />
                  </div>
                </div>
              </div>

              <!-- Server MOTD -->
              <div class="mb-3">
                <label for="motd" class="form-label">MOTD (Message of the Day)</label>
                <input
                  id="motd"
                  type="text"
                  class="form-control"
                  v-model="config.motd"
                  maxlength="100"
                />
                <div class="form-text">The message shown in the server list</div>
              </div>

              <!-- Online Mode -->
              <div class="mb-3">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="onlineMode"
                    v-model="config.onlineMode"
                  />
                  <label class="form-check-label" for="onlineMode">
                    Online Mode
                  </label>
                </div>
                <div class="form-text">If enabled, players need to authenticate with Mojang</div>
              </div>

              <!-- Player Count Settings -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="maxPlayers" class="form-label">Max Players</label>
                    <input
                      id="maxPlayers"
                      type="number"
                      class="form-control"
                      v-model="config.maxPlayers"
                      :min="1"
                      :max="1000"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="viewDistance" class="form-label">View Distance</label>
                    <input
                      id="viewDistance"
                      type="number"
                      class="form-control"
                      v-model="config.viewDistance"
                      :min="2"
                      :max="32"
                      required
                    />
                  </div>
                </div>
              </div>

              <!-- Level Settings -->
              <div class="mb-3">
                <label for="levelName" class="form-label">World Level Name</label>
                <input
                  id="levelName"
                  type="text"
                  class="form-control"
                  v-model="config.levelName"
                />
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="levelSeed" class="form-label">World Seed</label>
                    <input
                      id="levelSeed"
                      type="text"
                      class="form-control"
                      v-model="config.levelSeed"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="levelType" class="form-label">World Type</label>
                    <select
                      id="levelType"
                      class="form-select"
                      v-model="config.levelType"
                    >
                      <option value="DEFAULT">Default</option>
                      <option value="FLAT">Superflat</option>
                      <option value="LARGE_BIOMES">Large Biomes</option>
                      <option value="AMPLIFIED">Amplified</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Game Mode -->
              <div class="mb-3">
                <label for="gameMode" class="form-label">Game Mode</label>
                <select
                  id="gameMode"
                  class="form-select"
                  v-model="config.gameMode"
                >
                  <option value="survival">Survival</option>
                  <option value="creative">Creative</option>
                  <option value="adventure">Adventure</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>

              <!-- Difficulty -->
              <div class="mb-3">
                <label for="difficulty" class="form-label">Difficulty</label>
                <select
                  id="difficulty"
                  class="form-select"
                  v-model="config.difficulty"
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <!-- Buttons -->
              <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <button
                  type="button"
                  class="btn btn-secondary me-md-2"
                  @click="resetToDefaults"
                >
                  Reset to Defaults
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="saving"
                >
                  <span v-if="saving">
                    <span class="spinner-border spinner-border-sm" role="status"></span>
                    Saving...
                  </span>
                  <span v-else>
                    <i class="bi bi-floppy"></i> Save Configuration
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Server Actions Card -->
    <div class="row mt-4">
      <div class="col-md-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5><i class="bi bi-lightning-charge"></i> Server Actions</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3 mb-md-0">
                <button
                  class="btn btn-success w-100"
                  @click="startServer"
                  :disabled="serverStatus.status === 'running' || operationPending"
                >
                  <i class="bi bi-play-circle"></i> Start Server
                </button>
              </div>
              <div class="col-md-6">
                <button
                  class="btn btn-danger w-100"
                  @click="stopServer"
                  :disabled="serverStatus.status !== 'running' || operationPending"
                >
                  <i class="bi bi-x-circle"></i> Stop Server
                </button>
              </div>
            </div>
            <div class="row mt-2">
              <div class="col-12">
                <button
                  class="btn btn-warning w-100"
                  @click="restartServer"
                  :disabled="operationPending"
                >
                  <i class="bi bi-arrow-repeat"></i> Restart Server
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner.vue';
import ErrorDisplay from './ErrorDisplay.vue';

export default {
  name: 'ServerConfiguration',
  components: {
    LoadingSpinner,
    ErrorDisplay
  },
  props: ['server'],
  data() {
    return {
      loading: false,
      saving: false,
      error: null,
      operationPending: false,
      serverStatus: {
        status: 'unknown'
      },
      config: {
        minMemory: 1024,
        maxMemory: 4096,
        motd: '',
        onlineMode: true,
        maxPlayers: 20,
        viewDistance: 10,
        levelName: 'world',
        levelSeed: '',
        levelType: 'DEFAULT',
        gameMode: 'survival',
        difficulty: 'normal'
      },
      serverMaxMemory: 32768, // 32GB default
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
  async mounted() {
    if (!this.server) {
      // If no server specified, redirect to server list
      this.$router.push('/');
      return;
    }

    await this.loadServerConfiguration();
    await this.loadServerStatus();
  },
  methods: {
    async loadServerConfiguration() {
      this.loading = true;
      this.error = null;

      try {
        // In a real implementation, we would fetch the server's configuration
        // For now, we'll load defaults and let them be edited

        // Try to get memory settings from environment or docker config
        const memoryResponse = await axios.get(`/api/servers/config/${this.server}`);
        this.config = {
          ...this.config,
          ...memoryResponse.data
        };
      } catch (error) {
        console.error('Error loading server configuration:', error);

        // Use default configuration if API is not available
        this.config = {
          minMemory: 1024,
          maxMemory: 4096,
          motd: `Welcome to ${this.server} server!`,
          onlineMode: true,
          maxPlayers: 20,
          viewDistance: 10,
          levelName: 'world',
          levelSeed: '',
          levelType: 'DEFAULT',
          gameMode: 'survival',
          difficulty: 'normal'
        };
      } finally {
        this.loading = false;
      }
    },
    async loadServerStatus() {
      try {
        const response = await axios.get(`/api/servers/status/${this.server}`);
        this.serverStatus = response.data;
      } catch (error) {
        console.error('Error loading server status:', error);
      }
    },
    async saveConfiguration() {
      this.saving = true;
      this.error = null;

      try {
        // In a real implementation, we would send the configuration to be saved
        // and potentially restart the server for settings to take effect
        await axios.post(`/api/servers/config/${this.server}`, this.config);

        // Show success toast
        this.$emit('show-toast', 'Server configuration saved successfully', 'success', 'Configuration Saved');
      } catch (error) {
        console.error('Error saving configuration:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast
        this.error = error.response?.data?.error || error.message || 'Failed to save configuration';
        this.$emit('show-toast', this.error, 'error', 'Save Failed');
      } finally {
        this.saving = false;
      }
    },
    resetToDefaults() {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        this.config = {
          minMemory: 1024,
          maxMemory: 4096,
          motd: `Welcome to ${this.server} server!`,
          onlineMode: true,
          maxPlayers: 20,
          viewDistance: 10,
          levelName: 'world',
          levelSeed: '',
          levelType: 'DEFAULT',
          gameMode: 'survival',
          difficulty: 'normal'
        };
      }
    },
    async startServer() {
      this.operationPending = true;

      try {
        await axios.post(`/api/servers/start/${this.server}`);

        // Refresh status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);

        // Show success toast
        this.$emit('show-toast', `Server ${this.server} started successfully`, 'success', 'Server Started');
      } catch (error) {
        console.error('Error starting server:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast
        const errorMessage = `Error starting ${this.server}: ${error.response?.data?.error || error.message}`;
        this.$emit('show-toast', errorMessage, 'error', 'Start Failed');
      } finally {
        this.operationPending = false;
      }
    },
    async stopServer() {
      this.operationPending = true;

      try {
        await axios.post(`/api/servers/stop/${this.server}`);

        // Refresh status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);

        // Show success toast
        this.$emit('show-toast', `Server ${this.server} stopped successfully`, 'success', 'Server Stopped');
      } catch (error) {
        console.error('Error stopping server:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast
        const errorMessage = `Error stopping ${this.server}: ${error.response?.data?.error || error.message}`;
        this.$emit('show-toast', errorMessage, 'error', 'Stop Failed');
      } finally {
        this.operationPending = false;
      }
    },
    async restartServer() {
      this.operationPending = true;

      try {
        await axios.post(`/api/servers/restart/${this.server}`);

        // Refresh status after a short delay
        setTimeout(() => this.loadServerStatus(), 1000);

        // Show success toast
        this.$emit('show-toast', `Server ${this.server} restarted successfully`, 'success', 'Server Restarted');
      } catch (error) {
        console.error('Error restarting server:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast
        const errorMessage = `Error restarting ${this.server}: ${error.response?.data?.error || error.message}`;
        this.$emit('show-toast', errorMessage, 'error', 'Restart Failed');
      } finally {
        this.operationPending = false;
      }
    },
    getServerDisplayName(serverName) {
      return this.serverDisplayNames[serverName] || serverName;
    }
  },
  watch: {
    server() {
      if (this.server) {
        this.loadServerConfiguration();
        this.loadServerStatus();
      }
    }
  }
}
</script>