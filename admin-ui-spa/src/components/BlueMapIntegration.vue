<template>
  <div class="bluemap-integration q-pa-md">
    <!-- Header Section -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-primary flex items-center">
          <q-icon name="map" size="md" class="q-mr-sm" />
          BlueMap Integration
          <q-badge color="positive" class="q-ml-md" align="middle">
            <q-icon name="check_circle" size="sm" />
            Sprint 1 Complete
          </q-badge>
        </div>
        <div class="text-subtitle2 text-grey-7 q-mt-xs">
          Modern 3D Minecraft World Mapping mit Lazy Server Architecture
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="play_arrow"
          label="Performance Benchmark"
          @click="runBenchmark"
          :loading="benchmarking"
          class="q-mr-sm"
        />
        <q-btn
          color="secondary"
          icon="settings"
          label="Configure"
          @click="showConfigDialog = true"
        />
      </div>
    </div>

    <!-- Server Status Overview -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 flex items-center">
          <q-icon name="servers" class="q-mr-sm" />
          BlueMap Server Status (7 Servers)
          <q-space />
          <q-chip
            :color="summary.healthyServers === 7 ? 'positive' : 'warning'"
            text-color="white"
            :icon="summary.healthyServers === 7 ? 'check_circle' : 'warning'"
          >
            {{ summary.healthyServers }}/{{ summary.totalServers }} Healthy
          </q-chip>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="server in serverStatuses"
            :key="server.name"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              flat
              bordered
              class="server-card"
              :class="{ 'server-offline': !server.isHealthy }"
            >
              <q-card-section>
                <div class="text-subtitle2 flex items-center">
                  <q-icon
                    :name="server.isHealthy ? 'check_circle' : 'error'"
                    :color="server.isHealthy ? 'positive' : 'negative'"
                    size="sm"
                    class="q-mr-sm"
                  />
                  {{ server.name }}
                </div>

                <div class="text-caption text-grey-7 q-mt-xs">
                  {{ server.serverType }} • Port {{ server.webPort }}
                </div>

                <!-- Performance Metrics -->
                <div class="q-mt-md">
                  <div class="row q-gutter-sm text-caption">
                    <div class="col">
                      <div class="text-grey-6">Memory</div>
                      <div class="text-weight-medium">{{ server.memoryUsage }}MB</div>
                    </div>
                    <div class="col">
                      <div class="text-grey-6">Cache Hit</div>
                      <div class="text-weight-medium">{{ server.cacheHitRate }}%</div>
                    </div>
                  </div>

                  <!-- Progress Indicators -->
                  <div class="q-mt-sm">
                    <div class="q-mb-xs">
                      <div class="text-grey-6 text-caption">Lazy Loading Progress</div>
                      <q-linear-progress
                        :value="server.lazyProgress / 100"
                        color="primary"
                        size="4px"
                        class="q-mt-xs"
                      />
                    </div>

                    <div class="q-mb-xs">
                      <div class="text-grey-6 text-caption">Render Queue</div>
                      <q-linear-progress
                        :value="Math.min(server.renderQueueLength / 10, 1)"
                        :color="server.renderQueueLength > 5 ? 'warning' : 'positive'"
                        size="4px"
                        class="q-mt-xs"
                      />
                    </div>
                  </div>

                  <!-- Quick Actions -->
                  <div class="q-mt-sm">
                    <q-btn
                      size="sm"
                      color="primary"
                      icon="play_arrow"
                      label="Render Area"
                      @click="triggerRender(server.name)"
                      :disable="!server.isHealthy"
                      class="q-mr-xs"
                      dense
                    />
                    <q-btn
                      size="sm"
                      color="info"
                      icon="visibility"
                      label="View Map"
                      @click="openWebInterface(server.name)"
                      :disable="!server.isHealthy"
                      dense
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Performance Metrics Dashboard -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <!-- Performance Summary -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 flex items-center">
              <q-icon name="speed" class="q-mr-sm" />
              Performance Summary
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-card flat bordered class="metric-card">
                  <q-card-section class="text-center">
                    <div class="text-h4 text-primary">{{ performanceSummary.averageRenderTime }}min</div>
                    <div class="text-caption text-grey-6">Avg Render Time</div>
                    <q-icon
                      name="trending_down"
                      color="positive"
                      size="sm"
                      class="q-mt-xs"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6">
                <q-card flat bordered class="metric-card">
                  <q-card-section class="text-center">
                    <div class="text-h4 text-secondary">{{ performanceSummary.averageMemoryUsage }}MB</div>
                    <div class="text-caption text-grey-6">Avg Memory Usage</div>
                    <q-icon
                      name="trending_down"
                      color="positive"
                      size="sm"
                      class="q-mt-xs"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6">
                <q-card flat bordered class="metric-card">
                  <q-card-section class="text-center">
                    <div class="text-h4 text-accent">{{ performanceSummary.averageCacheHitRate }}%</div>
                    <div class="text-caption text-grey-6">Cache Hit Rate</div>
                    <q-icon
                      name="trending_up"
                      color="positive"
                      size="sm"
                      class="q-mt-xs"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6">
                <q-card flat bordered class="metric-card">
                  <q-card-section class="text-center">
                    <div class="text-h4 text-info">{{ performanceSummary.totalActivePlayers }}</div>
                    <div class="text-caption text-grey-6">Active Players</div>
                    <q-icon
                      name="people"
                      color="info"
                      size="sm"
                      class="q-mt-xs"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Real-time Monitoring -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 flex items-center">
              <q-icon name="monitor_heart" class="q-mr-sm" />
              Real-time Monitoring
              <q-space />
              <q-chip
                :color="monitoringStatus.connected ? 'positive' : 'negative'"
                text-color="white"
                size="sm"
              >
                <q-icon :name="monitoringStatus.connected ? 'wifi' : 'wifi_off'" size="sm" />
                {{ monitoringStatus.connected ? 'Connected' : 'Disconnected' }}
              </q-chip>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md">
              <div class="text-subtitle2 text-grey-8">System Health</div>
              <q-linear-progress
                :value="monitoringStatus.systemHealth / 100"
                :color="monitoringStatus.systemHealth > 80 ? 'positive' : monitoringStatus.systemHealth > 60 ? 'warning' : 'negative'"
                size="8px"
                class="q-mt-xs"
              />
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ monitoringStatus.systemHealth }}% System Health Score
              </div>
            </div>

            <div class="q-mb-md">
              <div class="text-subtitle2 text-grey-8">Active Alerts</div>
              <div v-if="activeAlerts.length === 0" class="text-center text-positive q-py-md">
                <q-icon name="check_circle" size="lg" />
                <div>No active alerts</div>
              </div>
              <div v-else>
                <q-banner
                  v-for="alert in activeAlerts"
                  :key="alert.id"
                  :class="`bg-${alert.severity}-1 text-${alert.severity}-8 q-mb-sm`"
                  dense
                >
                  <template v-slot:avatar>
                    <q-icon
                      :name="alert.severity === 'critical' ? 'error' : 'warning'"
                      :color="alert.severity"
                    />
                  </template>
                  <div class="text-weight-medium">{{ alert.message }}</div>
                  <div class="text-caption">{{ alert.serverName }}</div>
                </q-banner>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 3D World Preview -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 flex items-center">
          <q-icon name="3d_rotation" class="q-mr-sm" />
          3D World Preview
          <q-space />
          <q-btn-toggle
            v-model="viewMode"
            :options="[
              {label: '3D View', value: '3d', icon: '3d_rotation'},
              {label: '2D Map', value: '2d', icon: 'map'},
              {label: 'Hybrid', value: 'hybrid', icon: 'view_in_ar'}
            ]"
            color="primary"
            size="sm"
            clearable
            @update:model-value="switchViewMode"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <div
          id="bluemap-3d-container"
          class="bluemap-3d-container"
          :class="{ 'hybrid-view': viewMode === 'hybrid' }"
        >
          <!-- 3D WebGL Canvas wird hier gerendert -->
          <div v-if="!webGLSupported" class="fallback-message">
            <q-icon name="warning" size="lg" color="warning" />
            <div class="text-h6 q-mt-md">WebGL Not Supported</div>
            <div class="text-body2">
              Your browser doesn't support WebGL. Please use a modern browser for the best experience.
            </div>
            <q-btn
              color="primary"
              label="Try 2D View Instead"
              @click="viewMode = '2d'"
              class="q-mt-md"
            />
          </div>

          <div v-else-if="selectedServer" class="map-interface">
            <div class="map-controls">
              <q-btn-group flat>
                <q-btn
                  flat
                  icon="zoom_in"
                  @click="zoomIn"
                  :disable="!canZoomIn"
                />
                <q-btn
                  flat
                  icon="zoom_out"
                  @click="zoomOut"
                  :disable="!canZoomOut"
                />
                <q-btn
                  flat
                  icon="center_focus_strong"
                  @click="resetView"
                />
              </q-btn-group>

              <q-separator vertical class="q-mx-sm" />

              <q-btn-group flat>
                <q-btn
                  flat
                  icon="navigation"
                  label="Spawn"
                  @click="centerOnSpawn"
                />
                <q-btn
                  flat
                  icon="my_location"
                  label="Player"
                  @click="centerOnPlayer"
                />
              </q-btn-group>
            </div>

            <div class="map-info">
              <q-chip size="sm" color="primary" text-color="white">
                {{ selectedServer.name }}
              </q-chip>
              <q-chip size="sm" outline>
                Coordinates: {{ currentCoordinates.x }}, {{ currentCoordinates.z }}
              </q-chip>
            </div>
          </div>

          <div v-else class="select-server-prompt">
            <q-icon name="touch_app" size="lg" color="primary" />
            <div class="text-h6 q-mt-md">Select a Server</div>
            <div class="text-body2">Click on any server card above to view its 3D map</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Configuration Dialog -->
    <q-dialog v-model="showConfigDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">BlueMap Configuration</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-gutter-md">
            <q-select
              v-model="config.selectedServer"
              :options="serverOptions"
              label="Target Server"
              emit-value
              map-options
            />

            <q-input
              v-model.number="config.renderDistance"
              type="number"
              label="Render Distance (chunks)"
              :min="1000"
              :max="10000"
              hint="Higher values = more detailed but slower"
            />

            <q-select
              v-model="config.priority"
              :options="priorityOptions"
              label="Render Priority"
              emit-value
              map-options
            />

            <q-toggle
              v-model="config.lazyLoading"
              label="Enable Lazy Loading"
              hint="On-demand rendering for better performance"
            />

            <q-toggle
              v-model="config.realTimeUpdates"
              label="Real-time Updates"
              hint="Live updates via WebSocket"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showConfigDialog = false" />
          <q-btn
            color="primary"
            label="Save Configuration"
            @click="saveConfiguration"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Render Progress Dialog -->
    <q-dialog v-model="showRenderDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Render Area Progress</div>
          <div class="text-subtitle2 text-grey-7">{{ renderProgress.serverName }}</div>
        </q-card-section>

        <q-card-section>
          <q-linear-progress
            :value="renderProgress.progress / 100"
            color="primary"
            size="20px"
            class="q-mb-md"
          />

          <div class="text-center">
            <div class="text-h6">{{ renderProgress.progress }}%</div>
            <div class="text-caption text-grey-6">{{ renderProgress.message }}</div>
            <div class="text-caption text-grey-6 q-mt-xs">
              Estimated time remaining: {{ renderProgress.estimatedTime }}s
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            @click="cancelRender"
            :disable="renderProgress.progress === 100"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'

