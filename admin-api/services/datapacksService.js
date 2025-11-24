const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') {
        throw new Error('Invalid input: must be a non-empty string.');
    }
    // Add more validation rules as needed
    return input;
};

const fs = require('fs').promises;
const path = require('path');
const { isValidServer } = require('./serversService'); // Reuse the server validation

// Sanitize server name to prevent path traversal
const sanitizeServerName = (server) => {
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }
    return server;
};

// Sanitize datapack directory name to prevent path traversal
const sanitizeDatapackDir = (datapackDir) => {
    if (!datapackDir || typeof datapackDir !== 'string') {
        throw new Error('Invalid datapack directory name');
    }

    // Check for path traversal attempts
    if (datapackDir.includes('../') || datapackDir.includes('..\\') || datapackDir.startsWith('..')) {
        throw new Error('Invalid datapack directory name: path traversal detected');
    }

    return datapackDir;
};

const getDatapacks = async (server) => {
    const sanitizedServer = sanitizeServerName(server);
    const serverPath = path.join(__dirname, '..', sanitizedServer, 'datapacks');
    const files = await fs.readdir(serverPath);
    // Filter out any potentially dangerous filenames
    const safeFiles = files.filter(file => {
        return !file.includes('../') && !file.includes('..\\') && !file.startsWith('..');
    });

    const datapacks = await Promise.all(safeFiles.map(async (file) => {
        const filePath = path.join(serverPath, file);
        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                const match = file.match(/^(.*?)\s+v([\d\.]+(?:\s*[-\w]*)*)\s+\((MC\s+[\d\.\-\w]+)\)/);
                if (match) {
                    return {
                        name: match[1],
                        version: match[2],
                        gameVersion: match[3],
                        directory: file
                    };
                } else {
                    return {
                        name: file,
                        version: 'unknown',
                        gameVersion: 'unknown',
                        directory: file
                    };
                }
            }
        } catch (error) {
            // If stat fails (e.g., broken symlink), skip this file
            return null;
        }
    }));

    // Filter out null values
    return datapacks.filter(dp => dp !== null);
};

const installDatapack = async (server, datapackName, version) => {
    const sanitizedServer = sanitizeServerName(server);
    const sanitizedDatapackName = sanitizeInput(datapackName);
    const sanitizedVersion = sanitizeInput(version);

    const datapack = allDatapacks.find(dp =>
        dp.name.toLowerCase() === sanitizedDatapackName.toLowerCase() && dp.version === sanitizedVersion
    );
    if (!datapack) {
        throw new Error(`Datapack ${sanitizedDatapackName} v${sanitizedVersion} not found in repository`);
    }

    const datapackDirPath = path.join(__dirname, '..', sanitizedServer, 'datapacks');
    await fs.mkdir(datapackDirPath, { recursive: true });

    const directoryName = `${datapack.name} v${datapack.version} (${datapack.gameVersion})`;

    // Additional check to prevent path traversal in the directory name itself
    if (directoryName.includes('../') || directoryName.includes('..\\\\') || directoryName.startsWith('..')) {
        throw new Error('Invalid datapack directory name: path traversal detected');
    }

    const fullDatapackPath = path.join(datapackDirPath, directoryName);

    try {
        await fs.access(fullDatapackPath);
        throw new Error(`Datapack ${datapack.name} v${datapack.version} is already installed`);
    } catch (err) {
        // Directory doesn't exist, which is what we want
    }

    await fs.mkdir(fullDatapackPath, { recursive: true });
    const packMcmeta = {
        pack: {
            pack_format: 15,
            description: datapack.description
        }
    };
    await fs.writeFile(
        path.join(fullDatapackPath, 'pack.mcmeta'),
        JSON.stringify(packMcmeta, null, 2)
    );
};

const uninstallDatapack = async (server, datapackDir) => {
    const sanitizedServer = sanitizeServerName(server);
    const sanitizedDatapackDir = sanitizeDatapackDir(datapackDir);

    const datapackDirPath = path.join(__dirname, '..', sanitizedServer, 'datapacks', sanitizedDatapackDir);
    try {
        await fs.rm(datapackDirPath, { recursive: true, force: true });
    } catch (error) {
        // Log the error and re-throw a more specific error
        console.error(`Error removing datapack directory: ${datapackDirPath}`, error);
        throw new Error(`Failed to uninstall datapack: ${sanitizedDatapackDir}`);
    }
};

const searchDatapacks = async (query) => {
const allDatapacks = require('../datapacks.json');
    if (query) {
        return allDatapacks.filter(dp =>
            dp.name.toLowerCase().includes(query.toLowerCase())
        );
    }
    return allDatapacks;
};

module.exports = {
    getDatapacks,
    installDatapack,
    uninstallDatapack,
    searchDatapacks,
};
