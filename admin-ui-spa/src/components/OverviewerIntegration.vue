<template>
  <div class="overviewer-integration">
    <h2>🗺️ Minecraft World Mapping</h2>

    <!-- Overviewer Service Status -->
    <div class="status-card" :class="{ 'status-healthy': overviewerStatus, 'status-unhealthy': !overviewerStatus }">
      <h3>Overviewer Service Status</h3>
      <div class="status-indicator">
        <span class="status-dot" :class="{ 'dot-green': overviewerStatus, 'dot-red': !overviewerStatus }"></span>
        <span>{{ overviewerStatus ? 'Ready' : 'Unavailable' }}</span>
        <button @click="checkOverviewerHealth" :disabled="isChecking">
          {{ isChecking ? 'Checking...' : 'Check Status' }}
        </button>
      </div>
    </div>

    <!-- World Selection and Rendering -->
    <div v-if="overviewerStatus" class="features-grid">
      <!-- World Detection -->
      <div class="feature-card">
        <h3>🌍 Available Worlds</h3>
        <button @click="loadWorlds" :disabled="loadingWorlds">
          {{ loadingWorlds ? 'Loading...' : 'Refresh Worlds' }}
        </button>
        <div v-if="worldsLoading" class="loading">Scanning for Minecraft worlds...</div>
        <div v-else-if="worlds.length > 0" class="world-list">
          <div v-for="world in worlds" :key="world.server" class="world-item">
            <div class="world-info">
              <h4>{{ world.server }}</h4>
              <p>Path: {{ world.worldPath }}</p>
              <small>
                Status:
                <span :class="world.accessible ? 'status-accessible' : 'status-inaccessible'">
                  {{ world.accessible ? 'Accessible' : 'Not Accessible' }}
                </span>
              </small>
              <div v-if="world.error" class="error-small">⚠️ {{ world.error }}</div>
            </div>
            <div class="world-actions">
              <button
                @click="renderWorld(world)"
                :disabled="!world.accessible || renderingWorlds.has(world.server)"
              >
                {{ renderingWorlds.has(world.server) ? 'Rendering...' : 'Render Map' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-worlds">
          No worlds found. Make sure Minecraft servers are running and world directories are accessible.
        </div>
      </div>

      <!-- Active Render Jobs -->
      <div class="feature-card">
        <h3>⚡ Active Render Jobs</h3>
        <button @click="loadJobs" :disabled="loadingJobs">
          {{ loadingJobs ? 'Loading...' : 'Refresh Jobs' }}
        </button>
        <div v-if="renderJobs.length === 0" class="no-jobs">
          No active render jobs
        </div>
        <div v-else class="job-list">
          <div v-for="job in renderJobs" :key="job.id" class="job-item">
            <div class="job-info">
              <h4>{{ job.server }} - {{ job.world }}</h4>
              <p>Status:
                <span :class="getJobStatusClass(job.status)">{{ job.status }}</span>
              </p>
              <small>Started: {{ formatTime(job.startTime) }}</small>
              <div v-if="job.estimatedDuration" class="estimate">
                Estimated: {{ formatDuration(job.estimatedDuration) }}
              </div>
            </div>
            <div class="job-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: job.progress + '%' }"
                  :class="getProgressClass(job.status)"
                ></div>
              </div>
              <span class="progress-text">{{ job.progress }}%</span>
            </div>
            <div class="job-actions">
              <button
                v-if="['pending', 'running'].includes(job.status)"
                @click="cancelJob(job.id)"
                class="btn-cancel"
              >
                Cancel
              </button>
              <button
                v-if="job.status === 'completed'"
                @click="viewMap(job.server, job.world)"
                class="btn-view"
              >
                View Map
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rendered Maps -->
      <div class="feature-card">
        <h3>🗺️ Rendered Maps</h3>
        <div class="server-selector">
          <select v-model="selectedServerForMaps" @change="loadMaps">
            <option value="">Select Server</option>
            <option v-for="server in servers" :key="server" :value="server">
              {{ server }}
            </option>
          </select>
          <button @click="loadMaps" :disabled="!selectedServerForMaps || loadingMaps">
            {{ loadingMaps ? 'Loading...' : 'Load Maps' }}
          </button>
        </div>
        <div v-if="mapsLoading" class="loading">Loading maps...</div>
        <div v-else-if="maps.length > 0" class="map-list">
          <div v-for="map in maps" :key="map.world" class="map-item">
            <div class="map-info">
              <h4>{{ map.world }}</h4>
              <p>Rendered:
                <span :class="map.rendered ? 'status-rendered' : 'status-rendering'">
                  {{ map.rendered ? 'Yes' : 'No' }}
                </span>
              </p>
              <small v-if="map.modified">Modified: {{ formatTime(map.modified) }}</small>
              <div v-if="map.error" class="error-small">⚠️ {{ map.error }}</div>
            </div>
            <div class="map-actions">
              <button
                v-if="map.rendered"
                @click="viewMap(map.server, map.world)"
                class="btn-view"
              >
                View Map
              </button>
              <button
                v-if="map.rendered"
                @click="makePublic(map)"
                :class="map.public ? 'btn-public-active' : 'btn-public'"
              >
                {{ map.public ? 'Public ✓' : 'Make Public' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="selectedServerForMaps" class="no-maps">
          No rendered maps found for {{ selectedServerForMaps }}
        </div>
      </div>

      <!-- Public Maps Gallery -->
      <div class="feature-card">
        <h3>🌐 Public Maps Gallery</h3>
        <button @click="loadPublicMaps" :disabled="loadingPublic">
          {{ loadingPublic ? 'Loading...' : 'Refresh Gallery' }}
        </button>
        <div v-if="publicMaps.length === 0" class="no-public-maps">
          No public maps available
        </div>
        <div v-else class="public-map-grid">
          <div v-for="map in publicMaps" :key="map.id" class="public-map-card">
            <div class="map-thumbnail">
              <div class="thumbnail-placeholder">
                <span class="map-icon">🗺️</span>
              </div>
            </div>
            <div class="map-info">
              <h4>{{ map.title }}</h4>
              <p>{{ map.description }}</p>
              <small>Server: {{ map.server }} | World: {{ map.world }}</small>
            </div>
            <div class="map-actions">
              <a :href="map.publicUrl" target="_blank" class="btn-view">
                View Public Map
              </a>
              <button
                @click="removePublic(map.server, map.world)"
                class="btn-remove-public"
              >
                Remove Public
              </button>
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
  name: 'OverviewerIntegration',
  data() {
    return {
      overviewerStatus: false,
      isChecking: false,
      worlds: [],
      renderJobs: [],
      maps: [],
      publicMaps: [],
      servers: [
        'mc-ilias',
        'mc-niilo',
        'mc-bgstpoelten',
        'mc-htlstp',
        'mc-borgstpoelten',
        'mc-hakstpoelten',
        'mc-basop-bafep-stp',
        'mc-play'
      ],
      selectedServerForMaps: '',
      loadingWorlds: false,
      loadingJobs: false,
      loadingMaps: false,
      loadingPublic: false,
      renderingWorlds: new Set(),
      error: null
    };
  },
  mounted() {
    this.checkOverviewerHealth();
    this.loadJobs();
    // Auto-refresh jobs every 30 seconds
    setInterval(() => {
      if (this.overviewerStatus) {
        this.loadJobs();
      }
    }, 30000);
  },
  methods: {
    async checkOverviewerHealth() {
      this.isChecking = true;
      try {
        const response = await axios.get('/api/overviewer/health');
        this.overviewerStatus = response.data.success;
      } catch (error) {
        console.error('Overviewer health check failed:', error);
        this.overviewerStatus = false;
        this.error = 'Failed to connect to Overviewer service';
      } finally {
        this.isChecking = false;
      }
    },

    async loadWorlds() {
      this.loadingWorlds = true;
      try {
        const response = await axios.get('/api/overviewer/worlds');
        this.worlds = response.data.worlds || [];
      } catch (error) {
        console.error('Failed to load worlds:', error);
        this.error = 'Failed to load worlds';
      } finally {
        this.loadingWorlds = false;
      }
    },

    async loadJobs() {
      this.loadingJobs = true;
      try {
        const response = await axios.get('/api/overviewer/jobs');
        this.renderJobs = response.data.jobs || [];
      } catch (error) {
        console.error('Failed to load jobs:', error);
        this.error = 'Failed to load render jobs';
      } finally {
        this.loadingJobs = false;
      }
    },

    async loadMaps() {
      if (!this.selectedServerForMaps) return;

      this.loadingMaps = true;
      try {
        const response = await axios.get(`/api/overviewer/maps/${this.selectedServerForMaps}`);
        this.maps = response.data.maps || [];
      } catch (error) {
        console.error('Failed to load maps:', error);
        this.error = 'Failed to load maps';
      } finally {
        this.loadingMaps = false;
      }
    },

    async loadPublicMaps() {
      this.loadingPublic = true;
      try {
        const response = await axios.get('/api/overviewer/public');
        this.publicMaps = response.data.publicMaps || [];
      } catch (error) {
        console.error('Failed to load public maps:', error);
        this.error = 'Failed to load public maps';
      } finally {
        this.loadingPublic = false;
      }
    },

    async renderWorld(world) {
      this.renderingWorlds.add(world.server);
      try {
        const response = await axios.post(`/api/overviewer/render/${world.server}/${world.world}`, {
          rendermode: 'lighting',
          forcerender: false
        });

        alert(`Render job started: ${response.data.jobId}`);
        this.loadJobs(); // Refresh job list
      } catch (error) {
        console.error('Failed to start render:', error);
        this.error = 'Failed to start render job';
      } finally {
        this.renderingWorlds.delete(world.server);
      }
    },

    async cancelJob(jobId) {
      if (!confirm('Are you sure you want to cancel this render job?')) return;

      try {
        await axios.post(`/api/overviewer/cancel/${jobId}`);
        this.loadJobs(); // Refresh job list
      } catch (error) {
        console.error('Failed to cancel job:', error);
        this.error = 'Failed to cancel render job';
      }
    },

    viewMap(server, world) {
      const mapUrl = `/overviewer/${server}/${world}/index.html`;
      window.open(mapUrl, '_blank');
    },

    async makePublic(map) {
      try {
        const title = prompt('Enter map title:', `${map.server} - ${map.world}`);
        const description = prompt('Enter description:', 'Minecraft World Map');

        if (title !== null) {
          await axios.post(`/api/overviewer/public/${map.server}/${map.world}`, {
            title,
            description
          });
          alert('Map is now public!');
          this.loadPublicMaps(); // Refresh public maps
        }
      } catch (error) {
        console.error('Failed to make map public:', error);
        this.error = 'Failed to make map public';
      }
    },

    async removePublic(server, world) {
      if (!confirm('Remove public access from this map?')) return;

      try {
        await axios.delete(`/api/overviewer/public/${server}/${world}`);
        this.loadPublicMaps(); // Refresh public maps
      } catch (error) {
        console.error('Failed to remove public access:', error);
        this.error = 'Failed to remove public access';
      }
    },

    getJobStatusClass(status) {
      const statusClasses = {
        'pending': 'status-pending',
        'running': 'status-running',
        'completed': 'status-completed',
        'error': 'status-error',
        'cancelled': 'status-cancelled'
      };
      return statusClasses[status] || 'status-unknown';
    },

    getProgressClass(status) {
      const progressClasses = {
        'pending': 'progress-pending',
        'running': 'progress-running',
        'completed': 'progress-completed',
        'error': 'progress-error',
        'cancelled': 'progress-cancelled'
      };
      return progressClasses[status] || 'progress-unknown';
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString();
    },

    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    },

    clearError() {
      this.error = null;
    }
  }
};
</script>

<style scoped>
.overviewer-integration {
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
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
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
  margin-bottom: 15px;
  color: #333;
}

.world-list, .job-list, .map-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;
}

.world-item, .job-item, .map-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.world-item:last-child, .job-item:last-child, .map-item:last-child {
  border-bottom: none;
}

.world-info h4, .job-info h4, .map-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.world-info p, .job-info p, .map-info p {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #666;
}

.status-accessible {
  color: #28a745;
  font-weight: bold;
}

.status-inaccessible {
  color: #dc3545;
  font-weight: bold;
}

.status-rendered {
  color: #28a745;
  font-weight: bold;
}

.status-rendering {
  color: #ffc107;
  font-weight: bold;
}

.status-pending {
  color: #6c757d;
  font-weight: bold;
}

.status-running {
  color: #007bff;
  font-weight: bold;
}

.status-completed {
  color: #28a745;
  font-weight: bold;
}

.status-error {
  color: #dc3545;
  font-weight: bold;
}

.status-cancelled {
  color: #fd7e14;
  font-weight: bold;
}

.error-small {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

.job-progress {
  margin: 10px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-pending {
  background-color: #6c757d;
}

.progress-running {
  background-color: #007bff;
}

.progress-completed {
  background-color: #28a745;
}

.progress-error {
  background-color: #dc3545;
}

.progress-cancelled {
  background-color: #fd7e14;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.server-selector {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.server-selector select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.public-map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.public-map-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  transition: transform 0.2s ease;
}

.public-map-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.map-thumbnail {
  margin-bottom: 10px;
}

.thumbnail-placeholder {
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-icon {
  font-size: 36px;
  color: white;
}

.map-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

button, .btn-view, .btn-public, .btn-public-active, .btn-cancel, .btn-remove-public {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

button:hover:not(:disabled), .btn-view:hover, .btn-public:hover, .btn-remove-public:hover {
  opacity: 0.9;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-view {
  background-color: #007bff;
  color: white;
}

.btn-public {
  background-color: #28a745;
  color: white;
}

.btn-public-active {
  background-color: #17a2b8;
  color: white;
}

.btn-cancel {
  background-color: #dc3545;
  color: white;
}

.btn-remove-public {
  background-color: #fd7e14;
  color: white;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.no-worlds, .no-jobs, .no-maps, .no-public-maps {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 10px 0;
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
