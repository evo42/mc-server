const datapacksService = require('../services/datapacksService');

const getDatapacks = async (req, res) => {
    const server = req.params.server;
    try {
        const datapacks = await datapacksService.getDatapacks(server);
        res.json({ server: server, datapacks: datapacks });
    } catch (error) {
        console.error(`Error getting datapacks for ${server}:`, error);
        res.status(500).json({ error: 'Failed to get datapacks', details: error.message });
    }
};

const installDatapack = async (req, res) => {
    const server = req.params.server;
    const { datapackName, version } = req.body;
    try {
        await datapacksService.installDatapack(server, datapackName, version);
        res.json({ success: true, message: `Successfully installed ${datapackName} v${version} to ${server}` });
    } catch (error) {
        console.error(`Error installing datapack ${datapackName} to ${server}:`, error);
        res.status(500).json({ error: 'Failed to install datapack', details: error.message });
    }
};

const uninstallDatapack = async (req, res) => {
    const server = req.params.server;
    const { datapackDir } = req.body;
    try {
        await datapacksService.uninstallDatapack(server, datapackDir);
        res.json({ success: true, message: `Successfully uninstalled ${datapackDir} from ${server}` });
    } catch (error) {
        console.error(`Error uninstalling datapack ${datapackDir} from ${server}:`, error);
        res.status(500).json({ error: 'Failed to uninstall datapack', details: error.message });
    }
};

const searchDatapacks = async (req, res) => {
    const { query } = req.query;
    try {
        const datapacks = await datapacksService.searchDatapacks(query);
        res.json({ datapacks: datapacks, total: datapacks.length });
    } catch (error) {
        console.error('Error searching for datapacks:', error);
        res.status(500).json({ error: 'Failed to search for datapacks', details: error.message });
    }
};

module.exports = {
    getDatapacks,
    installDatapack,
    uninstallDatapack,
    searchDatapacks,
};
