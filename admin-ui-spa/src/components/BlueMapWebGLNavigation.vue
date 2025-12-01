<template>
  <div class="bluemap-webgl-navigation">
    <!-- 3D Navigation Header -->
    <div class="navigation-header">
      <div class="row items-center">
        <div class="col">
          <div class="text-h6 text-primary flex items-center">
            <q-icon name="3d_rotation" size="sm" class="q-mr-sm" />
            3D World Navigation
            <q-chip
              v-if="currentWorld"
              color="secondary"
              text-color="white"
              size="sm"
              class="q-ml-sm"
            >
              {{ currentWorld.name }}
            </q-chip>
          </div>
          <div class="text-caption text-grey-7">
            {{ currentCoordinates.x }}, {{ currentCoordinates.z }}
            • Y: {{ currentCoordinates.y }}
            • FPS: {{ frameRate }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn-group flat>
            <q-btn
              flat
              dense
              :color="navigationMode === 'fly' ? 'primary' : 'grey-7'"
              icon="flight_takeoff"
              @click="setNavigationMode('fly')"
            >
              <q-tooltip>Fly Mode (WASD + Mouse)</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              :color="navigationMode === 'walk' ? 'primary' : 'grey-7'"
              icon="directions_walk"
              @click="setNavigationMode('walk')"
            >
              <q-tooltip>Walk Mode (Arrow Keys + Mouse)</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              :color="navigationMode === 'orbit' ? 'primary' : 'grey-7'"
              icon="3d_rotation"
              @click="setNavigationMode('orbit')"
            >
              <q-tooltip>Orbit Mode (Mouse Drag + Scroll)</q-tooltip>
            </q-btn>
          </q-btn-group>
        </div>
      </div>
    </div>

    <!-- 3D Canvas Container -->
    <div class="canvas-container" ref="canvasContainer">
      <canvas
        ref="webglCanvas"
        id="webgl-3d-navigation"
        :class="{ 'navigation-active': isNavigating }"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
        @contextmenu="handleRightClick"
        @click="handleCanvasClick"
      ></canvas>

      <!-- Crosshair -->
      <div v-if="showCrosshair" class="crosshair">
        <div class="crosshair-h"></div>
        <div class="crosshair-v"></div>
      </div>

      <!-- Navigation HUD -->
      <div v-if="showNavigationHUD" class="navigation-hud">
        <!-- Movement Vector -->
        <div class="movement-indicator">
          <div
            class="movement-vector"
            :style="{ transform: `rotate(${movementAngle}deg)` }"
          ></div>
        </div>

        <!-- Speed Indicator -->
        <div class="speed-indicator">
          <q-linear-progress
            :value="currentSpeed / maxSpeed"
            color="primary"
            size="4px"
            class="q-mt-xs"
          />
          <div class="text-caption text-center">{{ Math.round(currentSpeed) }} m/s</div>
        </div>

        <!-- Coordinates Display -->
        <div class="coordinates-display">
          <q-chip size="sm" color="dark" text-color="white">
            X: {{ Math.round(currentCoordinates.x) }}
          </q-chip>
          <q-chip size="sm" color="dark" text-color="white">
            Y: {{ Math.round(currentCoordinates.y) }}
          </q-chip>
          <q-chip size="sm" color="dark" text-color="white">
            Z: {{ Math.round(currentCoordinates.z) }}
          </q-chip>
        </div>
      </div>

      <!-- Performance Monitor -->
      <div v-if="showPerformanceMonitor" class="performance-monitor">
        <q-card flat class="bg-dark text-white">
          <q-card-section class="q-pa-sm">
            <div class="text-caption">FPS: {{ frameRate }}</div>
            <div class="text-caption">Triangles: {{ triangleCount.toLocaleString() }}</div>
            <div class="text-caption">Draw Calls: {{ drawCalls }}</div>
            <div class="text-caption">Memory: {{ memoryUsage }}MB</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Navigation Controls Panel -->
    <div class="controls-panel">
      <q-card flat bordered>
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-xs">
            <div class="col-6">
              <q-btn
                flat
                dense
                icon="play_arrow"
                label="Play/Pause"
                @click="toggleAnimation"
                :color="isAnimating ? 'positive' : 'grey-7'"
                class="full-width"
              />
            </div>
            <div class="col-6">
              <q-btn
                flat
                dense
                icon="center_focus_strong"
                label="Reset View"
                @click="resetView"
                class="full-width"
              />
            </div>
            <div class="col-6">
              <q-btn
                flat
                dense
                icon="volume_up"
                label="Audio"
                @click="toggleAudio"
                :color="audioEnabled ? 'positive' : 'grey-7'"
                class="full-width"
              />
            </div>
            <div class="col-6">
              <q-btn
                flat
                dense
                icon="settings"
                label="Settings"
                @click="showSettingsDialog = true"
                class="full-width"
              />
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <!-- View Controls -->
          <div class="column q-gutter-sm">
            <div class="text-caption text-grey-7">Field of View</div>
            <q-slider
              v-model="cameraSettings.fov"
              :min="30"
              :max="120"
              :step="5"
              label
              color="primary"
              @update:model-value="updateCameraSettings"
            />

            <div class="text-caption text-grey-7">Camera Speed</div>
            <q-slider
              v-model="cameraSettings.moveSpeed"
              :min="0.1"
              :max="10"
              :step="0.1"
              label
              color="secondary"
              @update:model-value="updateCameraSettings"
            />

            <div class="text-caption text-grey-7">Mouse Sensitivity</div>
            <q-slider
              v-model="cameraSettings.mouseSensitivity"
              :min="0.1"
              :max="2"
              :step="0.1"
              label
              color="accent"
              @update:model-value="updateCameraSettings"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <q-dialog v-model="showShortcutsDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Keyboard Shortcuts</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-gutter-md">
            <div>
              <div class="text-subtitle2">Movement</div>
              <div class="text-caption">
                <strong>WASD</strong> - Move forward/left/back/right<br>
                <strong>Space</strong> - Move up (Fly mode)<br>
                <strong>Shift</strong> - Move down (Fly mode)<br>
                <strong>Arrow Keys</strong> - Move (Walk mode)
              </div>
            </div>

            <div>
              <div class="text-subtitle2">Camera</div>
              <div class="text-caption">
                <strong>Mouse Move</strong> - Look around<br>
                <strong>Mouse Wheel</strong> - Zoom in/out<br>
                <strong>Q/E</strong> - Roll camera (Fly mode)<br>
                <strong>R/F</strong> - Move up/down (Walk mode)
              </div>
            </div>

            <div>
              <div class="text-subtitle2">View</div>
              <div class="text-caption">
                <strong>1,2,3</strong> - Toggle between navigation modes<br>
                <strong>C</strong> - Toggle coordinate display<br>
                <strong>H</strong> - Toggle HUD<br>
                <strong>P</strong> - Toggle performance monitor<br>
                <strong>F</strong> - Toggle fullscreen<br>
                <strong>Esc</strong> - Exit 3D view
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettingsDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">3D Navigation Settings</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-gutter-md">
            <q-toggle
              v-model="settings.showWireframe"
              label="Show Wireframe"
              @update:model-value="applySettings"
            />

            <q-toggle
              v-model="settings.enableShadows"
              label="Enable Shadows"
              @update:model-value="applySettings"
            />

            <q-toggle
              v-model="settings.enableFog"
              label="Enable Fog"
              @update:model-value="applySettings"
            />

            <q-toggle
              v-model="settings.enableAntiAliasing"
              label="Anti-aliasing"
              @update:model-value="applySettings"
            />

            <q-select
              v-model="settings.renderDistance"
              :options="renderDistanceOptions"
              label="Render Distance"
              @update:model-value="applySettings"
            />

            <q-select
              v-model="settings.textureQuality"
              :options="textureQualityOptions"
              label="Texture Quality"
              @update:model-value="applySettings"
            />

            <q-slider
              v-model="settings.fogDensity"
              :min="0"
              :max="0.1"
              :step="0.001"
              label="Fog Density"
              :disable="!settings.enableFog"
              @update:model-value="applySettings"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Reset to Defaults" @click="resetSettings" />
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Apply" @click="applyAndCloseSettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <q-spinner-dots size="60px" color="primary" />
      <div class="text-h6 q-mt-md">{{ loadingMessage }}</div>
      <div class="text-body2 text-grey-6">{{ loadingProgress }}%</div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'

export default {
  name: 'BlueMapWebGLNavigation',

  props: {
    worldData: {
      type: Object,
      default: null
    },
    serverName: {
      type: String,
      required: true
    }
  },

  emits: ['exit', 'world-change'],

  setup(props, { emit }) {
    const $q = useQuasar()

    // Refs
    const webglCanvas = ref(null)
    const canvasContainer = ref(null)

    // State
    const isLoading = ref(true)
    const loadingMessage = ref('Initializing WebGL...')
    const loadingProgress = ref(0)

    // WebGL context
    let gl = null
    let animationId = null

    // Navigation state
    const navigationMode = ref('fly') // fly, walk, orbit
    const isNavigating = ref(false)
    const isAnimating = ref(false)
    const audioEnabled = ref(false)
    const showCrosshair = ref(true)
    const showNavigationHUD = ref(true)
    const showPerformanceMonitor = ref(false)

    // Camera settings
    const cameraSettings = reactive({
      fov: 75,
      moveSpeed: 2.0,
      mouseSensitivity: 0.5,
      rotationSpeed: 0.002
    })

    // Camera state
    const camera = reactive({
      x: 0,
      y: 100,
      z: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0
    })

    // Movement state
    const movement = reactive({
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false
    })

    const currentSpeed = ref(0)
    const maxSpeed = ref(10)
    const movementAngle = ref(0)

    // Current coordinates
    const currentCoordinates = reactive({ x: 0, y: 100, z: 0 })

    // Current world
    const currentWorld = ref({
      name: props.serverName,
      type: 'minecraft',
      size: { width: 1000, height: 256, depth: 1000 }
    })

    // Performance metrics
    const frameRate = ref(60)
    const triangleCount = ref(0)
    const drawCalls = ref(0)
    const memoryUsage = ref(0)
    let frameCount = 0
    let lastTime = performance.now()

    // Settings
    const settings = reactive({
      showWireframe: false,
      enableShadows: true,
      enableFog: true,
      enableAntiAliasing: true,
      renderDistance: 1000,
      textureQuality: 'medium',
      fogDensity: 0.001
    })

    // Options
    const renderDistanceOptions = [
      { label: 'Near (500m)', value: 500 },
      { label: 'Medium (1000m)', value: 1000 },
      { label: 'Far (2000m)', value: 2000 },
      { label: 'Very Far (5000m)', value: 5000 }
    ]

    const textureQualityOptions = [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
      { label: 'Ultra', value: 'ultra' }
    ]

    // Dialogs
    const showShortcutsDialog = ref(false)
    const showSettingsDialog = ref(false)

    // Event handlers
    const keyStates = reactive({})

    // Methods
    const initializeWebGL = async () => {
      try {
        await nextTick()

        if (!webglCanvas.value) return

        // Get WebGL context
        gl = webglCanvas.value.getContext('webgl') || webglCanvas.value.getContext('experimental-webgl')

        if (!gl) {
          throw new Error('WebGL not supported')
        }

        loadingMessage.value = 'Setting up WebGL context...'
        loadingProgress.value = 20

        // Set up canvas size
        resizeCanvas()

        loadingMessage.value = 'Compiling shaders...'
        loadingProgress.value = 40

        // Initialize shaders and programs
        await initializeShaders()

        loadingMessage.value = 'Loading world geometry...'
        loadingProgress.value = 60

        // Load world data
        await loadWorldGeometry()

        loadingMessage.value = 'Initializing camera...'
        loadingProgress.value = 80

        // Set up camera
        initializeCamera()

        loadingMessage.value = 'Starting render loop...'
        loadingProgress.value = 100

        // Start render loop
        startRenderLoop()

        isLoading.value = false

        $q.notify({
          type: 'positive',
          message: '3D Navigation initialized successfully'
        })

      } catch (error) {
        console.error('WebGL initialization error:', error)
        isLoading.value = false

        $q.notify({
          type: 'negative',
          message: 'Failed to initialize 3D navigation',
          caption: error.message
        })
      }
    }

    const resizeCanvas = () => {
      if (canvasContainer.value && webglCanvas.value) {
        const rect = canvasContainer.value.getBoundingClientRect()
        webglCanvas.value.width = rect.width
        webglCanvas.value.height = rect.height

        if (gl) {
          gl.viewport(0, 0, webglCanvas.value.width, webglCanvas.value.height)
        }
      }
    }

    const initializeShaders = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock shader compilation
          console.log('Shaders compiled successfully')
          resolve()
        }, 500)
      })
    }

    const loadWorldGeometry = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock world geometry loading
          triangleCount.value = 125000
          console.log('World geometry loaded')
          resolve()
        }, 1000)
      })
    }

    const initializeCamera = () => {
      camera.x = 0
      camera.y = 100
      camera.z = 0
      camera.rotationX = 0
      camera.rotationY = 0
      camera.rotationZ = 0
    }

    const startRenderLoop = () => {
      const render = (currentTime) => {
        const deltaTime = (currentTime - lastTime) / 1000
        lastTime = currentTime

        // Update FPS counter
        frameCount++
        if (frameCount % 30 === 0) {
          frameRate.value = Math.round(30 / deltaTime)
        }

        // Update navigation
        updateNavigation(deltaTime)

        // Render frame
        renderFrame()

        // Continue loop
        animationId = requestAnimationFrame(render)
      }

      animationId = requestAnimationFrame(render)
    }

    const updateNavigation = (deltaTime) => {
      const speed = cameraSettings.moveSpeed * deltaTime

      if (isNavigating.value) {
        // Calculate movement based on camera orientation
        const moveVector = calculateMoveVector()

        // Apply movement
        camera.x += moveVector.x * speed
        camera.y += moveVector.y * speed
        camera.z += moveVector.z * speed

        // Update coordinates display
        currentCoordinates.x = camera.x
        currentCoordinates.y = camera.y
        currentCoordinates.z = camera.z

        // Calculate movement speed and angle
        const horizontalSpeed = Math.sqrt(moveVector.x * moveVector.x + moveVector.z * moveVector.z)
        currentSpeed.value = horizontalSpeed * 60 // Convert to units per second
        movementAngle.value = Math.atan2(moveVector.z, moveVector.x) * 180 / Math.PI
      }
    }

    const calculateMoveVector = () => {
      const vector = { x: 0, y: 0, z: 0 }

      switch (navigationMode.value) {
        case 'fly':
          // Fly mode: full 3D movement
          if (movement.forward) {
            vector.z -= Math.cos(camera.rotationY)
            vector.x -= Math.sin(camera.rotationY)
          }
          if (movement.backward) {
            vector.z += Math.cos(camera.rotationY)
            vector.x += Math.sin(camera.rotationY)
          }
          if (movement.left) {
            vector.x -= Math.cos(camera.rotationY - Math.PI / 2)
            vector.z -= Math.sin(camera.rotationY - Math.PI / 2)
          }
          if (movement.right) {
            vector.x += Math.cos(camera.rotationY - Math.PI / 2)
            vector.z += Math.sin(camera.rotationY - Math.PI / 2)
          }
          if (movement.up) vector.y += 1
          if (movement.down) vector.y -= 1
          break

        case 'walk':
          // Walk mode: horizontal movement only
          if (movement.forward) {
            vector.z -= Math.cos(camera.rotationY)
            vector.x -= Math.sin(camera.rotationY)
          }
          if (movement.backward) {
            vector.z += Math.cos(camera.rotationY)
            vector.x += Math.sin(camera.rotationY)
          }
          if (movement.left) {
            vector.x -= Math.cos(camera.rotationY - Math.PI / 2)
            vector.z -= Math.sin(camera.rotationY - Math.PI / 2)
          }
          if (movement.right) {
            vector.x += Math.cos(camera.rotationY - Math.PI / 2)
            vector.z += Math.sin(camera.rotationY - Math.PI / 2)
          }
          // Keep Y at ground level in walk mode
          vector.y = 0
          break

        case 'orbit':
          // Orbit mode: camera rotation only
          break
      }

      return vector
    }

    const renderFrame = () => {
      if (!gl) return

      // Clear canvas
      gl.clearColor(0.5, 0.7, 1.0, 1.0) // Sky blue
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Set up camera matrix
      const cameraMatrix = createCameraMatrix()

      // Mock rendering
      drawCalls.value = Math.floor(Math.random() * 50) + 20

      // Update memory usage (mock)
      memoryUsage.value = Math.floor(Math.random() * 200) + 50
    }

    const createCameraMatrix = () => {
      // Mock camera matrix calculation
      return {
        view: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -100, 1],
        projection: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, -1, 0, 0, 0, 0]
      }
    }

    // Event handlers
    const handleMouseDown = (event) => {
      if (event.button === 0) { // Left click
        isNavigating.value = true
      } else if (event.button === 2) { // Right click
        // Handle right click actions
      }
    }

    const handleMouseMove = (event) => {
      if (isNavigating.value) {
        const deltaX = event.movementX || 0
        const deltaY = event.movementY || 0

        // Update camera rotation based on mouse movement
        camera.rotationY -= deltaX * cameraSettings.mouseSensitivity * cameraSettings.rotationSpeed
        camera.rotationX -= deltaY * cameraSettings.mouseSensitivity * cameraSettings.rotationSpeed

        // Clamp vertical rotation
        camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotationX))
      }
    }

    const handleMouseUp = (event) => {
      if (event.button === 0) {
        isNavigating.value = false
      }
    }

    const handleWheel = (event) => {
      event.preventDefault()

      const delta = event.deltaY > 0 ? 0.9 : 1.1

      if (navigationMode.value === 'orbit') {
        // Adjust orbit distance
        cameraSettings.moveSpeed = Math.max(0.1, Math.min(10, cameraSettings.moveSpeed * delta))
      } else {
        // Zoom in/out
        camera.y = Math.max(10, Math.min(500, camera.y * delta))
      }
    }

    const handleRightClick = (event) => {
      event.preventDefault()
      // Handle context menu
    }

    const handleCanvasClick = (event) => {
      // Handle object selection or waypoint creation
      const rect = webglCanvas.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      console.log('Canvas clicked at:', x, y)
    }

    // Keyboard event handlers
    const handleKeyDown = (event) => {
      keyStates[event.code] = true

      // Update movement states
      movement.forward = keyStates['KeyW'] || keyStates['ArrowUp']
      movement.backward = keyStates['KeyS'] || keyStates['ArrowDown']
      movement.left = keyStates['KeyA'] || keyStates['ArrowLeft']
      movement.right = keyStates['KeyD'] || keyStates['ArrowRight']
      movement.up = keyStates['Space']
      movement.down = keyStates['ShiftLeft'] || keyStates['KeyQ']

      // Handle shortcuts
      switch (event.code) {
        case 'Digit1':
          setNavigationMode('fly')
          break
        case 'Digit2':
          setNavigationMode('walk')
          break
        case 'Digit3':
          setNavigationMode('orbit')
          break
        case 'KeyC':
          showCrosshair.value = !showCrosshair.value
          break
        case 'KeyH':
          showNavigationHUD.value = !showNavigationHUD.value
          break
        case 'KeyP':
          showPerformanceMonitor.value = !showPerformanceMonitor.value
          break
        case 'KeyF':
          toggleFullscreen()
          break
        case 'Escape':
          emit('exit')
          break
        case 'KeyR':
          if (keyStates['KeyR'] && keyStates['KeyF']) {
            resetView()
          }
          break
      }
    }

    const handleKeyUp = (event) => {
      keyStates[event.code] = false

      // Update movement states
      movement.forward = keyStates['KeyW'] || keyStates['ArrowUp']
      movement.backward = keyStates['KeyS'] || keyStates['ArrowDown']
      movement.left = keyStates['KeyA'] || keyStates['ArrowLeft']
      movement.right = keyStates['KeyD'] || keyStates['ArrowRight']
      movement.up = keyStates['Space']
      movement.down = keyStates['ShiftLeft'] || keyStates['KeyQ']
    }

    // Control methods
    const setNavigationMode = (mode) => {
      navigationMode.value = mode

      // Adjust camera based on mode
      switch (mode) {
        case 'fly':
          cameraSettings.moveSpeed = 2.0
          break
        case 'walk':
          cameraSettings.moveSpeed = 1.0
          camera.y = 10 // Ground level
          break
        case 'orbit':
          cameraSettings.moveSpeed = 5.0
          break
      }

      $q.notify({
        type: 'info',
        message: `Switched to ${mode} mode`
      })
    }

    const toggleAnimation = () => {
      isAnimating.value = !isAnimating.value
    }

    const resetView = () => {
      initializeCamera()
      $q.notify({
        type: 'positive',
        message: 'View reset to default position'
      })
    }

    const toggleAudio = () => {
      audioEnabled.value = !audioEnabled.value
    }

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        canvasContainer.value?.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
    }

    const updateCameraSettings = () => {
      // Apply camera setting changes
      console.log('Camera settings updated')
    }

    const applySettings = () => {
      // Apply visual setting changes
      console.log('Settings applied:', settings)
    }

    const resetSettings = () => {
      Object.assign(settings, {
        showWireframe: false,
        enableShadows: true,
        enableFog: true,
        enableAntiAliasing: true,
        renderDistance: 1000,
        textureQuality: 'medium',
        fogDensity: 0.001
      })
    }

    const applyAndCloseSettings = () => {
      applySettings()
      showSettingsDialog.value = false
    }

    // Lifecycle
    onMounted(async () => {
      // Set up event listeners
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
      window.addEventListener('resize', resizeCanvas)

      await initializeWebGL()

      // Show shortcuts help on first load
      setTimeout(() => {
        showShortcutsDialog.value = true
      }, 1000)
    })

    onUnmounted(() => {
      // Clean up
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', resizeCanvas)

      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    })

    return {
      // Refs
      webglCanvas,
      canvasContainer,

      // State
      isLoading,
      loadingMessage,
      loadingProgress,
      navigationMode,
      isNavigating,
      isAnimating,
      audioEnabled,
      showCrosshair,
      showNavigationHUD,
      showPerformanceMonitor,
      frameRate,
      triangleCount,
      drawCalls,
      memoryUsage,

      // Camera
      cameraSettings,
      currentCoordinates,
      currentSpeed,
      maxSpeed,
      movementAngle,

      // World
      currentWorld,

      // Settings
      settings,
      renderDistanceOptions,
      textureQualityOptions,

      // Dialogs
      showShortcutsDialog,
      showSettingsDialog,

      // Methods
      setNavigationMode,
      toggleAnimation,
      resetView,
      toggleAudio,
      toggleFullscreen,
      updateCameraSettings,
      applySettings,
      resetSettings,
      applyAndCloseSettings,

      // Event handlers
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleWheel,
      handleRightClick,
      handleCanvasClick
    }
  }
}
</script>

