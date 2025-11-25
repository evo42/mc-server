<template>
  <div class="stats-3d-visualization">
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="bi bi-globe-americas"></i>
          3D Performance Visualization
        </h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-8">
            <div ref="visualizationContainer" class="visualization-container">
              <canvas ref="rendererCanvas" class="three-canvas"></canvas>
            </div>
          </div>
          <div class="col-md-4">
            <div class="server-stats-panel">
              <h6>Server Status</h6>
              <div v-for="(server, name) in serverStatus" :key="name" class="server-stat-item">
                <div class="d-flex justify-content-between">
                  <span class="server-name">{{ getServerDisplayName(name) }}</span>
                  <span :class="getStatusBadgeClass(server.status)" class="badge">
                    {{ server.status }}
                  </span>
                </div>
                <div class="progress mt-1" style="height: 8px;">
                  <div
                    class="progress-bar"
                    :class="getPerformanceClass(server.cpu)"
                    :style="{ width: getCPUPercentage(server.cpu) + '%' }"
                  ></div>
                </div>
                <small class="text-muted">
                  CPU: {{ server.cpu }} | Mem: {{ server.memory }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';

export default {
  name: 'Stats3DVisualization',
  props: {
    serverStatus: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      serverCubes: {},
      animationId: null,
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
  mounted() {
    this.initThreeJS();
    this.animate();
  },
  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  },
  methods: {
    initThreeJS() {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf8f9fa);

      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.$refs.visualizationContainer.clientWidth / this.$refs.visualizationContainer.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 15;

      // Create renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.$refs.rendererCanvas,
        antialias: true
      });
      this.renderer.setSize(
        this.$refs.visualizationContainer.clientWidth,
        this.$refs.visualizationContainer.clientHeight
      );
      this.renderer.setPixelRatio(window.devicePixelRatio);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 20, 15);
      this.scene.add(directionalLight);

      // Add event listeners for window resize
      window.addEventListener('resize', this.onWindowResize);

      // Create cubes for each server
      this.createServerCubes();
    },

    createServerCubes() {
      // Calculate positions in a grid
      const serverNames = Object.keys(this.serverStatus);
      const gridSize = Math.ceil(Math.sqrt(serverNames.length));

      serverNames.forEach((serverName, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        // Position cubes in a grid
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = this.getServerMaterial(this.serverStatus[serverName]);

        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = (col - (gridSize - 1) / 2) * 4;
        cube.position.y = (row - (gridSize - 1) / 2) * 4;
        cube.userData = { serverName };

        this.scene.add(cube);
        this.serverCubes[serverName] = cube;
      });
    },

    getServerMaterial(serverStatus) {
      let color = 0x0d6efd; // Default blue

      if (serverStatus.status === 'running') {
        // Use CPU percentage to determine color (green to red)
        const cpuPercentage = this.getCPUPercentage(serverStatus.cpu);
        if (cpuPercentage < 50) {
          color = 0x198754; // Green
        } else if (cpuPercentage < 80) {
          color = 0x20c997; // Teal
        } else {
          color = 0xdc3545; // Red
        }
      } else {
        color = 0x6c757d; // Gray for stopped servers
      }

      return new THREE.MeshPhongMaterial({
        color: color,
        shininess: 100,
        transparent: true,
        opacity: 0.8
      });
    },

    getCPUPercentage(cpuString) {
      if (!cpuString || typeof cpuString !== 'string' || !cpuString.includes('%')) {
        return 0;
      }
      return parseFloat(cpuString.replace('%', '')) || 0;
    },

    getPerformanceClass(cpuString) {
      const cpuPercentage = this.getCPUPercentage(cpuString);
      if (cpuPercentage < 50) return 'bg-success';
      if (cpuPercentage < 80) return 'bg-warning';
      return 'bg-danger';
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
    },

    onWindowResize() {
      if (this.camera && this.renderer && this.$refs.visualizationContainer) {
        this.camera.aspect = this.$refs.visualizationContainer.clientWidth / this.$refs.visualizationContainer.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(
          this.$refs.visualizationContainer.clientWidth,
          this.$refs.visualizationContainer.clientHeight
        );
      }
    },

    animate() {
      this.animationId = requestAnimationFrame(this.animate);

      // Rotate cubes
      Object.values(this.serverCubes).forEach(cube => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      });

      // Update camera position slightly to create movement effect
      if (this.camera) {
        this.camera.position.x = 15 * Math.sin(Date.now() * 0.0005);
        this.camera.position.z = 15 * Math.cos(Date.now() * 0.0005);
        this.camera.lookAt(this.scene.position);
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    },

    updateVisualization() {
      // Update cube materials based on server status
      Object.entries(this.serverStatus).forEach(([serverName, status]) => {
        const cube = this.serverCubes[serverName];
        if (cube) {
          cube.material = this.getServerMaterial(status);
        }
      });
    }
  },
  watch: {
    serverStatus: {
      handler() {
        // Rebuild visualization when server status changes
        if (this.scene) {
          // Remove old cubes
          Object.values(this.serverCubes).forEach(cube => {
            this.scene.remove(cube);
          });
          this.serverCubes = {};

          // Create new cubes
          this.createServerCubes();
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.visualization-container {
  height: 500px;
  position: relative;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  overflow: hidden;
}

.three-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.server-stats-panel {
  max-height: 500px;
  overflow-y: auto;
  padding: 0.5rem;
}

.server-stat-item {
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.server-stat-item:last-child {
  border-bottom: none;
}

.server-name {
  font-weight: 500;
}

.progress {
  height: 8px;
}

.stats-3d-visualization .card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}
</style>