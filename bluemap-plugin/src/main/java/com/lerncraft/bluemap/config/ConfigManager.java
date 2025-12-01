package com.lerncraft.bluemap.config;

import com.lerncraft.bluemap.BlueMapPlugin;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;

/**
 * Configuration Manager for BlueMap Plugin
 *
 * Handles all configuration loading, validation, and management
 * for the BlueMap plugin including API settings, performance
 * settings, and per-world configurations.
 *
 * @author Lerncraft Development Team
 * @version 1.0.0
 */
public class ConfigManager {

    private final BlueMapPlugin plugin;
    private FileConfiguration config;
    private File configFile;
    private File worldsConfigFile;
    private FileConfiguration worldsConfig;

    // Configuration sections
    private String apiUrl;
    private String serverId;
    private String serverName;
    private boolean enabled;
    private int dataCollectionInterval;
    private int performanceCheckInterval;
    private boolean enableEntityTracking;
    private boolean enableMarkerCollection;
    private boolean enableChunkScanning;
    private int maxWorldsToScan;
    private Map<String, WorldConfig> worldConfigs;

    public ConfigManager(BlueMapPlugin plugin) {
        this.plugin = plugin;
        this.worldConfigs = new HashMap<>();
        initializeConfig();
    }

    /**
     * Initialize configuration files
     */
    private void initializeConfig() {
        // Main config file
        configFile = new File(plugin.getDataFolder(), "config.yml");
        if (!configFile.exists()) {
            plugin.saveResource("config.yml", false);
        }

        // Worlds config file
        worldsConfigFile = new File(plugin.getDataFolder(), "worlds.yml");
        if (!worldsConfigFile.exists()) {
            plugin.saveResource("worlds.yml", false);
        }
    }

    /**
     * Load all configuration
     */
    public void loadConfiguration() {
        plugin.getLogger().info("⚙️ Loading BlueMap configuration...");

        // Load main config
        config = YamlConfiguration.loadConfiguration(configFile);
        loadMainConfig();

        // Load worlds config
        worldsConfig = YamlConfiguration.loadConfiguration(worldsConfigFile);
        loadWorldsConfig();

        validateConfiguration();

        plugin.getLogger().info("✅ Configuration loaded successfully");
        plugin.getLogger().info("🌐 API URL: " + apiUrl);
        plugin.getLogger().info("🆔 Server ID: " + serverId);
        plugin.getLogger().info("🏷️ Server Name: " + serverName);
        plugin.getLogger().info("🔧 Data Collection Interval: " + dataCollectionInterval + "s");
    }

    /**
     * Load main configuration section
     */
    private void loadMainConfig() {
        // API Settings
        apiUrl = config.getString("api.url", "https://api.bluemap.lerncraft.xyz");
        serverId = config.getString("server.id", "unknown");
        serverName = config.getString("server.name", "Unknown Server");

        // Core Settings
        enabled = config.getBoolean("enabled", true);
        dataCollectionInterval = config.getInt("performance.data_collection_interval", 30);
        performanceCheckInterval = config.getInt("performance.performance_check_interval", 60);

        // Feature Settings
        enableEntityTracking = config.getBoolean("features.entity_tracking", true);
        enableMarkerCollection = config.getBoolean("features.marker_collection", true);
        enableChunkScanning = config.getBoolean("features.chunk_scanning", true);

        // Limits
        maxWorldsToScan = config.getInt("limits.max_worlds_to_scan", 5);
    }

    /**
     * Load world-specific configurations
     */
    private void loadWorldsConfig() {
        plugin.getLogger().info("🌍 Loading world configurations...");

        if (worldsConfig.contains("worlds")) {
            for (String worldName : worldsConfig.getConfigurationSection("worlds").getKeys(false)) {
                WorldConfig worldConfig = new WorldConfig();
                worldConfig.setEnabled(worldsConfig.getBoolean("worlds." + worldName + ".enabled", true));
                worldConfig.setBlueMapEnabled(worldsConfig.getBoolean("worlds." + worldName + ".bluemap_enabled", true));
                worldConfig.setScanRadius(worldsConfig.getInt("worlds." + worldName + ".scan_radius", 1000));
                worldConfig.setUpdateInterval(worldsConfig.getInt("worlds." + worldName + ".update_interval", 300));
                worldConfig.setPriority(worldsConfig.getInt("worlds." + worldName + ".priority", 1));

                // Load marker settings
                List<String> markerTypes = worldsConfig.getStringList("worlds." + worldName + ".marker_types");
                worldConfig.setMarkerTypes(markerTypes);

                worldConfigs.put(worldName, worldConfig);
                plugin.getLogger().info("📄 World config loaded: " + worldName);
            }
        }

        // Add any missing worlds with default settings
        plugin.getServer().getWorlds().forEach(world -> {
            if (!worldConfigs.containsKey(world.getName())) {
                WorldConfig defaultConfig = new WorldConfig();
                defaultConfig.setEnabled(true);
                defaultConfig.setBlueMapEnabled(true);
                defaultConfig.setScanRadius(1000);
                defaultConfig.setUpdateInterval(300);
                defaultConfig.setPriority(1);
                defaultConfig.setMarkerTypes(List.of("players", "markers", "regions"));

                worldConfigs.put(world.getName(), defaultConfig);
                plugin.getLogger().info("➕ Added default config for world: " + world.getName());
            }
        });
    }

