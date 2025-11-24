const fs = require('fs').promises;
const path = require('path');

const getDatapacks = async (server) => {
    const serverPath = path.join(__dirname, '..', server, 'datapacks');
    const files = await fs.readdir(serverPath);
    const datapacks = files.filter(async (file) => {
        const filePath = path.join(serverPath, file);
        const stats = await fs.stat(filePath);
        return stats.isDirectory();
    }).map((datapackDir) => {
        const match = datapackDir.match(/^(.*?)\\s+v([\\d\\.]+(?:\\s*[-\\w]*)*)\\s+\\((MC\\s+[\\d\\.\\-\\w]+)\\)/);
        if (match) {
            return {
                name: match[1],
                version: match[2],
                gameVersion: match[3],
                directory: datapackDir
            };
        } else {
            return {
                name: datapackDir,
                version: 'unknown',
                gameVersion: 'unknown',
                directory: datapackDir
            };
        }
    });
    return datapacks;
};

const installDatapack = async (server, datapackName, version) => {
    const allDatapacks = [
        { name: "afk display", version: "1.1.14", gameVersion: "MC 1.21-1.21.10", description: "Shows AFK status for players" },
        { name: "armor statues", version: "2.8.20", gameVersion: "MC 1.21-1.21.10", description: "Create armor stand statues" },
        { name: "cauldron concrete", version: "3.0.7", gameVersion: "MC 1.21-1.21.10", description: "New concrete crafting with cauldrons" },
        { name: "cauldron mud", version: "1.0.7", gameVersion: "MC 1.21-1.21.10", description: "Mud creation using cauldrons" },
        { name: "chunk loaders", version: "1.0.15", gameVersion: "MC 1.21-1.21.10", description: "Keep chunks loaded automatically" },
        { name: "custom nether portals", version: "2.3.17", gameVersion: "MC 1.21-1.21.10", description: "Custom nether portal shapes and sizes" },
        { name: "ender chest always drops", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Ender chests always drop when broken" },
        { name: "fast leaf decay", version: "2.0.19", gameVersion: "MC 1.21-1.21.10", description: "Leaves decay faster when trees are cut" },
        { name: "graves", version: "4.0.4", gameVersion: "MC 1.21-1.21.10", description: "Player graves automatically created on death" },
        { name: "more effective tools", version: "1.0.8", gameVersion: "MC 1.21-1.21.10", description: "More effective tools with enhanced abilities" },
        { name: "name colors", version: "1.0.12", gameVersion: "MC 1.21-1.21.10", description: "Colorize player names in chat" },
        { name: "painting picker", version: "1.1.1", gameVersion: "MC 1.21-1.21.10", description: "Pick up paintings without destroying them" },
        { name: "silk touch budding amethyst", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Silk touch can be used on budding amethyst" },
        { name: "storm channeling", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Tridents gain channeling during storms" },
        { name: "track raw statistics", version: "1.7.10", gameVersion: "MC 1.21-1.21.10", description: "Track raw player statistics" },
        { name: "villager workstation highlights", version: "1.1.14", gameVersion: "MC 1.21-1.21.10", description: "Highlight villager workstation blocks" },
        { name: "wandering trader announcements", version: "1.0.7", gameVersion: "MC 1.21-1.21.10", description: "Announce wandering trader arrivals" }
    ];
    const datapack = allDatapacks.find(dp =>
        dp.name.toLowerCase() === datapackName.toLowerCase() && dp.version === version
    );
    if (!datapack) {
        throw new Error(`Datapack ${datapackName} v${version} not found in repository`);
    }
    const datapackDirPath = path.join(__dirname, '..', server, 'datapacks');
    await fs.mkdir(datapackDirPath, { recursive: true });
    const directoryName = `${datapack.name} v${datapack.version} (${datapack.gameVersion})`;
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
    const datapackDirPath = path.join(__dirname, '..', server, 'datapacks', datapackDir);
    await fs.rm(datapackDirPath, { recursive: true, force: true });
};

const searchDatapacks = async (query) => {
    const allDatapacks = [
        { name: "afk display", version: "1.1.14", gameVersion: "MC 1.21-1.21.10", description: "Shows AFK status for players" },
        { name: "armor statues", version: "2.8.20", gameVersion: "MC 1.21-1.21.10", description: "Create armor stand statues" },
        { name: "cauldron concrete", version: "3.0.7", gameVersion: "MC 1.21-1.21.10", description: "New concrete crafting with cauldrons" },
        { name: "cauldron mud", version: "1.0.7", gameVersion: "MC 1.21-1.21.10", description: "Mud creation using cauldrons" },
        { name: "chunk loaders", version: "1.0.15", gameVersion: "MC 1.21-1.21.10", description: "Keep chunks loaded automatically" },
        { name: "custom nether portals", version: "2.3.17", gameVersion: "MC 1.21-1.21.10", description: "Custom nether portal shapes and sizes" },
        { name: "ender chest always drops", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Ender chests always drop when broken" },
        { name: "fast leaf decay", version: "2.0.19", gameVersion: "MC 1.21-1.21.10", description: "Leaves decay faster when trees are cut" },
        { name: "graves", version: "4.0.4", gameVersion: "MC 1.21-1.21.10", description: "Player graves automatically created on death" },
        { name: "more effective tools", version: "1.0.8", gameVersion: "MC 1.21-1.21.10", description: "More effective tools with enhanced abilities" },
        { name: "name colors", version: "1.0.12", gameVersion: "MC 1.21-1.21.10", description: "Colorize player names in chat" },
        { name: "painting picker", version: "1.1.1", gameVersion: "MC 1.21-1.21.10", description: "Pick up paintings without destroying them" },
        { name: "silk touch budding amethyst", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Silk touch can be used on budding amethyst" },
        { name: "storm channeling", version: "1.0.6", gameVersion: "MC 1.21-1.21.10", description: "Tridents gain channeling during storms" },
        { name: "track raw statistics", version: "1.7.10", gameVersion: "MC 1.21-1.21.10", description: "Track raw player statistics" },
        { name: "villager workstation highlights", version: "1.1.14", gameVersion: "MC 1.21-1.21.10", description: "Highlight villager workstation blocks" },
        { name: "wandering trader announcements", version: "1.0.7", gameVersion: "MC 1.21-1.21.10", description: "Announce wandering trader arrivals" }
    ];
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
