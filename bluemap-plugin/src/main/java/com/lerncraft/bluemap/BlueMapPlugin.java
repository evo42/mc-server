package com.lerncraft.bluemap;

import com.lerncraft.bluemap.commands.BlueMapCommands;
import com.lerncraft.bluemap.communication.WebSocketClient;
import com.lerncraft.bluemap.config.ConfigManager;
import com.lerncraft.bluemap.core.DataCollector;
import com.lerncraft.bluemap.core.PerformanceMonitor;
import com.lerncraft.bluemap.data.WorldDataManager;
import com.lerncraft.bluemap.listeners.PlayerListener;
import com.lerncraft.bluemap.listeners.WorldListener;
import com.lerncraft.bluemap.listeners.ChunkListener;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;

/**
 * BlueMap Minecraft Plugin
 *
 * Main plugin class for integrating BlueMap with Minecraft servers.
 * Provides real-time data collection, performance monitoring,
 * and communication with the BlueMap API backend.
 *
 * @author Lerncraft Development Team
 * @version 1.0.0
 * @since Sprint 3 - Migration & Deployment
 */
public class BlueMapPlugin extends JavaPlugin {

    private static BlueMapPlugin instance;
    private ConfigManager configManager;
    private DataCollector dataCollector;
    private WorldDataManager worldDataManager;
    private WebSocketClient webSocketClient;
    private PerformanceMonitor performanceMonitor;
    private boolean isEnabled = false;

    @Override
    public void onEnable() {
        instance = this;

        try {
            // Initialize configuration
            initializeConfig();

            // Initialize core components
            initializeComponents();

            // Register event listeners
            registerListeners();

            // Register commands
            registerCommands();

            // Start data collection
            startDataCollection();

            // Connect to BlueMap API
            connectToAPI();

            this.isEnabled = true;

            getLogger().info("✅ BlueMap Plugin enabled successfully!");
            getLogger().info("🌍 BlueMap Integration: Active");
            getLogger().info("📊 Data Collection: Running");
            getLogger().info("🔗 API Connection: Established");

        } catch (Exception e) {
            getLogger().log(Level.SEVERE, "❌ Failed to enable BlueMap Plugin", e);
            getServer().getPluginManager().disablePlugin(this);
        }
    }

    @Override
    public void onDisable() {
        if (!this.isEnabled) {
            return;
        }

        try {
            getLogger().info("🔄 Shutting down BlueMap Plugin...");

            // Stop data collection
            if (dataCollector != null) {
                dataCollector.stop();
            }

            // Disconnect from API
            if (webSocketClient != null) {
                webSocketClient.disconnect();
            }

            // Save pending data
            if (worldDataManager != null) {
                worldDataManager.savePendingData();
            }

            this.isEnabled = false;

            getLogger().info("✅ BlueMap Plugin disabled successfully!");

        } catch (Exception e) {
            getLogger().log(Level.WARNING, "⚠️ Error during BlueMap Plugin shutdown", e);
        }
    }

    /**
     * Initialize plugin configuration
     */
    private void initializeConfig() {
        getLogger().info("⚙️ Loading configuration...");

        // Create default config file if it doesn't exist
        saveDefaultConfig();

        // Load configuration
        configManager = new ConfigManager(this);
        configManager.loadConfiguration();

        getLogger().info("✅ Configuration loaded");
    }

    /**
     * Initialize core plugin components
     */
    private void initializeComponents() {
        getLogger().info("🔧 Initializing core components...");

        // Initialize World Data Manager
        worldDataManager = new WorldDataManager(this);

        // Initialize Data Collector
        dataCollector = new DataCollector(this, worldDataManager);

        // Initialize Performance Monitor
        performanceMonitor = new PerformanceMonitor(this);

        // Initialize WebSocket Client
        String apiUrl = configManager.getApiUrl();
        String serverId = configManager.getServerId();
        String serverName = configManager.getServerName();

        webSocketClient = new WebSocketClient(this, apiUrl, serverId, serverName);

        getLogger().info("✅ Core components initialized");
    }

    /**
     * Register event listeners
     */
    private void registerListeners() {
        getLogger().info("👂 Registering event listeners...");

        // Player events
        getServer().getPluginManager().registerEvents(new PlayerListener(this), this);

        // World events
        getServer().getPluginManager().registerEvents(new WorldListener(this), this);

        // Chunk events
        getServer().getPluginManager().registerEvents(new ChunkListener(this), this);

        getLogger().info("✅ Event listeners registered");
    }

    /**
     * Register plugin commands
     */
    private void registerCommands() {
        getLogger().info("📋 Registering commands...");

        // Register BlueMap commands
        if (getCommand("bluemap") != null) {
            getCommand("bluemap").setExecutor(new BlueMapCommands(this));
            getCommand("bluemap").setTabCompleter(new BlueMapCommands(this));
        }

        // Register admin commands
        if (getCommand("bluemapadmin") != null) {
            getCommand("bluemapadmin").setExecutor(new BlueMapCommands(this));
        }

        getLogger().info("✅ Commands registered");
    }

