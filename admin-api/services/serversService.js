const axios = require('axios');
const cacheService = require('./cacheService');

// Get Docker proxy configuration
const DOCKER_PROXY_URL = process.env.DOCKER_PROXY_URL || 'http://docker-proxy:3001';
const DOCKER_PROXY_TOKEN = process.env.DOCKER_PROXY_TOKEN || 'docker-proxy-secret-token';

// Create axios instance with default config
const dockerProxy = axios.create({
    baseURL: DOCKER_PROXY_URL,
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Authorization': `Bearer ${DOCKER_PROXY_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Define allowed server names for security
const ALLOWED_SERVERS = [
    'mc-ilias',
    'mc-niilo',
    'mc-bgstpoelten',
    'mc-htlstp',
    'mc-borgstpoelten',
    'mc-hakstpoelten',
    'mc-basop-bafep-stp',
    'mc-play'
];

// Normalize server name (e.g. bgstpoelten -> mc-bgstpoelten)
const normalizeServerName = (server) => {
    if (!server) return server;
    if (ALLOWED_SERVERS.includes(server)) return server;
    if (ALLOWED_SERVERS.includes(`mc-${server}`)) return `mc-${server}`;
    return server; // Return original if not found (validation will fail)
};

// Validate if a server name is allowed
const isValidServer = (server) => {
    return ALLOWED_SERVERS.includes(normalizeServerName(server));
};

const startServer = async (server) => {
    server = normalizeServerName(server);
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    await makeProxyRequest('POST', `/containers/${server}/start`);

    // Clear cache for this server since its status has changed
    cacheService.clearServerCache(server);
    cacheService.clearAllServersStatus(); // Also clear the combined status cache
};

const stopServer = async (server) => {
    server = normalizeServerName(server);
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    await makeProxyRequest('POST', `/containers/${server}/stop`);

    // Clear cache for this server since its status has changed
    cacheService.clearServerCache(server);
    cacheService.clearAllServersStatus(); // Also clear the combined status cache
};

const restartServer = async (server) => {
    server = normalizeServerName(server);
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    await makeProxyRequest('POST', `/containers/${server}/restart`);

    // Clear cache for this server since its status has changed
    cacheService.clearServerCache(server);
    cacheService.clearAllServersStatus(); // Also clear the combined status cache
};

// Function to make requests to Docker proxy with error handling
const makeProxyRequest = async (method, url, data = null) => {
    try {
        const response = await dockerProxy({
            method,
            url,
            data
        });
        return response.data;
    } catch (error) {
        // Log the error but don't expose internal details
        console.error(`Docker proxy request failed: ${method} ${url}`, error.message);

        // Return a generic error that's safe to expose
        throw new Error(`Docker operation failed: ${error.message}`);
    }
};

const getServerStatus = async (server) => {
    server = normalizeServerName(server);
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    // Try to get from cache first
    const cachedStatus = cacheService.getServerStatus(server);
    if (cachedStatus) {
        return cachedStatus;
    }

    try {
        const status = await makeProxyRequest('GET', `/containers/${server}/status`);

        // Get additional stats if container is running
        let cpu = 'N/A';
        let memory = 'N/A';

        if (status.running) {
            try {
                const stats = await makeProxyRequest('GET', `/containers/${server}/stats`);

                // Calculate CPU usage
                if (stats.cpu_stats && stats.precpu_stats) {
                    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
                    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
                    if (systemDelta > 0) {
                        cpu = `${((cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0).toFixed(2)}%`;
                    }
                }

                // Get memory usage
                if (stats.memory_stats && stats.memory_stats.usage) {
                    memory = `${(stats.memory_stats.usage / 1024 / 1024).toFixed(2)}MB`;
                }
            } catch (statsError) {
                // If stats fetch fails, continue with N/A values
                console.warn(`Failed to get stats for ${server}:`, statsError.message);
            }
        }

        const result = {
            server: server,
            status: status.status,
            rawStatus: status,
            players: [],
            playerCount: 0,
            memory,
            cpu
        };

        // Cache the status
        cacheService.setServerStatus(server, result);

        return result;
    } catch (error) {
        // If proxy request fails, return a stopped status
        if (error.message.includes('404') || error.message.includes('not found')) {
            const result = {
                server: server,
                status: 'Stopped',
                rawStatus: 'container not found',
                players: [],
                playerCount: 0,
                memory: 'N/A',
                cpu: 'N/A'
            };

            // Cache the status
            cacheService.setServerStatus(server, result);

            return result;
        }
        throw error;
    }
};

const getAllServerStatus = async () => {
    // Try to get from cache first
    const cachedStatus = cacheService.getAllServersStatus();
    if (cachedStatus) {
        return cachedStatus;
    }

    const results = {};
    for (const server of ALLOWED_SERVERS) {
        results[server] = await getServerStatus(server);
    }

    // Cache the full results
    cacheService.setAllServersStatus(results);

    return results;
};

module.exports = {
    startServer,
    stopServer,
    restartServer,
    getServerStatus,
    getAllServerStatus,
    isValidServer, // Export for testing
    normalizeServerName,
    ALLOWED_SERVERS // Export for reference
};
