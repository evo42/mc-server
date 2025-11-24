const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

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

// Validate if a server name is allowed
const isValidServer = (server) => {
    return ALLOWED_SERVERS.includes(server);
};

const startServer = async (server) => {
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    const container = docker.getContainer(server);
    await container.start();
};

const stopServer = async (server) => {
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    const container = docker.getContainer(server);
    await container.stop();
};

const restartServer = async (server) => {
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    const container = docker.getContainer(server);
    await container.restart();
};

const getServerStatus = async (server) => {
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }

    try {
        const container = docker.getContainer(server);
        const data = await container.inspect();
        const stats = await container.stats({ stream: false });
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const cpu = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0;
        const memory = stats.memory_stats.usage;
        return {
            server: server,
            status: data.State.Status,
            rawStatus: data.State,
            players: [],
            playerCount: 0,
            memory: `${(memory / 1024 / 1024).toFixed(2)}MB`,
            cpu: `${cpu.toFixed(2)}%`
        };
    } catch (error) {
        if (error.statusCode === 404) {
            return {
                server: server,
                status: 'Stopped',
                rawStatus: 'container not found',
                players: [],
                playerCount: 0,
                memory: 'N/A',
                cpu: 'N/A'
            };
        }
        throw error;
    }
};

const getAllServerStatus = async () => {
    const results = {};
    for (const server of ALLOWED_SERVERS) {
        results[server] = await getServerStatus(server);
    }
    return results;
};

module.exports = {
    startServer,
    stopServer,
    restartServer,
    getServerStatus,
    getAllServerStatus,
    isValidServer, // Export for testing
    ALLOWED_SERVERS // Export for reference
};