    /**
     * Validate configuration values
     */
    private void validateConfiguration() {
        // Validate API URL
        if (apiUrl == null || apiUrl.trim().isEmpty()) {
            plugin.getLogger().warning("⚠️ API URL is not set, using default");
            apiUrl = "https://api.bluemap.lerncraft.xyz";
        }

        // Validate server ID
        if (serverId == null || serverId.trim().isEmpty() || serverId.equals("unknown")) {
            plugin.getLogger().warning("⚠️ Server ID is not set, using server name");
            serverId = serverName.replaceAll("[^a-zA-Z0-9]", "_").toLowerCase();
        }

        // Validate intervals
        if (dataCollectionInterval < 5) {
            plugin.getLogger().warning("⚠️ Data collection interval too low, setting to 5 seconds");
            dataCollectionInterval = 5;
        }

        if (performanceCheckInterval < 10) {
            plugin.getLogger().warning("⚠️ Performance check interval too low, setting to 10 seconds");
            performanceCheckInterval = 10;
        }

        // Validate world count
        if (maxWorldsToScan < 1) {
            plugin.getLogger().warning("⚠️ Max worlds to scan is less than 1, setting to 1");
            maxWorldsToScan = 1;
        }
    }

    /**
     * Reload configuration
     */
    public void reloadConfiguration() {
        plugin.getLogger().info("🔄 Reloading BlueMap configuration...");
        loadConfiguration();
    }

    /**
     * Save configuration
     */
    public void saveConfiguration() {
        try {
            // Save main config
            config.save(configFile);

            // Save worlds config
            worldsConfig.save(worldsConfigFile);

            plugin.getLogger().info("✅ Configuration saved");

        } catch (IOException e) {
            plugin.getLogger().log(Level.SEVERE, "❌ Failed to save configuration", e);
        }
    }

    /**
     * Update a specific world configuration
     */
    public void updateWorldConfig(String worldName, WorldConfig config) {
        worldConfigs.put(worldName, config);

        // Update worlds config file
        worldsConfig.set("worlds." + worldName + ".enabled", config.isEnabled());
        worldsConfig.set("worlds." + worldName + ".bluemap_enabled", config.isBlueMapEnabled());
        worldsConfig.set("worlds." + worldName + ".scan_radius", config.getScanRadius());
        worldsConfig.set("worlds." + worldName + ".update_interval", config.getUpdateInterval());
        worldsConfig.set("worlds." + worldName + ".priority", config.getPriority());
        worldsConfig.set("worlds." + worldName + ".marker_types", config.getMarkerTypes());

        saveConfiguration();
    }

    // Getters
    public String getApiUrl() { return apiUrl; }
    public String getServerId() { return serverId; }
    public String getServerName() { return serverName; }
    public boolean isEnabled() { return enabled; }
    public int getDataCollectionInterval() { return dataCollectionInterval; }
    public int getPerformanceCheckInterval() { return performanceCheckInterval; }
    public boolean isEntityTrackingEnabled() { return enableEntityTracking; }
    public boolean isMarkerCollectionEnabled() { return enableMarkerCollection; }
    public boolean isChunkScanningEnabled() { return enableChunkScanning; }
    public int getMaxWorldsToScan() { return maxWorldsToScan; }
    public Map<String, WorldConfig> getWorldConfigs() { return worldConfigs; }

    /**
     * Get world configuration for a specific world
     */
    public WorldConfig getWorldConfig(String worldName) {
        return worldConfigs.getOrDefault(worldName, new WorldConfig());
    }

    /**
     * Check if a world is enabled for BlueMap
     */
    public boolean isWorldEnabled(String worldName) {
        WorldConfig config = getWorldConfig(worldName);
        return config.isEnabled() && config.isBlueMapEnabled() && enabled;
    }

    /**
     * World configuration class
     */
    public static class WorldConfig {
        private boolean enabled = true;
        private boolean bluemapEnabled = true;
        private int scanRadius = 1000;
        private int updateInterval = 300;
        private int priority = 1;
        private List<String> markerTypes = List.of("players", "markers", "regions");

        // Getters and setters
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }

        public boolean isBlueMapEnabled() { return bluemapEnabled; }
        public void setBlueMapEnabled(boolean bluemapEnabled) { this.bluemapEnabled = bluemapEnabled; }

        public int getScanRadius() { return scanRadius; }
        public void setScanRadius(int scanRadius) { this.scanRadius = scanRadius; }

        public int getUpdateInterval() { return updateInterval; }
        public void setUpdateInterval(int updateInterval) { this.updateInterval = updateInterval; }

        public int getPriority() { return priority; }
        public void setPriority(int priority) { this.priority = priority; }

        public List<String> getMarkerTypes() { return markerTypes; }
        public void setMarkerTypes(List<String> markerTypes) { this.markerTypes = markerTypes; }
    }
}