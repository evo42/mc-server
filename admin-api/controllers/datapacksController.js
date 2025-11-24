const logger = require('pino')();
const datapacksService = require('../services/datapacksService');

const getDatapacks = async (req, res) => {
    const server = req.params.server;
    try {
        const datapacks = await datapacksService.getDatapacks(server);
        res.json({ server: server, datapacks: datapacks });
    } catch (error) {
logger.error({ err: error, server: server }, `Error getting datapacks for ${server}`);
        res.status(500).json({ error: 'Failed to get datapacks', details: error.message });
    }
};

const installDatapack = async (req, res) => {
    const server = req.params.server;
    const body = req.body || {};
    const { datapackName, version } = body;

    // Validate required parameters
    if (!datapackName || !version) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'Both datapackName and version are required'
        });
    }

    try {
        await datapacksService.installDatapack(server, datapackName, version);
        res.json({ success: true, message: `Successfully installed ${datapackName} v${version} to ${server}` });
    } catch (error) {
        logger.error({ err: error, server: server, datapackName: datapackName }, `Error installing datapack ${datapackName} to ${server}`);
        res.status(500).json({ error: 'Failed to install datapack', details: error.message });
    }
};

const uninstallDatapack = async (req, res) => {
    const server = req.params.server;
    const body = req.body || {};
    const { datapackDir } = body;

    // Validate required parameter
    if (!datapackDir) {
        return res.status(400).json({
            error: 'Missing required field',
            details: 'datapackDir is required'
        });
    }

    try {
        await datapacksService.uninstallDatapack(server, datapackDir);
        res.json({ success: true, message: `Successfully uninstalled ${datapackDir} from ${server}` });
    } catch (error) {
        logger.error({ err: error, server: server, datapackDir: datapackDir }, `Error uninstalling datapack ${datapackDir} from ${server}`);
        res.status(500).json({ error: 'Failed to uninstall datapack', details: error.message });
    }
};

const searchDatapacks = async (req, res) => {
    const { query } = req.query;
    try {
        const datapacks = await datapacksService.searchDatapacks(query);
        res.json({ datapacks: datapacks, total: datapacks.length });
    } catch (error) {
logger.error({ err: error, query: query }, 'Error searching for datapacks');
        res.status(500).json({ error: 'Failed to search for datapacks', details: error.message });
    }
};

module.exports = {
    getDatapacks,
    installDatapack,
    uninstallDatapack,
    searchDatapacks,
};
