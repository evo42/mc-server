const serversService = require('../services/serversService');

const startServer = async (req, res) => {
    const server = req.params.server;
    try {
        await serversService.startServer(server);
        res.json({ success: true, message: `${server} started` });
    } catch (error) {
        console.error(`Error starting ${server}:`, error);
        res.status(500).json({ error: 'Failed to start server', details: error.message });
    }
};

const stopServer = async (req, res) => {
    const server = req.params.server;
    try {
        await serversService.stopServer(server);
        res.json({ success: true, message: `${server} stopped` });
    } catch (error) {
        console.error(`Error stopping ${server}:`, error);
        res.status(500).json({ error: 'Failed to stop server', details: error.message });
    }
};

const restartServer = async (req, res) => {
    const server = req.params.server;
    try {
        await serversService.restartServer(server);
        res.json({ success: true, message: `${server} restarted` });
    } catch (error) {
        console.error(`Error restarting ${server}:`, error);
        res.status(500).json({ error: 'Failed to restart server', details: error.message });
    }
};

const getServerStatus = async (req, res) => {
    const server = req.params.server;
    try {
        const status = await serversService.getServerStatus(server);
        res.json(status);
    } catch (error) {
        console.error(`Error getting status for ${server}:`, error);
        res.status(500).json({ error: 'Failed to get server status', details: error.message });
    }
};

const getAllServerStatus = async (req, res) => {
    try {
        const status = await serversService.getAllServerStatus();
        res.json(status);
    } catch (error) {
        console.error('Error getting status for all servers:', error);
        res.status(500).json({ error: 'Failed to get server status', details: error.message });
    }
};

module.exports = {
    startServer,
    stopServer,
    restartServer,
    getServerStatus,
    getAllServerStatus,
};
