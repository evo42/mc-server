const logger = require('pino')();
const datapacksService = require('../services/datapacksService');
const { asyncHandler } = require('../middleware/errorHandler');
const { logWithCorrelationId } = require('../middleware/correlationId');
const auditLogService = require('../services/auditLogService');

const getDatapacks = async (req, res, next) => {
    const server = req.params.server;
    const { page = 1, limit = 20 } = req.query;

    try {
        logWithCorrelationId(logger, req, 'debug', `Getting datapacks for server ${server}`, { server, page, limit });

        // Convert page and limit to numbers
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        // Validate pagination parameters
        if (isNaN(pageNum) || pageNum < 1) {
            const error = new Error('Invalid page number');
            error.statusCode = 400;
            return next(error);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            const error = new Error('Limit must be between 1 and 100');
            error.statusCode = 400;
            return next(error);
        }

        const datapacks = await datapacksService.getDatapacks(server);
        const total = datapacks.length;

        // Calculate pagination
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedDatapacks = datapacks.slice(startIndex, endIndex);

        res.json({
            server: server,
            datapacks: paginatedDatapacks,
            total: total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            hasNext: endIndex < total,
            hasPrev: pageNum > 1
        });
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error getting datapacks for ${server}`, { server, error: error.message });
        // Pass error to the error handling middleware
        next(error);
    }
};

const installDatapack = async (req, res, next) => {
    const server = req.params.server;
    const body = req.body || {};
    const { datapackName, version } = body;

    // Validate required parameters
    if (!datapackName || !version) {
        const error = new Error('Missing required fields. Both datapackName and version are required');
        error.statusCode = 400;
        return next(error);
    }

    try {
        logWithCorrelationId(logger, req, 'info', `Installing datapack ${datapackName} v${version} to ${server}`, {
            server,
            datapackName,
            version
        });

        await datapacksService.installDatapack(server, datapackName, version);

        // Audit log the action
        auditLogService.logDatapackAction('INSTALL', req, datapackName, server, { version });

        res.json({ success: true, message: `Successfully installed ${datapackName} v${version} to ${server}` });
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error installing datapack ${datapackName} to ${server}`, {
            server,
            datapackName,
            error: error.message
        });
        // Pass error to the error handling middleware
        next(error);
    }
};

const uninstallDatapack = async (req, res, next) => {
    const server = req.params.server;
    const body = req.body || {};
    const { datapackDir } = body;

    // Validate required parameter
    if (!datapackDir) {
        const error = new Error('Missing required field: datapackDir is required');
        error.statusCode = 400;
        return next(error);
    }

    try {
        logWithCorrelationId(logger, req, 'info', `Uninstalling datapack ${datapackDir} from ${server}`, {
            server,
            datapackDir
        });

        await datapacksService.uninstallDatapack(server, datapackDir);

        // Audit log the action
        auditLogService.logDatapackAction('UNINSTALL', req, datapackDir, server);

        res.json({ success: true, message: `Successfully uninstalled ${datapackDir} from ${server}` });
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error uninstalling datapack ${datapackDir} from ${server}`, {
            server,
            datapackDir,
            error: error.message
        });
        // Pass error to the error handling middleware
        next(error);
    }
};

const searchDatapacks = async (req, res, next) => {
    const { query = '', page = 1, limit = 20 } = req.query;

    try {
        logWithCorrelationId(logger, req, 'debug', 'Searching for datapacks', { query, page, limit });

        // Convert page and limit to numbers
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        // Validate pagination parameters
        if (isNaN(pageNum) || pageNum < 1) {
            const error = new Error('Invalid page number');
            error.statusCode = 400;
            return next(error);
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            const error = new Error('Limit must be between 1 and 100');
            error.statusCode = 400;
            return next(error);
        }

        const datapacks = await datapacksService.searchDatapacks(query);
        const total = datapacks.length;

        // Calculate pagination
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedDatapacks = datapacks.slice(startIndex, endIndex);

        res.json({
            datapacks: paginatedDatapacks,
            total: total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            hasNext: endIndex < total,
            hasPrev: pageNum > 1
        });
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', 'Error searching for datapacks', { query, error: error.message });
        // Pass error to the error handling middleware
        next(error);
    }
};

module.exports = {
    getDatapacks,
    installDatapack,
    uninstallDatapack,
    searchDatapacks,
};
