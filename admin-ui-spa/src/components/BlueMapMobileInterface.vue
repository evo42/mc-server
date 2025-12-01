<template>
  <div class="bluemap-mobile-interface">
    <!-- Mobile Header -->
    <q-header elevated class="mobile-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          @click="$emit('close')"
          class="q-mr-sm"
        />

        <q-toolbar-title>
          <div class="text-h6">{{ selectedServer?.name || 'BlueMap 3D' }}</div>
          <div class="text-caption text-grey-4">
            {{ selectedServer?.serverType }} • {{ currentCoordinates.x }}, {{ currentCoordinates.z }}
          </div>
        </q-toolbar-title>

        <q-btn
          flat
          dense
          round
          icon="more_vert"
          @click="showMobileMenu = true"
        />
      </q-toolbar>
    </q-header>

    <!-- 3D Map Container -->
    <div class="map-container">
      <canvas
        ref="mobileMapCanvas"
        id="mobile-3d-map"
        :class="{ 'webgl-error': !webGLSupported }"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @click="handleMapClick"
      ></canvas>

      <!-- Mobile Controls Overlay -->
      <div v-if="webGLSupported && selectedServer" class="mobile-controls">
        <!-- Zoom Controls -->
        <div class="zoom-controls">
          <q-btn
            fab
            mini
            color="primary"
            icon="zoom_in"
            @click="zoomIn"
            :disable="!canZoomIn"
            class="zoom-btn"
          />
          <q-btn
            fab
            mini
            color="primary"
            icon="zoom_out"
            @click="zoomOut"
            :disable="!canZoomOut"
            class="zoom-btn q-mt-xs"
          />
        </div>

        <!-- Navigation Controls -->
        <div class="nav-controls">
          <q-btn
            fab
            mini
            color="secondary"
            icon="navigation"
            @click="centerOnSpawn"
            class="nav-btn"
          />
          <q-btn
            fab
            mini
            color="secondary"
            icon="my_location"
            @click="centerOnPlayer"
            class="nav-btn q-mt-xs"
          />
        </div>

        <!-- View Mode Toggle -->
        <div class="view-controls">
          <q-btn-toggle
            v-model="mobileViewMode"
            :options="[
              {label: '3D', value: '3d', icon: '3d_rotation'},
              {label: '2D', value: '2d', icon: 'map'}
            ]"
            color="accent"
            size="sm"
            @update:model-value="switchMobileViewMode"
          />
        </div>
      </div>

      <!-- WebGL Error Message -->
      <div v-else-if="!webGLSupported" class="webgl-error-overlay">
        <q-icon name="warning" size="lg" color="warning" />
        <div class="text-h6 q-mt-md">3D Map Not Supported</div>
        <div class="text-body2 text-center">
          Your device doesn't support WebGL required for 3D maps.
          <br />Please use a newer device or browser.
        </div>
        <q-btn
          color="primary"
          label="Try 2D View"
          @click="mobileViewMode = '2d'"
          class="q-mt-md"
        />
      </div>

      <!-- Loading Overlay -->
      <div v-if="mapLoading" class="loading-overlay">
        <q-spinner-dots size="50px" color="primary" />
        <div class="text-h6 q-mt-md">Loading 3D Map...</div>
        <div class="text-body2 text-grey-6">{{ loadingMessage }}</div>
      </div>
    </div>

    <!-- Mobile Bottom Sheet -->
    <q-bottom-sheet
      v-model="showBottomSheet"
      :max-height="400"
      class="mobile-bottom-sheet"
    >
      <q-list>
        <q-item clickable @click="toggleBottomSheet('serverInfo')">
          <q-item-section avatar>
            <q-icon name="info" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Server Information</q-item-label>
            <q-item-label caption>{{ selectedServer?.serverType }} • {{ selectedServer?.status }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="toggleBottomSheet('performance')">
          <q-item-section avatar>
            <q-icon name="speed" color="secondary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Performance</q-item-label>
            <q-item-label caption>Memory: {{ selectedServer?.memoryUsage }}MB</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="toggleBottomSheet('layers')">
          <q-item-section avatar>
            <q-icon name="layers" color="accent" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Map Layers</q-item-label>
            <q-item-label caption>Toggle visibility layers</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="toggleBottomSheet('search')">
          <q-item-section avatar>
            <q-icon name="search" color="positive" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Search Location</q-item-label>
            <q-item-label caption>Find specific coordinates</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable @click="refreshMap">
          <q-item-section avatar>
            <q-icon name="refresh" color="info" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Refresh Map</q-item-label>
            <q-item-label caption>Reload current area</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="showSettings = true">
          <q-item-section avatar>
            <q-icon name="settings" color="grey-6" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Settings</q-item-label>
            <q-item-label caption>Map preferences</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-bottom-sheet>

    <!-- Mobile Menu Dialog -->
    <q-dialog v-model="showMobileMenu" position="right">
      <q-card style="width: 280px">
        <q-card-section>
          <div class="text-h6">Map Options</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <q-list>
            <q-item clickable @click="changeServer">
              <q-item-section avatar>
                <q-icon name="servers" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Switch Server</q-item-label>
                <q-item-label caption>{{ selectedServer?.name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable @click="toggleFullscreen">
              <q-item-section avatar>
                <q-icon :name="isFullscreen ? 'fullscreen_exit' : 'fullscreen'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable @click="shareLocation">
              <q-item-section avatar>
                <q-icon name="share" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Share Location</q-item-label>
                <q-item-label caption>Share current view</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Server Selection Sheet -->
    <q-dialog v-model="showServerSelection">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Select Server</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list>
            <q-item
              v-for="server in availableServers"
              :key="server.name"
              clickable
              @click="selectServer(server)"
              :class="{ 'bg-primary text-white': server.name === selectedServer?.name }"
            >
              <q-item-section avatar>
                <q-icon :name="getServerIcon(server.name)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ server.name }}</q-item-label>
                <q-item-label caption>{{ server.serverType }} • {{ server.status }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showServerSelection = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettings">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Map Settings</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-gutter-md">
            <q-toggle
              v-model="settings.showCoordinates"
              label="Show Coordinates"
            />

            <q-toggle
              v-model="settings.showPlayerNames"
              label="Show Player Names"
            />

            <q-toggle
              v-model="settings.enableSound"
              label="Enable Sound Effects"
            />

            <q-select
              v-model="settings.quality"
              :options="qualityOptions"
              label="Graphics Quality"
            />

            <q-slider
              v-model="settings.cameraSpeed"
              :min="0.5"
              :max="3"
              :step="0.1"
              label="Camera Speed"
              label-always
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Reset" @click="resetSettings" />
          <q-btn flat label="Cancel" @click="showSettings = false" />
          <q-btn color="primary" label="Save" @click="saveSettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'

export default {
  name: 'BlueMapMobileInterface',

  props: {
    serverName: {
      type: String,
      required: true
    }
  },

  emits: ['close', 'server-change'],

  setup(props, { emit }) {
    const $q = useQuasar()

    // Reactive data
    const mobileMapCanvas = ref(null)
    const showBottomSheet = ref(false)
    const showMobileMenu = ref(false)
    const showServerSelection = ref(false)
    const showSettings = ref(false)
    const mapLoading = ref(true)
    const loadingMessage = ref('Initializing 3D engine...')
    const webGLSupported = ref(true)
    const isFullscreen = ref(false)

    // View modes
    const mobileViewMode = ref('3d')

    // Touch handling
    const touchState = reactive({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      lastPinchDistance: 0
    })

    // Camera state
    const cameraState = reactive({
      x: 0,
      y: 100,
      z: 0,
      rotationY: 0,
      rotationX: 0,
      zoom: 1.0
    })

    // Current position
    const currentCoordinates = reactive({ x: 0, z: 0 })

    // Settings
    const settings = reactive({
      showCoordinates: true,
      showPlayerNames: true,
      enableSound: false,
      quality: 'medium',
      cameraSpeed: 1.0
    })

    const qualityOptions = [
      { label: 'Low (Performance)', value: 'low' },
      { label: 'Medium (Balanced)', value: 'medium' },
      { label: 'High (Quality)', value: 'high' }
    ]

    // Mock server data
    const selectedServer = ref({
      name: props.serverName,
      serverType: 'education',
      status: 'active',
      memoryUsage: 512,
      cacheHitRate: 85
    })

    const availableServers = ref([
      { name: 'mc-basop-bafep-stp', serverType: 'education', status: 'active' },
      { name: 'mc-bgstpoelten', serverType: 'secondary_education', status: 'active' },
      { name: 'mc-borgstpoelten', serverType: 'academic', status: 'active' },
      { name: 'mc-hakstpoelten', serverType: 'university', status: 'active' },
      { name: 'mc-htlstp', serverType: 'technical', status: 'active' },
      { name: 'mc-ilias', serverType: 'specialized', status: 'active' },
      { name: 'mc-niilo', serverType: 'public', status: 'active' }
    ])

    // Computed properties
    const canZoomIn = computed(() => cameraState.zoom < 3.0)
    const canZoomOut = computed(() => cameraState.zoom > 0.3)

    // Methods
    const initializeMobileMap = async () => {
      try {
        await nextTick()

        // Check WebGL support
        webGLSupported.value = checkWebGLSupport()

        if (webGLSupported.value) {
          loadingMessage.value = 'Loading 3D engine...'
          await setupWebGL()

          loadingMessage.value = 'Loading world data...'
          await loadWorldData()

          loadingMessage.value = 'Initializing controls...'
          await initializeControls()

          mapLoading.value = false
          startRenderLoop()

          $q.notify({
            type: 'positive',
            message: '3D Map loaded successfully'
          })
        } else {
          mapLoading.value = false
        }
      } catch (error) {
        console.error('Error initializing mobile map:', error)
        mapLoading.value = false
        $q.notify({
          type: 'negative',
          message: 'Failed to load 3D map',
          caption: error.message
        })
      }
    }

    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        return !!gl
      } catch (error) {
        return false
      }
    }

    const setupWebGL = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock WebGL setup
          console.log('WebGL initialized for mobile')
          resolve()
        }, 500)
      })
    }

    const loadWorldData = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock world data loading
          console.log('World data loaded for', selectedServer.value.name)
          resolve()
        }, 1000)
      })
    }

    const initializeControls = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Initialize touch controls
          console.log('Mobile controls initialized')
          resolve()
        }, 300)
      })
    }

    const startRenderLoop = () => {
      const render = () => {
        if (!mapLoading.value && webGLSupported.value) {
          updateCamera()
          renderFrame()
        }
        requestAnimationFrame(render)
      }
      render()
    }

    const updateCamera = () => {
      // Update camera position based on touch input
      if (touchState.isDragging) {
        const deltaX = touchState.currentX - touchState.startX
        const deltaY = touchState.currentY - touchState.startY

        cameraState.rotationY += deltaX * 0.005
        cameraState.rotationX += deltaY * 0.005

        // Clamp rotation
        cameraState.rotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraState.rotationX))
      }
    }

    const renderFrame = () => {
      // Mock 3D rendering
      if (mobileMapCanvas.value) {
        const ctx = mobileMapCanvas.value.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#87CEEB' // Sky blue
          ctx.fillRect(0, 0, mobileMapCanvas.value.width, mobileMapCanvas.value.height)

          // Draw mock 3D perspective
          ctx.fillStyle = '#8B4513' // Brown
          ctx.fillRect(0, 300, mobileMapCanvas.value.width, 100)

          // Draw coordinates
          if (settings.showCoordinates) {
            ctx.fillStyle = 'white'
            ctx.font = '14px Arial'
            ctx.fillText(`${Math.round(currentCoordinates.x)}, ${Math.round(currentCoordinates.z)}`, 10, 25)
          }
        }
      }
    }

    // Touch handlers
    const handleTouchStart = (event) => {
      event.preventDefault()
      const touches = event.touches

      if (touches.length === 1) {
        // Single touch - start dragging
        touchState.isDragging = true
        touchState.startX = touches[0].clientX
        touchState.startY = touches[0].clientY
      } else if (touches.length === 2) {
        // Pinch gesture
        touchState.lastPinchDistance = getTouchDistance(touches[0], touches[1])
      }
    }

    const handleTouchMove = (event) => {
      event.preventDefault()
      const touches = event.touches

      if (touches.length === 1 && touchState.isDragging) {
        // Update drag position
        touchState.currentX = touches[0].clientX
        touchState.currentY = touches[0].clientY
      } else if (touches.length === 2) {
        // Handle pinch zoom
        const distance = getTouchDistance(touches[0], touches[1])
        const scale = distance / touchState.lastPinchDistance

        if (scale > 1.1) {
          zoomIn()
        } else if (scale < 0.9) {
          zoomOut()
        }

        touchState.lastPinchDistance = distance
      }
    }

    const handleTouchEnd = (event) => {
      if (event.touches.length === 0) {
        touchState.isDragging = false
      }
    }

    const handleMapClick = (event) => {
      // Handle tap/click for interaction
      const rect = mobileMapCanvas.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Convert screen coordinates to world coordinates
      const worldX = (x / rect.width) * 1000 - 500
      const worldZ = (y / rect.height) * 1000 - 500

      currentCoordinates.x = worldX
      currentCoordinates.z = worldZ

      $q.notify({
        type: 'info',
        message: `Moved to ${Math.round(worldX)}, ${Math.round(worldZ)}`,
        timeout: 1000
      })
    }

    const getTouchDistance = (touch1, touch2) => {
      const dx = touch1.clientX - touch2.clientX
      const dy = touch1.clientY - touch2.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    // Control methods
    const zoomIn = () => {
      if (canZoomIn.value) {
        cameraState.zoom = Math.min(3.0, cameraState.zoom * 1.2)
      }
    }

    const zoomOut = () => {
      if (canZoomOut.value) {
        cameraState.zoom = Math.max(0.3, cameraState.zoom * 0.8)
      }
    }

    const centerOnSpawn = () => {
      cameraState.x = 0
      cameraState.z = 0
      cameraState.rotationY = 0
      cameraState.rotationX = 0
      currentCoordinates.x = 0
      currentCoordinates.z = 0

      $q.notify({
        type: 'positive',
        message: 'Centered on spawn point'
      })
    }

    const centerOnPlayer = () => {
      // Mock player position
      cameraState.x = 150
      cameraState.z = -75
      currentCoordinates.x = 150
      currentCoordinates.z = -75

      $q.notify({
        type: 'info',
        message: 'Centered on player location'
      })
    }

    const switchMobileViewMode = (mode) => {
      mobileViewMode.value = mode
      // In a real implementation, this would switch between 3D and 2D rendering
      console.log('Switched to view mode:', mode)
    }

    // Menu and dialog methods
    const toggleBottomSheet = (section) => {
      showBottomSheet.value = false
      // Handle different bottom sheet sections
      switch (section) {
        case 'search':
          showSearchDialog()
          break
        case 'layers':
          showLayersDialog()
          break
      }
    }

    const changeServer = () => {
      showMobileMenu.value = false
      showServerSelection.value = true
    }

    const selectServer = (server) => {
      selectedServer.value = server
      showServerSelection.value = false
      emit('server-change', server.name)
      initializeMobileMap()
    }

    const toggleFullscreen = () => {
      if (!isFullscreen.value) {
        document.documentElement.requestFullscreen?.()
        isFullscreen.value = true
      } else {
        document.exitFullscreen?.()
        isFullscreen.value = false
      }
    }

    const shareLocation = () => {
      const shareData = {
        title: `BlueMap - ${selectedServer.value.name}`,
        text: `Check out this location: ${Math.round(currentCoordinates.x)}, ${Math.round(currentCoordinates.z)}`,
        url: window.location.href
      }

      if (navigator.share) {
        navigator.share(shareData)
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard?.writeText(`${window.location.href}#${selectedServer.value.name}:${Math.round(currentCoordinates.x)},${Math.round(currentCoordinates.z)}`)
        $q.notify({
          type: 'positive',
          message: 'Location copied to clipboard'
        })
      }

      showMobileMenu.value = false
    }

    const refreshMap = () => {
      mapLoading.value = true
      loadingMessage.value = 'Refreshing map data...'
      initializeMobileMap()
      showBottomSheet.value = false
    }

    // Dialog methods
    const showSearchDialog = () => {
      // Mock search dialog
      $q.dialog({
        title: 'Search Location',
        message: 'Enter coordinates to search for:',
        prompt: {
          model: '',
          type: 'text',
          placeholder: 'x,z (e.g., 100,-50)'
        },
        cancel: true,
        persistent: true
      }).onOk((coords) => {
        const [x, z] = coords.split(',').map(n => parseFloat(n.trim()))
        if (!isNaN(x) && !isNaN(z)) {
          currentCoordinates.x = x
          currentCoordinates.z = z
          $q.notify({
            type: 'positive',
            message: `Moved to ${x}, ${z}`
          })
        } else {
          $q.notify({
            type: 'negative',
            message: 'Invalid coordinates format'
          })
        }
      })
    }

    const showLayersDialog = () => {
      // Mock layers dialog
      $q.notify({
        type: 'info',
        message: 'Map layers dialog would open here'
      })
    }

    const saveSettings = () => {
      localStorage.setItem('bluemap-mobile-settings', JSON.stringify(settings))
      showSettings.value = false
      $q.notify({
        type: 'positive',
        message: 'Settings saved'
      })
    }

    const resetSettings = () => {
      Object.assign(settings, {
        showCoordinates: true,
        showPlayerNames: true,
        enableSound: false,
        quality: 'medium',
        cameraSpeed: 1.0
      })
    }

    const getServerIcon = (serverName) => {
      const icons = {
        'mc-basop-bafep-stp': 'school',
        'mc-bgstpoelten': 'education',
        'mc-borgstpoelten': 'account_balance',
        'mc-hakstpoelten': 'school',
        'mc-htlstp': 'precision_manufacturing',
        'mc-ilias': 'science',
        'mc-niilo': 'public'
      }
      return icons[serverName] || 'computer'
    }

    // Lifecycle hooks
    onMounted(async () => {
      // Load saved settings
      const savedSettings = localStorage.getItem('bluemap-mobile-settings')
      if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings))
      }

      // Set up canvas size
      const resizeCanvas = () => {
        if (mobileMapCanvas.value) {
          mobileMapCanvas.value.width = window.innerWidth
          mobileMapCanvas.value.height = window.innerHeight - 120 // Account for header and controls
        }
      }

      resizeCanvas()
      window.addEventListener('resize', resizeCanvas)

      await initializeMobileMap()

      onUnmounted(() => {
        window.removeEventListener('resize', resizeCanvas)
      })
    })

    return {
      // Refs
      mobileMapCanvas,
      showBottomSheet,
      showMobileMenu,
      showServerSelection,
      showSettings,
      mapLoading,
      loadingMessage,
      webGLSupported,
      isFullscreen,
      mobileViewMode,
      selectedServer,
      availableServers,
      currentCoordinates,
      settings,

      // Computed
      canZoomIn,
      canZoomOut,

      // Methods
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMapClick,
      zoomIn,
      zoomOut,
      centerOnSpawn,
      centerOnPlayer,
      switchMobileViewMode,
      toggleBottomSheet,
      changeServer,
      selectServer,
      toggleFullscreen,
      shareLocation,
      refreshMap,
      saveSettings,
      resetSettings,
      getServerIcon
    }
  }
}
</script>

