import { defineStore } from 'pinia';
import axios from 'axios';

export const useServerStore = defineStore('server', {
  state: () => ({
    servers: {},
    serverStatus: {},
    datapacks: {},
    loading: false,
    error: null,
    lastUpdated: null
  }),
  
  getters: {
    runningServersCount: (state) => {
      return Object.values(state.servers).filter(server => server.status === 'running').length;
    },
    overallCPULoad: (state) => {
      const cpus = Object.values(state.servers)
        .map(server => parseFloat(server.cpu.replace('%', '')) || 0)
        .filter(cpu => !isNaN(cpu));
      
      if (cpus.length === 0) return 0;
      
      const avg = cpus.reduce((a, b) => a + b, 0) / cpus.length;
      return avg;
    },
    totalPlayers: (state) => {
      return Object.values(state.servers)
        .map(server => server.playerCount || 0)
        .reduce((a, b) => a + b, 0);
    },
    getServerById: (state) => {
      return (serverId) => state.servers[serverId];
    },
    getDatapacksByServer: (state) => {
      return (serverId) => state.datapacks[serverId] || [];
    }
  },
  
  actions: {
    // Load all server statuses
    async loadServerStatus() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get('/api/servers/status');
        this.servers = response.data;
        this.lastUpdated = new Date().toISOString();
      } catch (error) {
        console.error('Error loading server status:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Load specific server status
    async loadServerStatusById(serverId) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`/api/servers/status/${serverId}`);
        this.servers = { ...this.servers, [serverId]: response.data };
      } catch (error) {
        console.error(`Error loading status for ${serverId}:`, error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Start a server
    async startServer(serverId) {
      this.loading = true;
      this.error = null;
      
      try {
        await axios.post(`/api/servers/start/${serverId}`);
        // Refresh the specific server's status
        await this.loadServerStatusById(serverId);
      } catch (error) {
        console.error(`Error starting ${serverId}:`, error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Stop a server
    async stopServer(serverId) {
      this.loading = true;
      this.error = null;
      
      try {
        await axios.post(`/api/servers/stop/${serverId}`);
        // Refresh the specific server's status
        await this.loadServerStatusById(serverId);
      } catch (error) {
        console.error(`Error stopping ${serverId}:`, error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Restart a server
    async restartServer(serverId) {
      this.loading = true;
      this.error = null;
      
      try {
        await axios.post(`/api/servers/restart/${serverId}`);
        // Refresh the specific server's status
        await this.loadServerStatusById(serverId);
      } catch (error) {
        console.error(`Error restarting ${serverId}:`, error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Load datapacks for a server
    async loadDatapacks(serverId) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`/api/datapacks/${serverId}`);
        this.datapacks = { ...this.datapacks, [serverId]: response.data.datapacks };
      } catch (error) {
        console.error(`Error loading datapacks for ${serverId}:`, error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Install a datapack
    async installDatapack(serverId, datapackName, version) {
      this.loading = true;
      this.error = null;
      
      try {
        await axios.post(`/api/datapacks/install/${serverId}`, {
          datapackName,
          version
        });
        // Refresh the server's datapacks
        await this.loadDatapacks(serverId);
      } catch (error) {
        console.error(`Error installing datapack on ${serverId}:`, error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Uninstall a datapack
    async uninstallDatapack(serverId, datapackDir) {
      this.loading = true;
      this.error = null;
      
      try {
        await axios.post(`/api/datapacks/uninstall/${serverId}`, {
          datapackDir
        });
        // Refresh the server's datapacks
        await this.loadDatapacks(serverId);
      } catch (error) {
        console.error(`Error uninstalling datapack from ${serverId}:`, error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Reset error state
    clearError() {
      this.error = null;
    }
  }
});