package com.lerncraft.bluemap.communication;

import com.lerncraft.bluemap.BlueMapPlugin;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.websocket.*;
import java.io.IOException;
import java.net.URI;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

/**
 * WebSocket Client for BlueMap Plugin
 *
 * Handles real-time communication between Minecraft servers
 * and the BlueMap API backend using WebSocket protocol.
 * Provides bidirectional data flow for server status,
 * player tracking, and system metrics.
 *
 * @author Lerncraft Development Team
 * @version 1.0.0
 */
@ClientEndpoint
public class WebSocketClient {

    private final BlueMapPlugin plugin;
    private final String apiUrl;
    private final String serverId;
    private final String serverName;
    private final Gson gson;

    private Session session;
    private boolean connected = false;
    private int reconnectAttempts = 0;
    private final int maxReconnectAttempts = 5;
    private final long reconnectDelay = 5000; // 5 seconds

    private final ScheduledExecutorService heartbeatExecutor = Executors.newScheduledThreadPool(2);
    private final MessageQueue messageQueue;

    public WebSocketClient(BlueMapPlugin plugin, String apiUrl, String serverId, String serverName) {
        this.plugin = plugin;
        this.apiUrl = apiUrl + "/ws/bluemap";
        this.serverId = serverId;
        this.serverName = serverName;
        this.gson = new Gson();
        this.messageQueue = new MessageQueue();
    }

    /**
     * Connect to BlueMap WebSocket API
     */
    public boolean connect() {
        try {
            plugin.getLogger().info("🔗 Connecting to BlueMap WebSocket: " + apiUrl);

            // Build WebSocket URI
            URI webSocketUri = URI.create(apiUrl);

            // Create connection
            CompletableFuture<Boolean> connectFuture = new CompletableFuture<>();

            WebSocketContainer container = ContainerProvider.getWebSocketContainer();
            container.connectToServer(this, webSocketUri);

            // Wait for connection (with timeout)
            boolean success = connectFuture.get(10, TimeUnit.SECONDS);

            if (success) {
                connected = true;
                reconnectAttempts = 0;
                plugin.getLogger().info("✅ WebSocket connected successfully");

                // Start heartbeat
                startHeartbeat();

                // Start message processing
                startMessageProcessor();

                // Send authentication
                sendAuthentication();

                return true;
            } else {
                plugin.getLogger().warning("⚠️ WebSocket connection timeout");
                return false;
            }

        } catch (Exception e) {
            plugin.getLogger().log(Level.SEVERE, "❌ Failed to connect to WebSocket", e);
            return false;
        }
    }