<style lang="scss" scoped>
.bluemap-mobile-interface {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 9999;

  .mobile-header {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
  }

  .map-container {
    position: relative;
    height: 100%;
    overflow: hidden;

    canvas {
      width: 100%;
      height: 100%;
      touch-action: none; /* Prevent default touch behaviors */

      &.webgl-error {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }

    .webgl-error-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      padding: 2rem;
    }

    .loading-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
    }
  }

  .mobile-controls {
    position: absolute;
    right: 16px;
    bottom: 120px; // Account for bottom sheet height
    display: flex;
    flex-direction: column;
    gap: 12px;

    .zoom-controls {
      .zoom-btn {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    }

    .nav-controls {
      .nav-btn {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    }

    .view-controls {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      padding: 4px;
      backdrop-filter: blur(10px);
    }
  }

  .mobile-bottom-sheet {
    .q-bottom-sheet {
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
    }
  }
}

// Landscape orientation optimizations
@media (orientation: landscape) {
  .mobile-controls {
    right: 16px;
    bottom: 80px;
  }
}

// High DPI displays
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .mobile-controls {
    .q-btn {
      border-width: 0.5px;
    }
  }
}

// Dark theme adjustments
.body--dark {
  .mobile-header {
    background: rgba(25, 25, 25, 0.9);
  }

  .view-controls {
    background: rgba(0, 0, 0, 0.8) !important;
  }
}
</style>