const fs = require('fs').promises;
const path = require('path');
const allDatapacks = require('../datapacks.json');  // Import the datapack repository
const { isValidServer, normalizeServerName } = require('./serversService'); // Reuse the server validation

// Helper to resolve server datapacks path
const getServerDatapacksPath = (server) => {
    // Check if it's one of the root servers
    if (['mc-ilias', 'mc-niilo'].includes(server)) {
        return path.join(__dirname, '..', server, 'datapacks');
    }
    // Else assume it's in landing
    // Extract base name: mc-bgstpoelten -> bgstpoelten
    const baseName = server.replace(/^mc-/, '');
    return path.join(__dirname, '..', 'landing', `${baseName}-mc-landing`, 'datapacks');
};

// Sanitize server name to prevent path traversal
const sanitizeServerName = (server) => {
    server = normalizeServerName(server);
    if (!isValidServer(server)) {
        throw new Error(`Invalid server name: ${server}`);
    }
    return server;
};

// Sanitize datapack directory name
const sanitizeDatapackDir = (dir) => {
    if (!dir || typeof dir !== 'string') {
        throw new Error('Invalid datapack directory name');
    }
    // Only allow alphanumeric, spaces, dashes, dots, underscores, parenthesis, brackets
    if (!/^[a-zA-Z0-9 ._()\-\[\]]+$/.test(dir)) {
        throw new Error('Invalid datapack directory name: contains invalid characters');
    }
    if (dir.includes('..') || dir.includes('/') || dir.includes('\\')) {
        throw new Error('Invalid datapack directory name: path traversal detected');
    }
    return dir;
};

const getDatapacks = async (server) => {
    try {
        const sanitizedServer = sanitizeServerName(server);
        const datapacksPath = getServerDatapacksPath(sanitizedServer);
        
        try {
            await fs.access(datapacksPath);
        } catch (error) {
            // Directory doesn't exist, return empty array
            return [];
        }

        const files = await fs.readdir(datapacksPath);
        const datapacks = [];

        for (const file of files) {
            // Check if it's a directory
            const filePath = path.join(datapacksPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isDirectory()) {
                 // Try to parse name and version
                 // Format: "[Name] v[Version] (MC [GameVersion])"
                 const match = file.match(/^(.+) v([\d.]+) \(MC ([\d.]+)\)$/);
                 if (match) {
                     datapacks.push({
                         name: match[1],
                         version: match[2],
                         gameVersion: match[3],
                         directory: file
                     });
                 } else {
                     // Add as unknown format
                      datapacks.push({
                         name: file,
                         version: 'unknown',
                         gameVersion: 'unknown',
                         directory: file
                     });
                 }
            }
        }
        return datapacks;
    } catch (error) {
        throw error;
    }
};

const installDatapack = async (server, datapackName, version) => {
    const sanitizedServer = sanitizeServerName(server);
    
    // Find datapack in repo
    const datapack = allDatapacks.find(d => d.name === datapackName);
    if (!datapack) {
        throw new Error(`Datapack not found: ${datapackName}`);
    }

    // Check version
    const versionInfo = datapack.versions.find(v => v.version === version);
    if (!versionInfo) {
        throw new Error(`Version not found: ${version}`);
    }

    const datapacksPath = getServerDatapacksPath(sanitizedServer);
    const dirName = `${datapack.name} v${version} (MC ${versionInfo.gameVersion})`;
    const sanitizedDirName = sanitizeDatapackDir(dirName);
    const installPath = path.join(datapacksPath, sanitizedDirName);

    // Check if already installed
    try {
        await fs.access(installPath);
        throw new Error('Datapack version already installed');
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    // Create directory
    await fs.mkdir(installPath, { recursive: true });

    // Create pack.mcmeta
    const packMcmeta = {
        pack: {
            pack_format: 48, // 1.21
            description: `${datapack.name} v${version} - Installed via Admin UI`
        }
    };
    await fs.writeFile(path.join(installPath, 'pack.mcmeta'), JSON.stringify(packMcmeta, null, 4));
    
    return { success: true, message: 'Datapack installed' };
};

const uninstallDatapack = async (server, datapackDir) => {
    const sanitizedServer = sanitizeServerName(server);
    const sanitizedDir = sanitizeDatapackDir(datapackDir);
    
    const datapacksPath = getServerDatapacksPath(sanitizedServer);
    const targetPath = path.join(datapacksPath, sanitizedDir);

    try {
        await fs.rm(targetPath, { recursive: true, force: true });
        return { success: true, message: 'Datapack uninstalled' };
    } catch (error) {
        console.error('Error uninstalling datapack:', error);
        throw new Error('Failed to uninstall datapack');
    }
};

const searchDatapacks = async (query) => {
    if (!query) return allDatapacks;
    
    const lowerQuery = query.toLowerCase();
    return allDatapacks.filter(d => 
        d.name.toLowerCase().includes(lowerQuery) || 
        d.description.toLowerCase().includes(lowerQuery)
    );
};

module.exports = {
    getDatapacks,
    installDatapack,
    uninstallDatapack,
    searchDatapacks
};
