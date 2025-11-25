<template>
  <div class="backup-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-arrow-repeat"></i>
        Backup Management for {{ getServerDisplayName(server) }}
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
      loading-text="Loading backup information..."
      container-class="my-5"
    />

    <div v-if="!loading" class="row">
      <!-- Create Backup Card -->
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <h5><i class="bi bi-cloud-arrow-up"></i> Create Backup</h5>
          </div>
          <div class="card-body">
            <p>Create a new backup of your server data.</p>
            <div class="alert alert-warning" v-if="serverStatus === 'running'">
              <i class="bi bi-exclamation-triangle"></i>
              <strong>Notice:</strong> The server will be temporarily stopped during the backup process to ensure data consistency.
            </div>
          </div>
          <div class="card-footer">
            <button
              class="btn btn-primary w-100"
              @click="createBackup"
              :disabled="isCreatingBackup"
            >
              <span v-if="isCreatingBackup">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                Creating...
              </span>
              <span v-else>
                <i class="bi bi-cloud-arrow-up"></i> Create Backup Now
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Restore Backup Card -->
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <h5><i class="bi bi-cloud-arrow-down"></i> Restore Backup</h5>
          </div>
          <div class="card-body">
            <p>Restore your server from an existing backup.</p>
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle"></i>
              <strong>Warning:</strong> Restoring will overwrite all current server data. This action cannot be undone.
            </div>

            <div class="mb-3">
              <label class="form-label">Select Backup to Restore</label>
              <select
                class="form-select"
                v-model="selectedBackup"
                :disabled="backups.length === 0"
              >
                <option value="" disabled>Select a backup...</option>
                <option
                  v-for="backup in backups"
                  :key="backup.name"
                  :value="backup.name"
                >
                  {{ formatDate(backup.timestamp) }} ({{ formatSize(backup.size) }})
                </option>
              </select>
            </div>
          </div>
          <div class="card-footer">
            <button
              class="btn btn-warning w-100"
              @click="confirmRestore"
              :disabled="!selectedBackup || isRestoringBackup"
            >
              <span v-if="isRestoringBackup">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                Restoring...
              </span>
              <span v-else>
                <i class="bi bi-cloud-arrow-down"></i> Restore Selected Backup
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backups List -->
    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5><i class="bi bi-list"></i> Available Backups</h5>
        <button
          class="btn btn-sm btn-outline-primary"
          @click="loadBackups"
          :disabled="loadingBackups"
        >
          <i class="bi bi-arrow-repeat"></i> Refresh
        </button>
      </div>
      <div class="card-body">
        <div v-if="backups.length === 0" class="text-center py-4">
          <i class="bi bi-cloud h1 text-muted"></i>
          <p class="text-muted">No backups found for this server</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Backup Name</th>
                <th>Date</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="backup in backups" :key="backup.name">
                <td>
                  <i class="bi bi-file-earmark-zip"></i>
                  {{ backup.name }}
                </td>
                <td>{{ formatDate(backup.timestamp) }}</td>
                <td>{{ formatSize(backup.size) }}</td>
                <td>
                  <button
                    class="btn btn-sm btn-danger me-1"
                    @click="confirmDelete(backup.name)"
                    title="Delete backup"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-success"
                    @click="confirmRestoreWithBackup(backup.name)"
                    title="Restore from backup"
                  >
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
  name: 'BackupManagement',
  components: {
    LoadingSpinner,
    ErrorDisplay
  },
  props: ['server'],
  data() {
    return {
      loading: false,
      loadingBackups: false,
      error: null,
      isCreatingBackup: false,
      isRestoringBackup: false,
      isDeletingBackup: false,
      backups: [],
      selectedBackup: '',
      serverStatus: 'unknown',
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

    await this.loadServerStatus();
    await this.loadBackups();
  },
  methods: {
    async loadServerStatus() {
      try {
        const response = await axios.get(`/api/servers/status/${this.server}`);
        this.serverStatus = response.data.status;
      } catch (error) {
        console.error('Error loading server status:', error);
      }
    },
    async loadBackups() {
      this.loadingBackups = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/backup/list/${this.server}`);
        this.backups = response.data.backups;
      } catch (error) {
        console.error('Error loading backups:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        this.error = error.response?.data?.error || error.message || 'Failed to load backups';
        this.$emit('show-toast', this.error, 'error', 'Load Failed');
      } finally {
        this.loadingBackups = false;
      }
    },
    async createBackup() {
      this.isCreatingBackup = true;
      this.error = null;

      try {
        const response = await axios.post(`/api/backup/create/${this.server}`);

        // Show success toast
        this.$emit('show-toast', `Backup created successfully: ${response.data.backupPath}`, 'success', 'Backup Created');

        // Refresh the list of backups
        await this.loadBackups();
      } catch (error) {
        console.error('Error creating backup:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        this.error = error.response?.data?.error || error.message || 'Failed to create backup';
        this.$emit('show-toast', this.error, 'error', 'Creation Failed');
      } finally {
        this.isCreatingBackup = false;
      }
    },
    confirmRestore() {
      if (!this.selectedBackup) {
        this.$emit('show-toast', 'Please select a backup to restore', 'warning', 'Select Backup');
        return;
      }

      this.confirmRestoreWithBackup(this.selectedBackup);
    },
    confirmRestoreWithBackup(backupName) {
      if (!confirm(`Are you sure you want to restore the server from backup "${backupName}"? This will overwrite all current data and cannot be undone.`)) {
        return;
      }

      this.restoreBackup(backupName);
    },
    async restoreBackup(backupName) {
      this.isRestoringBackup = true;
      this.error = null;

      try {
        await axios.post(`/api/backup/restore/${this.server}`, {
          backupName
        });

        // Show success toast
        this.$emit('show-toast', `Backup restored successfully from ${backupName}`, 'success', 'Restore Completed');

        // Refresh the list of backups
        await this.loadBackups();
      } catch (error) {
        console.error('Error restoring backup:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        this.error = error.response?.data?.error || error.message || 'Failed to restore backup';
        this.$emit('show-toast', this.error, 'error', 'Restore Failed');
      } finally {
        this.isRestoringBackup = false;
      }
    },
    confirmDelete(backupName) {
      if (!confirm(`Are you sure you want to delete the backup "${backupName}"? This action cannot be undone.`)) {
        return;
      }

      this.deleteBackup(backupName);
    },
    async deleteBackup(backupName) {
      this.isDeletingBackup = true;
      this.error = null;

      try {
        await axios.post(`/api/backup/delete/${this.server}`, {
          backupName
        });

        // Show success toast
        this.$emit('show-toast', `Backup ${backupName} deleted successfully`, 'success', 'Deletion Completed');

        // Refresh the list of backups
        await this.loadBackups();
      } catch (error) {
        console.error('Error deleting backup:', error);

        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        this.error = error.response?.data?.error || error.message || 'Failed to delete backup';
        this.$emit('show-toast', this.error, 'error', 'Deletion Failed');
      } finally {
        this.isDeletingBackup = false;
      }
    },
    formatDate(timestamp) {
      if (!timestamp) return 'Unknown';

      // Parse the timestamp (in ISO format) and format it nicely
      try {
        const date = new Date(timestamp);
        return date.toLocaleString();
      } catch (e) {
        return timestamp; // Return as-is if parsing fails
      }
    },
    formatSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    getServerDisplayName(serverName) {
      return this.serverDisplayNames[serverName] || serverName;
    }
  },
  watch: {
    server() {
      if (this.server) {
        this.loadServerStatus();
        this.loadBackups();
      }
    }
  }
}
</script>