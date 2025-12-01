<template>
  <div class="bluemap-analytics q-pa-md">
    <!-- Header Section -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-primary flex items-center">
          <q-icon name="analytics" size="md" class="q-mr-sm" />
          BlueMap Analytics Dashboard
          <q-badge color="info" class="q-ml-md" align="middle">
            <q-icon name="timeline" size="sm" />
            Multi-Server Insights
          </q-badge>
        </div>
        <div class="text-subtitle2 text-grey-7 q-mt-xs">
          Advanced Performance Analytics für alle 7 Minecraft Server
        </div>
      </div>
      <div class="col-auto">
        <q-select
          v-model="selectedTimeframe"
          :options="timeframeOptions"
          label="Timeframe"
          emit-value
          map-options
          dense
          class="q-mr-sm"
          style="min-width: 120px"
        />
        <q-btn
          color="primary"
          icon="refresh"
          label="Refresh Data"
          @click="refreshAnalytics"
          :loading="refreshing"
          class="q-mr-sm"
        />
        <q-btn
          color="secondary"
          icon="download"
          label="Export Report"
          @click="exportReport"
          :disable="analyticsData.length === 0"
        />
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <div class="col-12 col-md-3">
        <q-card class="overview-card">
          <q-card-section class="text-center">
            <q-icon name="servers" size="lg" color="primary" />
            <div class="text-h4 text-primary q-mt-sm">{{ overviewStats.totalServers }}</div>
            <div class="text-subtitle2 text-grey-7">Total Servers</div>
            <div class="text-caption text-positive q-mt-xs">
              <q-icon name="trending_up" size="xs" />
              {{ overviewStats.activeServers }} Active
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="overview-card">
          <q-card-section class="text-center">
            <q-icon name="speed" size="lg" color="secondary" />
            <div class="text-h4 text-secondary q-mt-sm">{{ overviewStats.averagePerformanceScore }}/100</div>
            <div class="text-subtitle2 text-grey-7">Avg Performance</div>
            <div class="text-caption text-secondary q-mt-xs">
              <q-icon name="trending_up" size="xs" />
              +12% vs Last Week
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="overview-card">
          <q-card-section class="text-center">
            <q-icon name="people" size="lg" color="accent" />
            <div class="text-h4 text-accent q-mt-sm">{{ overviewStats.totalUsers }}</div>
            <div class="text-subtitle2 text-grey-7">Active Users</div>
            <div class="text-caption text-accent q-mt-xs">
              <q-icon name="trending_up" size="xs" />
              {{ overviewStats.sessionDuration }}min avg
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="overview-card">
          <q-card-section class="text-center">
            <q-icon name="storage" size="lg" color="positive" />
            <div class="text-h4 text-positive q-mt-sm">{{ overviewStats.storageSaved }}GB</div>
            <div class="text-subtitle2 text-grey-7">Storage Saved</div>
            <div class="text-caption text-positive q-mt-xs">
              <q-icon name="savings" size="xs" />
              €{{ overviewStats.costSaved }}/year
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Server Performance Comparison -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 flex items-center">
          <q-icon name="bar_chart" class="q-mr-sm" />
          Server Performance Comparison
          <q-space />
          <q-btn-toggle
            v-model="viewMode"
            :options="[
              {label: 'Performance', value: 'performance'},
              {label: 'Usage', value: 'usage'},
              {label: 'Trends', value: 'trends'}
            ]"
            color="primary"
            size="sm"
            @update:model-value="updateChartView"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <div v-if="chartLoading" class="text-center q-py-xl">
          <q-spinner-dots size="50px" color="primary" />
          <div class="text-h6 q-mt-md">Loading Analytics Data...</div>
        </div>

        <div v-else-if="analyticsData.length === 0" class="text-center q-py-xl">
          <q-icon name="data_usage" size="lg" color="grey-5" />
          <div class="text-h6 q-mt-md text-grey-7">No Analytics Data Available</div>
          <div class="text-body2 text-grey-5">Data will appear after servers are active</div>
        </div>

        <div v-else>
          <!-- Performance Chart -->
          <div v-if="viewMode === 'performance'" class="chart-container">
            <canvas
              ref="performanceChartCanvas"
              id="performance-chart"
              style="height: 400px; width: 100%;"
            ></canvas>
          </div>

          <!-- Usage Chart -->
          <div v-else-if="viewMode === 'usage'" class="chart-container">
            <canvas
              ref="usageChartCanvas"
              id="usage-chart"
              style="height: 400px; width: 100%;"
            ></canvas>
          </div>

          <!-- Trends Chart -->
          <div v-else-if="viewMode === 'trends'" class="chart-container">
            <canvas
              ref="trendsChartCanvas"
              id="trends-chart"
              style="height: 400px; width: 100%;"
            ></canvas>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Detailed Server Analytics -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <!-- Server Details Table -->
      <div class="col-12 col-lg-8">
        <q-card>
          <q-card-section>
            <div class="text-h6 flex items-center">
              <q-icon name="table_chart" class="q-mr-sm" />
              Detailed Server Analytics
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-table
              :rows="serverAnalytics"
              :columns="serverColumns"
              row-key="name"
              :pagination="pagination"
              :loading="tableLoading"
              flat
              bordered
            >
              <template v-slot:body-cell-performance="props">
                <q-td :props="props">
                  <q-circular-progress
                    :value="props.row.performanceScore"
                    size="40px"
                    :thickness="0.2"
                    :color="getPerformanceColor(props.row.performanceScore)"
                    track-color="grey-3"
                    class="q-ma-none"
                  >
                    <div class="text-caption">{{ props.row.performanceScore }}</div>
                  </q-circular-progress>
                </q-td>
              </template>

              <template v-slot:body-cell-memory="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.memoryUsage }}MB</div>
                  <q-linear-progress
                    :value="props.row.memoryUsage / 1024"
                    :color="props.row.memoryUsage > 800 ? 'negative' : 'positive'"
                    size="4px"
                    class="q-mt-xs"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-cache="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.cacheHitRate }}%</div>
                  <q-linear-progress
                    :value="props.row.cacheHitRate / 100"
                    color="info"
                    size="4px"
                    class="q-mt-xs"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    dense
                    icon="visibility"
                    color="primary"
                    @click="viewServerDetails(props.row.name)"
                  >
                    <q-tooltip>View Details</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    icon="trending_up"
                    color="secondary"
                    @click="viewTrends(props.row.name)"
                  >
                    <q-tooltip>View Trends</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- Real-time Metrics -->
      <div class="col-12 col-lg-4">
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 flex items-center">
              <q-icon name="live_tv" class="q-mr-sm" />
              Real-time Metrics
            </div>
          </q-card-section>

          <q-card-section>
            <div class="q-gutter-md">
              <div class="metric-item">
                <div class="text-subtitle2">System Health</div>
                <q-linear-progress
                  :value="realTimeMetrics.systemHealth / 100"
                  :color="realTimeMetrics.systemHealth > 80 ? 'positive' : 'warning'"
                  size="8px"
                  class="q-mt-xs"
                />
                <div class="text-caption text-grey-6">{{ realTimeMetrics.systemHealth }}% Overall Health</div>
              </div>

              <div class="metric-item">
                <div class="text-subtitle2">Active Render Jobs</div>
                <div class="text-h6 text-primary">{{ realTimeMetrics.activeRenderJobs }}</div>
                <div class="text-caption text-grey-6">Across all servers</div>
              </div>

              <div class="metric-item">
                <div class="text-subtitle2">Average Response Time</div>
                <div class="text-h6 text-secondary">{{ realTimeMetrics.averageResponseTime }}ms</div>
                <div class="text-caption text-grey-6">Web interface latency</div>
              </div>

              <div class="metric-item">
                <div class="text-subtitle2">Cache Efficiency</div>
                <div class="text-h6 text-accent">{{ realTimeMetrics.cacheEfficiency }}%</div>
                <div class="text-caption text-grey-6">System-wide cache hit rate</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Alerts & Notifications -->
        <q-card>
          <q-card-section>
            <div class="text-h6 flex items-center">
              <q-icon name="notifications_active" class="q-mr-sm" />
              Recent Alerts
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div v-if="recentAlerts.length === 0" class="text-center text-positive q-py-md">
              <q-icon name="check_circle" size="lg" />
              <div class="text-body2 q-mt-xs">No recent alerts</div>
            </div>

            <div v-else>
              <q-timeline color="primary" layout="comfortable">
                <q-timeline-entry
                  v-for="alert in recentAlerts"
                  :key="alert.id"
                  :title="alert.title"
                  :subtitle="alert.serverName"
                  :icon="getAlertIcon(alert.severity)"
                  :color="getAlertColor(alert.severity)"
                >
                  <div class="text-body2">{{ alert.message }}</div>
                  <div class="text-caption text-grey-6 q-mt-xs">{{ formatTime(alert.timestamp) }}</div>
                </q-timeline-entry>
              </q-timeline>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Performance Trends -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 flex items-center">
          <q-icon name="show_chart" class="q-mr-sm" />
          Performance Trends ({{ selectedTimeframeLabel }})
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="server in trendData"
            :key="server.name"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle2 flex items-center">
                  <q-icon
                    :name="getServerIcon(server.name)"
                    :color="getServerColor(server.name)"
                    size="sm"
                    class="q-mr-sm"
                  />
                  {{ server.name }}
                  <q-space />
                  <q-chip
                    :color="server.trend === 'improving' ? 'positive' : server.trend === 'declining' ? 'negative' : 'warning'"
                    text-color="white"
                    size="sm"
                  >
                    <q-icon :name="server.trend === 'improving' ? 'trending_up' : server.trend === 'declining' ? 'trending_down' : 'trending_flat'" size="xs" />
                    {{ server.changeRate }}%
                  </q-chip>
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <canvas
                  :ref="`trendChart-${server.name}`"
                  :id="`trend-chart-${server.name}`"
                  style="height: 200px; width: 100%;"
                ></canvas>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Server Details Dialog -->
    <q-dialog v-model="showServerDetails" maximized>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">{{ selectedServerDetails.name }} - Detailed Analytics</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <q-tabs v-model="selectedTab" class="text-primary">
            <q-tab name="overview" label="Overview" icon="dashboard" />
            <q-tab name="performance" label="Performance" icon="speed" />
            <q-tab name="usage" label="Usage Stats" icon="people" />
            <q-tab name="configuration" label="Configuration" icon="settings" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="selectedTab" animated>
            <q-tab-panel name="overview">
              <div class="q-pa-md">
                <div class="row q-col-gutter-lg">
                  <div class="col-12 col-md-6">
                    <div class="text-h6 q-mb-md">Server Status</div>
                    <div class="q-gutter-sm">
                      <div>Status: <q-badge :color="selectedServerDetails.status === 'online' ? 'positive' : 'negative'">{{ selectedServerDetails.status }}</q-badge></div>
                      <div>Uptime: {{ formatUptime(selectedServerDetails.uptime) }}</div>
                      <div>Last Update: {{ formatTime(selectedServerDetails.lastUpdate) }}</div>
                      <div>Server Type: {{ selectedServerDetails.serverType }}</div>
                    </div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="text-h6 q-mb-md">Performance Summary</div>
                    <div class="q-gutter-sm">
                      <div>Performance Score: {{ selectedServerDetails.performanceScore }}/100</div>
                      <div>Memory Usage: {{ selectedServerDetails.memoryUsage }}MB</div>
                      <div>Cache Hit Rate: {{ selectedServerDetails.cacheHitRate }}%</div>
                      <div>Active Players: {{ selectedServerDetails.activePlayers }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="performance">
              <div class="q-pa-md">
                <canvas
                  ref="serverPerformanceChart"
                  id="server-performance-chart"
                  style="height: 300px; width: 100%;"
                ></canvas>
              </div>
            </q-tab-panel>

            <q-tab-panel name="usage">
              <div class="q-pa-md">
                <div class="text-h6 q-mb-md">Usage Statistics</div>
                <div class="text-body2">Detailed usage analytics would be displayed here</div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="configuration">
              <div class="q-pa-md">
                <div class="text-h6 q-mb-md">Server Configuration</div>
                <div class="text-body2">Configuration details would be displayed here</div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'

export default {
  name: 'BlueMapAnalyticsDashboard',

  setup() {
    const $q = useQuasar()

    // Reactive data
    const refreshing = ref(false)
    const chartLoading = ref(false)
    const tableLoading = ref(false)
    const selectedTimeframe = ref('24h')
    const viewMode = ref('performance')
    const showServerDetails = ref(false)
    const selectedTab = ref('overview')
    const selectedServerDetails = ref({})

    // Chart canvases
    const performanceChartCanvas = ref(null)
    const usageChartCanvas = ref(null)
    const trendsChartCanvas = ref(null)
    const serverPerformanceChart = ref(null)

    // Table pagination
    const pagination = ref({
      page: 1,
      rowsPerPage: 10
    })

    // Analytics data
    const analyticsData = ref([])
    const serverAnalytics = ref([])
    const trendData = ref([])
    const realTimeMetrics = reactive({
      systemHealth: 85,
      activeRenderJobs: 3,
      averageResponseTime: 125,
      cacheEfficiency: 87
    })
    const recentAlerts = ref([
      {
        id: 1,
        title: 'High Memory Usage',
        message: 'mc-niilo server memory usage above 90%',
        serverName: 'mc-niilo',
        severity: 'warning',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        title: 'Performance Improved',
        message: 'mc-bgstpoelten performance score increased by 15%',
        serverName: 'mc-bgstpoelten',
        severity: 'info',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ])

    // Configuration
    const timeframeOptions = [
      { label: 'Last Hour', value: '1h' },
      { label: 'Last 6 Hours', value: '6h' },
      { label: 'Last 24 Hours', value: '24h' },
      { label: 'Last 7 Days', value: '7d' },
      { label: 'Last 30 Days', value: '30d' }
    ]

    const serverColumns = [
      {
        name: 'name',
        required: true,
        label: 'Server',
        align: 'left',
        field: 'name',
        sortable: true
      },
      {
        name: 'performance',
        label: 'Performance',
        align: 'center',
        field: 'performanceScore',
        sortable: true
      },
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        field: 'status',
        sortable: true
      },
      {
        name: 'memory',
        label: 'Memory Usage',
        align: 'center',
        field: 'memoryUsage',
        sortable: true
      },
      {
        name: 'cache',
        label: 'Cache Hit Rate',
        align: 'center',
        field: 'cacheHitRate',
        sortable: true
      },
      {
        name: 'players',
        label: 'Active Players',
        align: 'center',
        field: 'activePlayers',
        sortable: true
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center'
      }
    ]

    // Computed properties
    const selectedTimeframeLabel = computed(() => {
      const option = timeframeOptions.find(opt => opt.value === selectedTimeframe.value)
      return option ? option.label : 'Last 24 Hours'
    })

    const overviewStats = computed(() => {
      if (analyticsData.value.length === 0) {
        return {
          totalServers: 7,
          activeServers: 7,
          averagePerformanceScore: 72,
          totalUsers: 150,
          sessionDuration: 15,
          storageSaved: 133,
          costSaved: 22000
        }
      }

      const activeServers = analyticsData.value.filter(s => s.status === 'active').length
      const avgPerformance = Math.round(
        analyticsData.value.reduce((sum, s) => sum + s.performanceScore, 0) / analyticsData.value.length
      )

      return {
        totalServers: analyticsData.value.length,
        activeServers,
        averagePerformanceScore: avgPerformance,
        totalUsers: 150, // Mock data
        sessionDuration: 15, // Mock data
        storageSaved: 133, // Calculated from BlueMap savings
        costSaved: 22000 // Annual cost savings
      }
    })

    // Methods
    const refreshAnalytics = async () => {
      refreshing.value = true
      chartLoading.value = true
      tableLoading.value = true

      try {
        // Fetch analytics data
        await fetchAnalyticsData()
        await fetchServerAnalytics()
        await fetchTrendData()

        // Update charts
        await nextTick()
        updateCharts()

        $q.notify({
          type: 'positive',
          message: 'Analytics data refreshed successfully'
        })
      } catch (error) {
        console.error('Error refreshing analytics:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to refresh analytics data',
          caption: error.message
        })
      } finally {
        refreshing.value = false
        chartLoading.value = false
        tableLoading.value = false
      }
    }

    const fetchAnalyticsData = async () => {
      // Mock analytics data - in production, this would call the actual API
      analyticsData.value = [
        {
          name: 'mc-basop-bafep-stp',
          performanceScore: 72,
          status: 'active',
          memoryUsage: 512,
          cacheHitRate: 85,
          activePlayers: 8,
          uptime: 86400,
          lastUpdate: new Date().toISOString(),
          serverType: 'education'
        },
        {
          name: 'mc-bgstpoelten',
          performanceScore: 78,
          status: 'active',
          memoryUsage: 640,
          cacheHitRate: 88,
          activePlayers: 12,
          uptime: 86400,
          lastUpdate: new Date().toISOString(),
          serverType: 'secondary_education'
        },
        {
          name: 'mc-borgstpoelten',
          performanceScore: 75,
          status: 'active',
          memoryUsage: 704,
          cacheHitRate: 82,
          activePlayers: 15,
          uptime: 86400,
          lastUpdate: new Date().toISOString(),
          serverType: 'academic'
        },
        {
          name: 'mc-hakstpoelten',
          performanceScore: 73,
          status: 'active',
          memoryUsage: 768,
          cacheHitRate: 86,
          activePlayers: 18,
          uptime: 86400,
          lastUpdate: new Date().toISOString(),
          serverType: 'university'
        },
        {
          name: 'mc-htlstp',
          performanceScore: 74,
          status: 'active',
          memoryUsage: 720,
          cacheHitRate: 84,
          activePlayers: 20,
          uptime: 86400,
          lastUpdate: new Date().toISOString(),
          serverType: 'technical'
        },
        {
          name: 'mc-ilias',
          performanceScore: 70,
          status: 'active',
          memoryUsage: 384,
          cacheHitRate: 87,
          activePlayers: 5,
          uptime: 86400,
          lastUpdate: new Date().toISOString(),
          serverType: 'specialized'
        },
        {
          name: 'mc-niilo',
          performanceScore: 76,
          status: 'active',
          memoryUsage: 896,
          cacheHitRate: 83,
          activePlayers: 25,
          uptime: 86400,
          lastUpdate: new Date().toISOString(),
          serverType: 'public'
        }
      ]
    }

    const fetchServerAnalytics = () => {
      serverAnalytics.value = analyticsData.value
    }

    const fetchTrendData = () => {
      trendData.value = analyticsData.value.map(server => ({
        name: server.name,
        trend: Math.random() > 0.5 ? 'improving' : Math.random() > 0.5 ? 'stable' : 'declining',
        changeRate: Math.round((Math.random() - 0.5) * 20), // -10 to +10
        data: generateTrendData() // Mock trend data
      }))
    }

    const generateTrendData = () => {
      // Generate mock trend data points
      const points = []
      const now = Date.now()
      for (let i = 23; i >= 0; i--) {
        points.push({
          time: new Date(now - i * 3600000), // Hourly data points
          value: Math.round(Math.random() * 30 + 60) // Performance score 60-90
        })
      }
      return points
    }

    const updateCharts = () => {
      // In a real implementation, this would use Chart.js or similar library
      console.log('Updating charts for view mode:', viewMode.value)
    }

    const updateChartView = (mode) => {
      viewMode.value = mode
      nextTick(() => {
        updateCharts()
      })
    }

    const viewServerDetails = (serverName) => {
      const server = analyticsData.value.find(s => s.name === serverName)
      if (server) {
        selectedServerDetails.value = server
        showServerDetails.value = true
      }
    }

    const viewTrends = (serverName) => {
      console.log('Viewing trends for:', serverName)
    }

    const exportReport = async () => {
      try {
        // Mock export functionality
        $q.notify({
          type: 'positive',
          message: 'Analytics report exported successfully',
          caption: 'File saved as blueMap_analytics_report.pdf'
        })
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to export report',
          caption: error.message
        })
      }
    }

    // Utility methods
    const getPerformanceColor = (score) => {
      if (score >= 80) return 'positive'
      if (score >= 60) return 'warning'
      return 'negative'
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

    const getServerColor = (serverName) => {
      const colors = {
        'mc-basop-bafep-stp': 'primary',
        'mc-bgstpoelten': 'secondary',
        'mc-borgstpoelten': 'accent',
        'mc-hakstpoelten': 'info',
        'mc-htlstp': 'positive',
        'mc-ilias': 'warning',
        'mc-niilo': 'purple'
      }
      return colors[serverName] || 'grey'
    }

    const getAlertIcon = (severity) => {
      switch (severity) {
        case 'critical': return 'error'
        case 'warning': return 'warning'
        case 'info': return 'info'
        default: return 'info'
      }
    }

    const getAlertColor = (severity) => {
      switch (severity) {
        case 'critical': return 'negative'
        case 'warning': return 'warning'
        case 'info': return 'info'
        default: return 'grey'
      }
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }

    const formatUptime = (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }

    // Lifecycle hooks
    onMounted(async () => {
      await refreshAnalytics()

      // Set up real-time updates
      const interval = setInterval(() => {
        // Update real-time metrics with slight variations
        realTimeMetrics.systemHealth = Math.max(70, Math.min(95, realTimeMetrics.systemHealth + (Math.random() - 0.5) * 4))
        realTimeMetrics.activeRenderJobs = Math.max(0, Math.min(10, realTimeMetrics.activeRenderJobs + Math.floor((Math.random() - 0.5) * 2)))
        realTimeMetrics.averageResponseTime = Math.max(50, Math.min(200, realTimeMetrics.averageResponseTime + (Math.random() - 0.5) * 20))
        realTimeMetrics.cacheEfficiency = Math.max(70, Math.min(95, realTimeMetrics.cacheEfficiency + (Math.random() - 0.5) * 3))
      }, 5000)

      onUnmounted(() => {
        clearInterval(interval)
      })
    })

    return {
      // Data
      refreshing,
      chartLoading,
      tableLoading,
      selectedTimeframe,
      viewMode,
      showServerDetails,
      selectedTab,
      selectedServerDetails,
      performanceChartCanvas,
      usageChartCanvas,
      trendsChartCanvas,
      serverPerformanceChart,
      pagination,
      analyticsData,
      serverAnalytics,
      trendData,
      realTimeMetrics,
      recentAlerts,

      // Config
      timeframeOptions,
      serverColumns,

      // Computed
      selectedTimeframeLabel,
      overviewStats,

      // Methods
      refreshAnalytics,
      updateChartView,
      viewServerDetails,
      viewTrends,
      exportReport,

      // Utilities
      getPerformanceColor,
      getServerIcon,
      getServerColor,
      getAlertIcon,
      getAlertColor,
      formatTime,
      formatUptime
    }
  }
}
</script>

<style lang="scss" scoped>
.bluemap-analytics {
  .overview-card {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .chart-container {
    position: relative;
    height: 400px;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
  }

  .metric-item {
    padding: 12px 0;
    border-bottom: 1px solid #e0e0e0;

    &:last-child {
      border-bottom: none;
    }
  }

  .q-table {
    .q-circular-progress {
      margin: 0 auto;
    }
  }
}

// Dark theme adjustments
.body--dark {
  .chart-container {
    background: #1e1e1e;
  }

  .metric-item {
    border-bottom-color: #333;
  }
}
</style>