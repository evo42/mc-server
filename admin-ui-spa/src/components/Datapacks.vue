<template>
  <div class="datapacks">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>
        <i class="bi bi-box-seam"></i>
        Datapacks for {{ getServerDisplayName(server) }}
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

    <!-- Loading spinner for initial load -->
    <loading-spinner
      v-if="loading && allDatapacks.length === 0"
      loading-text="Loading datapacks..."
      container-class="my-5"
    />

    <div v-if="!loading || allDatapacks.length > 0" class="row">
      <!-- Available Datapacks -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5><i class="bi bi-download"></i> Available Datapacks</h5>
          </div>
          <div class="card-body">
            <div class="input-group mb-3">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input
                type="text"
                class="form-control"
                placeholder="Search datapacks..."
                v-model="searchQuery"
                @input="searchDatapacks"
                :disabled="loading"
              >
            </div>

            <div class="list-group" v-if="filteredDatapacks.length > 0">
              <div
                class="list-group-item d-flex justify-content-between align-items-center"
                v-for="datapack in filteredDatapacks"
                :key="datapack.name"
              >
                <div>
                  <h6 class="mb-1">{{ datapack.name }}</h6>
                  <small class="text-muted">
                    v{{ datapack.version }} | {{ datapack.gameVersion }} | {{ datapack.description }}
                  </small>
                </div>
                <button
                  class="btn btn-sm btn-success"
                  @click="installDatapack(datapack.name, datapack.version)"
                  :disabled="isInstalling(datapack.name) || loading"
                >
                  <span v-if="installing.includes(datapack.name)">
                    <span class="spinner-border spinner-border-sm" role="status"></span>
                    Installing...
                  </span>
                  <span v-else>
                    <i class="bi bi-download"></i> Install
                  </span>
                </button>
              </div>
            </div>
            <div v-else-if="loading" class="text-center py-4 text-muted">
              <div class="spinner-border" role="status"></div>
            </div>
            <div v-else class="text-center py-4 text-muted">
              <i class="bi bi-inbox" style="font-size: 3rem;"></i>
              <p class="mt-2">No datapacks found</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Installed Datapacks -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5><i class="bi bi-check2-circle"></i> Installed Datapacks</h5>
            <button
              class="btn btn-sm btn-primary"
              @click="refreshInstalledDatapacks"
              :disabled="isRefreshing || loading"
            >
              <span v-if="isRefreshing">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                Refreshing...
              </span>
              <span v-else>
                <i class="bi bi-arrow-clockwise"></i> Refresh
              </span>
            </button>
          </div>
          <div class="card-body">
            <div class="list-group" v-if="installedDatapacks.length > 0">
              <div
                class="list-group-item d-flex justify-content-between align-items-center"
                v-for="datapack in installedDatapacks"
                :key="datapack.directory"
              >
                <div>
                  <h6 class="mb-1">{{ datapack.name }}</h6>
                  <small class="text-muted">
                    v{{ datapack.version }} | {{ datapack.gameVersion }}
                  </small>
                </div>
                <button
                  class="btn btn-sm btn-danger"
                  @click="uninstallDatapack(datapack.directory)"
                  :disabled="isUninstalling(datapack.directory) || loading"
                >
                  <span v-if="uninstalling.includes(datapack.directory)">
                    <span class="spinner-border spinner-border-sm" role="status"></span>
                    Uninstalling...
                  </span>
                  <span v-else>
                    <i class="bi bi-trash"></i> Uninstall
                  </span>
                </button>
              </div>
            </div>
            <div v-else-if="loading && allDatapacks.length > 0" class="text-center py-4 text-muted">
              <div class="spinner-border" role="status"></div>
            </div>
            <div v-else class="text-center py-4 text-muted">
              <i class="bi bi-folder-x" style="font-size: 3rem;"></i>
              <p class="mt-2">No datapacks installed</p>
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
  name: 'Datapacks',
  components: {
    LoadingSpinner,
    ErrorDisplay
  },
  props: ['server'],
  data() {
    return {
      searchQuery: '',
      allDatapacks: [],
      installedDatapacks: [],
      filteredDatapacks: [],
      loading: false,
      isRefreshing: false,
      installing: [],
      uninstalling: [],
      error: null,
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

    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;

      try {
        // Load available datapacks
        const availableResponse = await axios.get('/api/datapacks/search');
        this.allDatapacks = availableResponse.data.datapacks;
        this.filteredDatapacks = [...this.allDatapacks];

        // Load installed datapacks for this server
        await this.loadInstalledDatapacks();
      } catch (error) {
        console.error('Error loading data:', error);

        // Check for authentication error specifically
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return; // Don't set error if it's an auth issue
        }

        // Set a user-friendly error message
        this.error = error.response?.data?.error ||
                     error.message ||
                     'Failed to load datapacks. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    async loadInstalledDatapacks() {
      try {
        const response = await axios.get(`/api/datapacks/${this.server}`);
        this.installedDatapacks = response.data.datapacks;
      } catch (error) {
        console.error('Error loading installed datapacks:', error);

        // Check for authentication error specifically
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return; // Don't set error if it's an auth issue
        }

        // Set a user-friendly error message
        this.error = error.response?.data?.error ||
                     error.message ||
                     'Failed to load installed datapacks. Please try again.';
      }
    },
    async installDatapack(name, version) {
      this.installing.push(name);

      try {
        await axios.post(`/api/datapacks/install/${this.server}`, {
          datapackName: name,
          version: version
        });

        // Refresh installed datapacks
        await this.loadInstalledDatapacks();

        // Show success toast notification
        this.$emit('show-toast', `Datapack ${name} installed successfully`, 'success', 'Installation Complete');
      } catch (error) {
        console.error('Error installing datapack:', error);

        // Check for authentication error specifically
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast notification
        const errorMessage = `Error installing ${name}: ${error.response?.data?.error || error.message}`;
        this.$emit('show-toast', errorMessage, 'error', 'Installation Failed');
      } finally {
        this.installing = this.installing.filter(item => item !== name);
      }
    },
    async uninstallDatapack(directory) {
      if (!confirm(`Are you sure you want to uninstall the datapack "${directory}"? This cannot be undone.`)) {
        return;
      }

      this.uninstalling.push(directory);
      try {
        await axios.post(`/api/datapacks/uninstall/${this.server}`, {
          datapackDir: directory
        });

        // Refresh installed datapacks
        await this.loadInstalledDatapacks();

        // Show success toast notification
        this.$emit('show-toast', `Datapack ${directory} uninstalled successfully`, 'success', 'Uninstallation Complete');
      } catch (error) {
        console.error('Error uninstalling datapack:', error);

        // Check for authentication error specifically
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Show error toast notification
        const errorMessage = `Error uninstalling ${directory}: ${error.response?.data?.error || error.message}`;
        this.$emit('show-toast', errorMessage, 'error', 'Uninstallation Failed');
      } finally {
        this.uninstalling = this.uninstalling.filter(item => item !== directory);
      }
    },
    async refreshInstalledDatapacks() {
      this.isRefreshing = true;
      this.error = null;

      try {
        await this.loadInstalledDatapacks();
      } catch (error) {
        console.error('Error refreshing datapacks:', error);

        // Check for authentication error specifically
        if (error.response && error.response.status === 401) {
          this.$emit('auth-error');
          return;
        }

        // Set a user-friendly error message
        this.error = error.response?.data?.error ||
                     error.message ||
                     'Failed to refresh installed datapacks. Please try again.';
      } finally {
        this.isRefreshing = false;
      }
    },
    searchDatapacks() {
      if (!this.searchQuery) {
        this.filteredDatapacks = [...this.allDatapacks];
      } else {
        const query = this.searchQuery.toLowerCase();
        this.filteredDatapacks = this.allDatapacks.filter(dp =>
          dp.name.toLowerCase().includes(query) ||
          dp.description.toLowerCase().includes(query)
        );
      }
    },
    isInstalling(name) {
      return this.installing.includes(name);
    },
    isUninstalling(directory) {
      return this.uninstalling.includes(directory);
    },
    getServerDisplayName(serverName) {
      return this.serverDisplayNames[serverName] || serverName;
    }
  },
  watch: {
    server() {
      if (this.server) {
        this.loadData();
      }
    }
  }
}
</script>

<style scoped>
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

.list-group-item {
  transition: transform 0.1s;
}

.list-group-item:hover {
  transform: translateX(5px);
}
</style>