<style lang="scss" scoped>
.bluemap-webgl-navigation {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;

  .navigation-header {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;

    canvas {
      width: 100%;
      height: 100%;
      cursor: crosshair;

      &.navigation-active {
        cursor: none;
      }
    }

    .crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10;

      .crosshair-h,
      .crosshair-v {
        position: absolute;
        background: rgba(255, 255, 255, 0.8);
      }

      .crosshair-h {
        width: 20px;
        height: 2px;
        top: -1px;
        left: -10px;
      }

      .crosshair-v {
        width: 2px;
        height: 20px;
        top: -10px;
        left: -1px;
      }
    }

    .navigation-hud {
      position: absolute;
      bottom: 20px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 10;

      .movement-indicator {
        width: 60px;
        height: 60px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 50%;
        position: relative;
        border: 2px solid rgba(255, 255, 255, 0.3);

        .movement-vector {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          height: 20px;
          background: #00ff00;
          transform-origin: bottom center;
          transform: translate(-50%, -100%);
        }
      }

      .speed-indicator {
        background: rgba(0, 0, 0, 0.7);
        border-radius: 8px;
        padding: 8px;
        min-width: 80px;
      }

      .coordinates-display {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        max-width: 200px;
      }
    }

    .performance-monitor {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
      min-width: 120px;
    }
  }

  .controls-panel {
    position: absolute;
    top: 80px;
    right: 20px;
    width: 200px;
    z-index: 20;

    .q-card {
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
    }
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 1000;
  }
}

// Dark theme adjustments
.body--dark {
  .navigation-header {
    background: rgba(25, 25, 25, 0.9);
  }

  .controls-panel .q-card {
    background: rgba(25, 25, 25, 0.9) !important;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .controls-panel {
    position: relative;
    top: auto;
    right: auto;
    width: 100%;
    margin-top: 8px;

    .q-card {
      border-radius: 0;
    }
  }

  .navigation-hud {
    bottom: 100px !important; // Account for mobile controls
    left: 10px !important;

    .movement-indicator {
      width: 40px !important;
      height: 40px !important;

      .movement-vector {
        height: 15px !important;
      }
    }
  }
}
</style>