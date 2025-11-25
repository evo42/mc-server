const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const cacheService = require('./cacheService');

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

    const container = docker.getContainer(server);
    await container.start();

    // Clear cache for this server since its status has changed
    cacheService.clearServerCache(server);
    cacheService.clearAllServersStatus(); // Also clear the combined status cache
};

const stopServer = async (server) => {
    server = normalizeServerName(server);
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    const container = docker.getContainer(server);
    await container.stop();

    // Clear cache for this server since its status has changed
    cacheService.clearServerCache(server);
    cacheService.clearAllServersStatus(); // Also clear the combined status cache
};

const restartServer = async (server) => {
    server = normalizeServerName(server);
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    const container = docker.getContainer(server);
    await container.restart();

    // Clear cache for this server since its status has changed
    cacheService.clearServerCache(server);
    cacheService.clearAllServersStatus(); // Also clear the combined status cache
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
        const container = docker.getContainer(server);
        const data = await container.inspect();
        const stats = await container.stats({ stream: false });
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const cpu = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0;
        const memory = stats.memory_stats.usage;
        const status = {
            server: server,
            status: data.State.Status,
            rawStatus: data.State,
            players: [],
            playerCount: 0,
            memory: `${(memory / 1024 / 1024).toFixed(2)}MB`,
            cpu: `${cpu.toFixed(2)}%`
        };

        // Cache the status
        cacheService.setServerStatus(server, status);

        return status;
    } catch (error) {
        if (error.statusCode === 404) {
            const status = {
                server: server,
                status: 'Stopped',
                rawStatus: 'container not found',
                players: [],
                playerCount: 0,
                memory: 'N/A',
                cpu: 'N/A'
            };

            // Cache the status even when container is not found
            cacheService.setServerStatus(server, status);

            return status;
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