    /**
     * Start data collection processes
     */
    private void startDataCollection() {
        getLogger().info("📊 Starting data collection...");

        // Start world data collection
        dataCollector.startWorldScanning();

        // Start entity tracking
        dataCollector.startEntityTracking();

        // Start marker collection
        dataCollector.startMarkerCollection();

        // Start performance monitoring
        performanceMonitor.startMonitoring();

        getLogger().info("✅ Data collection started");
    }

    /**
     * Connect to BlueMap API
     */
    private void connectToAPI() {
        getLogger().info("🔗 Connecting to BlueMap API...");

        CompletableFuture.runAsync(() -> {
            try {
                // Authenticate and connect
                boolean connected = webSocketClient.connect();

                if (connected) {
                    getLogger().info("✅ Successfully connected to BlueMap API");

                    // Send initial server status
                    sendServerStatus();

                    // Start heartbeat
                    startHeartbeat();

                } else {
                    getLogger().warning("⚠️ Failed to connect to BlueMap API - will retry automatically");
                }

            } catch (Exception e) {
                getLogger().log(Level.WARNING, "⚠️ Error connecting to BlueMap API", e);
            }
        });
    }

    /**
     * Send server status to BlueMap API
     */
    public void sendServerStatus() {
        if (webSocketClient != null && webSocketClient.isConnected()) {
            ServerStatus status = new ServerStatus();
            status.setServerId(configManager.getServerId());
            status.setServerName(configManager.getServerName());
            status.setPlayerCount(getServer().getOnlinePlayers().size());
            status.setMaxPlayers(getServer().getMaxPlayers());
            status.setTps(getServer().getTPS()[0]);
            status.setMemoryUsage(getServer().getServerMemory());
            status.setWorldCount(getServer().getWorlds().size());
            status.setOnlinePlayers(getServer().getOnlinePlayers().stream()
                .map(player -> player.getName())
                .toList());
            status.setTimestamp(System.currentTimeMillis());

            webSocketClient.sendMessage("server_status", status);
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private void startHeartbeat() {
        // Send heartbeat every 30 seconds
        getServer().getScheduler().runTaskTimerAsynchronously(this, () -> {
            if (isEnabled && webSocketClient != null && webSocketClient.isConnected()) {
                sendServerStatus();
            }
        }, 600L, 600L); // 30 seconds = 600 ticks
    }

    /**
     * Handle plugin reload
     */
    public void reloadPlugin() {
        try {
            getLogger().info("🔄 Reloading BlueMap Plugin...");

            // Reload configuration
            configManager.reloadConfiguration();

            // Restart data collection
            dataCollector.restart();

            // Reconnect to API
            if (webSocketClient != null) {
                webSocketClient.disconnect();
                connectToAPI();
            }

            getLogger().info("✅ BlueMap Plugin reloaded successfully");

        } catch (Exception e) {
            getLogger().log(Level.SEVERE, "❌ Failed to reload BlueMap Plugin", e);
        }
    }

    /**
     * Get plugin instance
     */
    public static BlueMapPlugin getInstance() {
        return instance;
    }

    /**
     * Get configuration manager
     */
    public ConfigManager getConfigManager() {
        return configManager;
    }

    /**
     * Get data collector
     */
    public DataCollector getDataCollector() {
        return dataCollector;
    }

    /**
     * Get world data manager
     */
    public WorldDataManager getWorldDataManager() {
        return worldDataManager;
    }

    /**
     * Get WebSocket client
     */
    public WebSocketClient getWebSocketClient() {
        return webSocketClient;
    }

    /**
     * Get performance monitor
     */
    public PerformanceMonitor getPerformanceMonitor() {
        return performanceMonitor;
    }

    /**
     * Check if plugin is enabled
     */
    public boolean isEnabled() {
        return isEnabled;
    }

    /**
     * Server status data class
     */
    public static class ServerStatus {
        private String serverId;
        private String serverName;
        private int playerCount;
        private int maxPlayers;
        private double tps;
        private long memoryUsage;
        private int worldCount;
        private java.util.List<String> onlinePlayers;
        private long timestamp;

        // Getters and setters
        public String getServerId() { return serverId; }
        public void setServerId(String serverId) { this.serverId = serverId; }

        public String getServerName() { return serverName; }
        public void setServerName(String serverName) { this.serverName = serverName; }

        public int getPlayerCount() { return playerCount; }
        public void setPlayerCount(int playerCount) { this.playerCount = playerCount; }

        public int getMaxPlayers() { return maxPlayers; }
        public void setMaxPlayers(int maxPlayers) { this.maxPlayers = maxPlayers; }

        public double getTps() { return tps; }
        public void setTps(double tps) { this.tps = tps; }

        public long getMemoryUsage() { return memoryUsage; }
        public void setMemoryUsage(long memoryUsage) { this.memoryUsage = memoryUsage; }

        public int getWorldCount() { return worldCount; }
        public void setWorldCount(int worldCount) { this.worldCount = worldCount; }

        public java.util.List<String> getOnlinePlayers() { return onlinePlayers; }
        public void setOnlinePlayers(java.util.List<String> onlinePlayers) { this.onlinePlayers = onlinePlayers; }

        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    }
}