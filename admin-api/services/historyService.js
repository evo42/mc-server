const logger = require('pino')();
const serversService = require('./serversService');

const history = {};
// Keep history for 24 hours. Assuming collection every minute.
const MAX_HISTORY_POINTS = 24 * 60; 

// Initialize history for all servers
serversService.ALLOWED_SERVERS.forEach(server => {
    history[server] = [];
});

const collectStats = async () => {
    try {
        const statuses = await serversService.getAllServerStatus();
        const timestamp = Date.now();

        Object.keys(statuses).forEach(server => {
            const status = statuses[server];
            if (!history[server]) history[server] = [];

            history[server].push({
                timestamp,
                playerCount: status.playerCount || 0,
                cpu: status.cpu || '0%',
                memory: status.memory || '0MB'
            });

            // Trim history
            if (history[server].length > MAX_HISTORY_POINTS) {
                history[server].shift();
            }
        });
    } catch (error) {
        logger.error({ err: error }, 'Error collecting history stats');
    }
};

const startCollection = () => {
    // Collect immediately
    collectStats();
    // Then every minute
    setInterval(collectStats, 60000);
};

const getHistory = (server) => {
    if (!serversService.isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }
    return history[server] || [];
};

module.exports = {
    startCollection,
    getHistory
};