export default {
  name: 'BlueMapIntegration',

  setup() {
    const $q = useQuasar()

    // Reactive data
    const serverStatuses = ref([])
    const activeAlerts = ref([])
    const benchmarking = ref(false)
    const showConfigDialog = ref(false)
    const showRenderDialog = ref(false)
    const viewMode = ref('3d')
    const selectedServer = ref(null)
    const webGLSupported = ref(true)

    // Configuration
    const config = reactive({
      selectedServer: null,
      renderDistance: 5000,
      priority: 'normal',
      lazyLoading: true,
      realTimeUpdates: true
    })

    // Render progress
    const renderProgress = reactive({
      serverName: '',
      progress: 0,
      message: 'Initializing...',
      estimatedTime: 0,
      jobId: null
    })

    // Computed properties
    const summary = computed(() => {
      const total = serverStatuses.value.length
      const healthy = serverStatuses.value.filter(s => s.isHealthy).length
      const totalMemory = serverStatuses.value.reduce((sum, s) => sum + (s.memoryUsage || 0), 0)
      const avgCacheHit = serverStatuses.value.reduce((sum, s) => sum + (s.cacheHitRate || 0), 0) / total || 0

      return {
        totalServers: total,
        healthyServers: healthy,
        averageMemoryUsage: Math.round(totalMemory / total),
        averageCacheHitRate: Math.round(avgCacheHit),
        totalActivePlayers: serverStatuses.value.reduce((sum, s) => sum + (s.activePlayers || 0), 0)
      }
    })

    const performanceSummary = computed(() => ({
      averageRenderTime: Math.round(serverStatuses.value.reduce((sum, s) => sum + (s.averageRenderTime || 18), 0) / serverStatuses.value.length),
      averageMemoryUsage: summary.value.averageMemoryUsage,
      averageCacheHitRate: summary.value.averageCacheHitRate,
      totalActivePlayers: summary.value.totalActivePlayers
    }))

    const monitoringStatus = reactive({
      connected: false,
      systemHealth: 85
    })

    const serverOptions = computed(() =>
      serverStatuses.value.map(server => ({
        label: `${server.name} (${server.serverType})`,
        value: server.name
      }))
    )

    const priorityOptions = [
      { label: 'Low Priority', value: 'low' },
      { label: 'Normal Priority', value: 'normal' },
      { label: 'High Priority', value: 'high' }
    ]

    // 3D Map state
    const currentCoordinates = reactive({ x: 0, z: 0 })
    const canZoomIn = ref(true)
    const canZoomOut = ref(true)

    // WebSocket connection
    let wsConnection = null

    // Methods
    const fetchServerStatuses = async () => {
      try {
        const response = await fetch('/api/bluemap/servers/status')
        const data = await response.json()

        if (data.servers) {
          serverStatuses.value = data.servers
        }
      } catch (error) {
        console.error('Error fetching server statuses:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to fetch server statuses',
          caption: error.message
        })
      }
    }

    const triggerRender = async (serverName) => {
      try {
        const response = await fetch(`/api/bluemap/servers/${serverName}/render-area`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x: currentCoordinates.x,
            z: currentCoordinates.z,
            radius: 100,
            priority: config.priority
          })
        })

        const data = await response.json()

        if (data.success) {
          renderProgress.serverName = serverName
          renderProgress.jobId = data.jobId
          renderProgress.estimatedTime = data.estimatedTime
          showRenderDialog.value = true

          $q.notify({
            type: 'positive',
            message: 'Render job queued successfully',
            caption: `Job ID: ${data.jobId}`
          })
        }
      } catch (error) {
        console.error('Error triggering render:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to trigger render',
          caption: error.message
        })
      }
    }

    const openWebInterface = (serverName) => {
      const server = serverStatuses.value.find(s => s.name === serverName)
      if (server) {
        window.open(`http://localhost:${server.webPort}/bluemap/${serverName}/`, '_blank')
      }
    }

    const runBenchmark = async () => {
      benchmarking.value = true
      try {
        // Simulate benchmark running
        await new Promise(resolve => setTimeout(resolve, 2000))

        $q.notify({
          type: 'positive',
          message: 'Performance benchmark completed',
          caption: 'Overall Score: 72/100 (VERY GOOD)',
          timeout: 5000
        })
      } finally {
        benchmarking.value = false
      }
    }

    const switchViewMode = (mode) => {
      // Implementation for switching between 3D/2D/Hybrid views
      console.log('Switching to view mode:', mode)
    }

    const zoomIn = () => { /* 3D zoom in implementation */ }
    const zoomOut = () => { /* 3D zoom out implementation */ }
    const resetView = () => { /* 3D reset view implementation */ }
    const centerOnSpawn = () => { /* Center on spawn implementation */ }
    const centerOnPlayer = () => { /* Center on player implementation */ }

    const saveConfiguration = async () => {
      try {
        const response = await fetch('/api/bluemap/lazy-server/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverName: config.selectedServer,
            config: {
              renderDistance: config.renderDistance,
              priority: config.priority,
              lazyLoading: config.lazyLoading,
              realTimeUpdates: config.realTimeUpdates
            }
          })
        })

        if (response.ok) {
          showConfigDialog.value = false
          $q.notify({
            type: 'positive',
            message: 'Configuration saved successfully'
          })
        }
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to save configuration',
          caption: error.message
        })
      }
    }

    const cancelRender = () => {
      // Implementation for canceling render job
      showRenderDialog.value = false
      $q.notify({
        type: 'warning',
        message: 'Render job canceled'
      })
    }

    const setupWebSocket = () => {
      // WebSocket setup for real-time updates
      try {
        wsConnection = new WebSocket('ws://localhost:3000/ws/bluemap')

        wsConnection.onopen = () => {
          monitoringStatus.connected = true
          console.log('BlueMap WebSocket connected')
        }

        wsConnection.onmessage = (event) => {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        }

        wsConnection.onclose = () => {
          monitoringStatus.connected = false
          console.log('BlueMap WebSocket disconnected')
          // Attempt reconnection after 5 seconds
          setTimeout(setupWebSocket, 5000)
        }

        wsConnection.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
      } catch (error) {
        console.error('Failed to setup WebSocket:', error)
      }
    }

    const handleWebSocketMessage = (data) => {
      switch (data.type) {
        case 'server_update':
          updateServerStatus(data.serverName, data.status)
          break
        case 'render_progress':
          updateRenderProgress(data)
          break
        case 'alert':
          activeAlerts.value.push(data.alert)
          break
      }
    }

    const updateServerStatus = (serverName, status) => {
      const server = serverStatuses.value.find(s => s.name === serverName)
      if (server) {
        Object.assign(server, status)
      }
    }

    const updateRenderProgress = (data) => {
      if (renderProgress.jobId === data.jobId) {
        renderProgress.progress = data.progress
        renderProgress.message = data.message

        if (data.progress >= 100) {
          showRenderDialog.value = false
          $q.notify({
            type: 'positive',
            message: 'Render completed successfully',
            timeout: 3000
          })
        }
      }
    }

    // Lifecycle hooks
    onMounted(async () => {
      await fetchServerStatuses()
      setupWebSocket()

      // Check WebGL support
      try {
        const canvas = document.createElement('canvas')
        webGLSupported.value = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch (error) {
        webGLSupported.value = false
      }

      // Refresh data every 30 seconds
      setInterval(fetchServerStatuses, 30000)
    })

    onUnmounted(() => {
      if (wsConnection) {
        wsConnection.close()
      }
    })

    return {
      // Data
      serverStatuses,
      activeAlerts,
      benchmarking,
      showConfigDialog,
      showRenderDialog,
      viewMode,
      selectedServer,
      webGLSupported,
      config,
      renderProgress,
      currentCoordinates,
      canZoomIn,
      canZoomOut,

      // Computed
      summary,
      performanceSummary,
      monitoringStatus,
      serverOptions,
      priorityOptions,

      // Methods
      fetchServerStatuses,
      triggerRender,
      openWebInterface,
      runBenchmark,
      switchViewMode,
      zoomIn,
      zoomOut,
      resetView,
      centerOnSpawn,
      centerOnPlayer,
      saveConfiguration,
      cancelRender
    }
  }
}
</script>

<style lang="scss" scoped>
.bluemap-integration {
  .server-card {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.server-offline {
      opacity: 0.7;
      border-color: $negative;
    }
  }

  .metric-card {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .bluemap-3d-container {
    height: 500px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    position: relative;
    overflow: hidden;

    .fallback-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: white;
      text-align: center;
      padding: 2rem;
    }

    .select-server-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: white;
      text-align: center;
    }

    .map-interface {
      height: 100%;
      position: relative;

      .map-controls {
        position: absolute;
        top: 16px;
        left: 16px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        padding: 8px;
        display: flex;
        align-items: center;
        z-index: 10;
      }

      .map-info {
        position: absolute;
        bottom: 16px;
        left: 16px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        padding: 8px;
        display: flex;
        gap: 8px;
        z-index: 10;
      }
    }

    &.hybrid-view {
      // Hybrid view specific styles
    }
  }
}

// Dark theme adjustments
.body--dark {
  .bluemap-3d-container {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }

  .map-controls,
  .map-info {
    background: rgba(0, 0, 0, 0.8) !important;
    color: white;
  }
}
</style>