    /**
     * Disconnect from WebSocket
     */
    public void disconnect() {
        try {
            connected = false;

            // Stop heartbeat
            heartbeatExecutor.shutdown();

            // Stop message processor
            messageQueue.stop();

            // Close session
            if (session != null && session.isOpen()) {
                session.close();
            }

            plugin.getLogger().info("🔌 WebSocket disconnected");

        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "⚠️ Error during WebSocket disconnect", e);
        }
    }

    /**
     * Send authentication message
     */
    private void sendAuthentication() {
        JsonObject authMessage = new JsonObject();
        authMessage.addProperty("type", "auth");
        authMessage.addProperty("server_id", serverId);
        authMessage.addProperty("server_name", serverName);
        authMessage.addProperty("plugin_version", plugin.getDescription().getVersion());
        authMessage.addProperty("minecraft_version", plugin.getServer().getVersion());
        authMessage.addProperty("timestamp", System.currentTimeMillis());

        sendRawMessage(authMessage.toString());
    }

    /**
     * Send a message to the WebSocket
     */
    public void sendMessage(String type, Object data) {
        if (!connected || session == null || !session.isOpen()) {
            plugin.getLogger().warning("⚠️ Cannot send message - WebSocket not connected");
            return;
        }

        try {
            JsonObject message = new JsonObject();
            message.addProperty("type", type);
            message.addProperty("server_id", serverId);
            message.addProperty("timestamp", System.currentTimeMillis());
            message.add("data", gson.toJsonTree(data));

            messageQueue.add(message.toString());

        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "⚠️ Failed to queue message", e);
        }
    }

    /**
     * Send raw message
     */
    private void sendRawMessage(String message) {
        if (!connected || session == null || !session.isOpen()) {
            plugin.getLogger().warning("⚠️ Cannot send message - WebSocket not connected");
            return;
        }

        try {
            session.getBasicRemote().sendText(message);
            plugin.getLogger().fine("📤 Sent WebSocket message: " + message);

        } catch (IOException e) {
            plugin.getLogger().log(Level.WARNING, "⚠️ Failed to send WebSocket message", e);
            handleConnectionLoss();
        }
    }

    /**
     * Start heartbeat mechanism
     */
    private void startHeartbeat() {
        heartbeatExecutor.scheduleAtFixedRate(() -> {
            if (connected) {
                JsonObject heartbeat = new JsonObject();
                heartbeat.addProperty("type", "heartbeat");
                heartbeat.addProperty("server_id", serverId);
                heartbeat.addProperty("timestamp", System.currentTimeMillis());

                sendRawMessage(heartbeat.toString());
            }
        }, 30, 30, TimeUnit.SECONDS);
    }

    /**
     * Start message processor
     */
    private void startMessageProcessor() {
        messageQueue.start(message -> {
            if (connected && session != null && session.isOpen()) {
                sendRawMessage(message);
            }
        });
    }

    /**
     * Handle connection loss
     */
    private void handleConnectionLoss() {
        connected = false;

        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            plugin.getLogger().warning("⚠️ WebSocket connection lost, retrying... (" + reconnectAttempts + "/" + maxReconnectAttempts + ")");

            heartbeatExecutor.schedule(() -> {
                connect();
            }, reconnectDelay, TimeUnit.MILLISECONDS);

        } else {
            plugin.getLogger().severe("❌ Max reconnection attempts reached, giving up");
        }
    }

    // WebSocket lifecycle methods
    @OnOpen
    public void onOpen(Session session) {
        this.session = session;
        plugin.getLogger().info("📡 WebSocket session opened");
    }

    @OnMessage
    public void onMessage(String message) {
        try {
            JsonObject jsonMessage = gson.fromJson(message, JsonObject.class);
            String messageType = jsonMessage.get("type").getAsString();

            plugin.getLogger().fine("📥 Received WebSocket message: " + messageType);

            switch (messageType) {
                case "auth_response":
                    handleAuthResponse(jsonMessage);
                    break;
                case "ping":
                    handlePing(jsonMessage);
                    break;
                case "request_data":
                    handleDataRequest(jsonMessage);
                    break;
                case "config_update":
                    handleConfigUpdate(jsonMessage);
                    break;
                default:
                    plugin.getLogger().warning("⚠️ Unknown message type: " + messageType);
            }

        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "⚠️ Failed to process WebSocket message", e);
        }
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        plugin.getLogger().info("📡 WebSocket session closed: " + closeReason.getReasonPhrase());
        connected = false;
        handleConnectionLoss();
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        plugin.getLogger().log(Level.SEVERE, "❌ WebSocket error", throwable);
        connected = false;
    }

    /**
     * Handle authentication response
     */
    private void handleAuthResponse(JsonObject message) {
        boolean success = message.get("success").getAsBoolean();

        if (success) {
            plugin.getLogger().info("✅ WebSocket authentication successful");
        } else {
            String error = message.has("error") ? message.get("error").getAsString() : "Unknown error";
            plugin.getLogger().severe("❌ WebSocket authentication failed: " + error);
        }
    }

    /**
     * Handle ping message
     */
    private void handlePing(JsonObject message) {
        // Respond with pong
        JsonObject pong = new JsonObject();
        pong.addProperty("type", "pong");
        pong.addProperty("timestamp", System.currentTimeMillis());

        sendRawMessage(pong.toString());
    }

    /**
     * Handle data request
     */
    private void handleDataRequest(JsonObject message) {
        String requestType = message.get("request_type").getAsString();

        switch (requestType) {
            case "server_status":
                plugin.getInstance().sendServerStatus();
                break;
            case "player_list":
                sendPlayerList();
                break;
            case "world_data":
                sendWorldData();
                break;
            case "performance_metrics":
                sendPerformanceMetrics();
                break;
        }
    }

    /**
     * Handle configuration update
     */
    private void handleConfigUpdate(JsonObject message) {
        plugin.getLogger().info("📋 Configuration update received");

        // Reload configuration
        plugin.getConfigManager().reloadConfiguration();

        // Restart data collection if needed
        plugin.getDataCollector().restart();
    }

    /**
     * Send player list
     */
    private void sendPlayerList() {
        var players = plugin.getServer().getOnlinePlayers();
        var playerData = players.stream()
            .map(player -> {
                JsonObject playerObj = new JsonObject();
                playerObj.addProperty("name", player.getName());
                playerObj.addProperty("uuid", player.getUniqueId().toString());
                playerObj.addProperty("world", player.getWorld().getName());
                playerObj.addProperty("x", player.getLocation().getX());
                playerObj.addProperty("y", player.getLocation().getY());
                playerObj.addProperty("z", player.getLocation().getZ());
                return playerObj;
            })
            .collect(java.util.stream.Collectors.toList());

        sendMessage("player_list", playerData);
    }

    /**
     * Send world data
     */
    private void sendWorldData() {
        var worlds = plugin.getServer().getWorlds();
        var worldData = worlds.stream()
            .map(world -> {
                JsonObject worldObj = new JsonObject();
                worldObj.addProperty("name", world.getName());
                worldObj.addProperty("players", world.getPlayers().size());
                worldObj.addProperty("loaded_chunks", world.getLoadedChunks().length);
                return worldObj;
            })
            .collect(java.util.stream.Collectors.toList());

        sendMessage("world_data", worldData);
    }

    /**
     * Send performance metrics
     */
    private void sendPerformanceMetrics() {
        var metrics = plugin.getPerformanceMonitor().getCurrentMetrics();
        sendMessage("performance_metrics", metrics);
    }

    /**
     * Check if WebSocket is connected
     */
    public boolean isConnected() {
        return connected && session != null && session.isOpen();
    }

    /**
     * Message queue for handling async message sending
     */
    private static class MessageQueue {
        private final java.util.Queue<String> queue = new java.util.concurrent.ConcurrentLinkedQueue<>();
        private volatile boolean running = false;
        private Thread processorThread;

        public void add(String message) {
            queue.offer(message);
        }

        public void start(java.util.function.Consumer<String> processor) {
            if (running) return;

            running = true;
            processorThread = new Thread(() -> {
                while (running) {
                    String message = queue.poll();
                    if (message != null) {
                        try {
                            processor.accept(message);
                        } catch (Exception e) {
                            // Log error but continue processing
                            System.err.println("Message processing error: " + e.getMessage());
                        }
                    } else {
                        try {
                            Thread.sleep(100); // Wait 100ms for new messages
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            });
            processorThread.setName("BlueMap-MessageProcessor");
            processorThread.start();
        }

        public void stop() {
            running = false;
            if (processorThread != null && processorThread.isAlive()) {
                processorThread.interrupt();
            }
        }
    }
}