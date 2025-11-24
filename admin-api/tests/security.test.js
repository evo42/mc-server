// Create mocks before importing services to avoid initialization issues
const mockContainer = {
    start: jest.fn(),
    stop: jest.fn(),
    restart: jest.fn(),
    inspect: jest.fn(),
    stats: jest.fn()
};

const mockDocker = {
    getContainer: jest.fn(() => mockContainer)
};

// Mock the dockerode module before importing
jest.mock('dockerode', () => {
    return jest.fn(() => mockDocker);
});

// Mock the fs module for datapacksService
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readdir: jest.fn(),
        stat: jest.fn(),
        mkdir: jest.fn(),
        access: jest.fn(),
        writeFile: jest.fn(),
        rm: jest.fn(),
    }
}));

const serversService = require('../services/serversService');
const datapacksService = require('../services/datapacksService');
const fsMock = require('fs').promises;

describe('serversService with security validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should validate server name before starting', async () => {
        // Valid server name should work
        await expect(serversService.startServer('mc-ilias')).resolves.not.toThrow();
        expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
        expect(mockContainer.start).toHaveBeenCalled();
    });

    it('should reject invalid server names when starting', async () => {
        await expect(serversService.startServer('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        expect(mockDocker.getContainer).not.toHaveBeenCalledWith('invalid-server');
        expect(mockContainer.start).not.toHaveBeenCalled();
    });

    it('should reject invalid server names when stopping', async () => {
        await expect(serversService.stopServer('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        expect(mockDocker.getContainer).not.toHaveBeenCalledWith('invalid-server');
        expect(mockContainer.stop).not.toHaveBeenCalled();
    });

    it('should reject invalid server names when restarting', async () => {
        await expect(serversService.restartServer('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        expect(mockDocker.getContainer).not.toHaveBeenCalledWith('invalid-server');
        expect(mockContainer.restart).not.toHaveBeenCalled();
    });

    it('should reject invalid server names when getting status', async () => {
        await expect(serversService.getServerStatus('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        expect(mockDocker.getContainer).not.toHaveBeenCalledWith('invalid-server');
        expect(mockContainer.inspect).not.toHaveBeenCalled();
    });

    it('should correctly validate allowed servers', () => {
        expect(serversService.isValidServer('mc-ilias')).toBe(true);
        expect(serversService.isValidServer('mc-niilo')).toBe(true);
        expect(serversService.isValidServer('mc-bgstpoelten')).toBe(true);
        expect(serversService.isValidServer('mc-htlstp')).toBe(true);
        expect(serversService.isValidServer('mc-borgstpoelten')).toBe(true);
        expect(serversService.isValidServer('mc-hakstpoelten')).toBe(true);
        expect(serversService.isValidServer('mc-basop-bafep-stp')).toBe(true);
        expect(serversService.isValidServer('mc-play')).toBe(true);
        expect(serversService.isValidServer('invalid-server')).toBe(false);
    });

    it('should start a valid server', async () => {
        await serversService.startServer('mc-ilias');

        expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
        expect(mockContainer.start).toHaveBeenCalled();
    });

    it('should handle container stats when getting server status', async () => {
        const mockStats = {
            cpu_stats: {
                cpu_usage: { total_usage: 1000000000 },
                system_cpu_usage: 2000000000,
                online_cpus: 2
            },
            precpu_stats: {
                cpu_usage: { total_usage: 500000000 },
                system_cpu_usage: 1000000000
            },
            memory_stats: { usage: 104857600 } // 100MB in bytes
        };

        mockContainer.inspect.mockResolvedValue({
            State: {
                Status: 'running'
            }
        });
        mockContainer.stats.mockResolvedValue(mockStats);

        const status = await serversService.getServerStatus('mc-ilias');

        // Calculate expected CPU based on the formula in the service
        const cpuDelta = 1000000000 - 500000000; // current - previous
        const systemDelta = 2000000000 - 1000000000; // current - previous
        const expectedCpu = (cpuDelta / systemDelta) * 2 * 100.0; // online_cpus = 2

        expect(status).toEqual({
            server: 'mc-ilias',
            status: 'running',
            rawStatus: { Status: 'running' },
            players: [],
            playerCount: 0,
            memory: '100.00MB',
            cpu: `${expectedCpu.toFixed(2)}%`
        });
    });

    it('should return stopped status for non-existent containers', async () => {
        mockContainer.inspect.mockRejectedValue({ statusCode: 404 });

        const status = await serversService.getServerStatus('mc-ilias');

        expect(status).toEqual({
            server: 'mc-ilias',
            status: 'Stopped',
            rawStatus: 'container not found',
            players: [],
            playerCount: 0,
            memory: 'N/A',
            cpu: 'N/A'
        });
    });
});

describe('datapacksService with security validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject path traversal attempts in server name', async () => {
        await expect(datapacksService.getDatapacks('../invalid-server')).rejects.toThrow('Invalid server name: ../invalid-server');
        await expect(datapacksService.installDatapack('../invalid-server', 'test', '1.0.0')).rejects.toThrow('Invalid server name: ../invalid-server');
        await expect(datapacksService.uninstallDatapack('../invalid-server', 'test')).rejects.toThrow('Invalid server name: ../invalid-server');
    });

    it('should reject path traversal attempts in datapack directory name', async () => {
        await expect(datapacksService.uninstallDatapack('mc-ilias', '../etc/passwd')).rejects.toThrow('Invalid datapack directory name: path traversal detected');
        await expect(datapacksService.uninstallDatapack('mc-ilias', '..\\windows\\system32')).rejects.toThrow('Invalid datapack directory name: path traversal detected');
        await expect(datapacksService.uninstallDatapack('mc-ilias', 'normal-dir')).resolves.not.toThrow();
    });

    it('should filter dangerous filenames when getting datapacks', async () => {
        fsMock.readdir.mockResolvedValue([
            'normal-datapack',
            '../etc/passwd',  // Should be filtered out
            '..\\windows\\system32',  // Should be filtered out
            'another-datapack'
        ]);

        fsMock.stat.mockImplementation((filepath) => {
            if (filepath.includes('normal-datapack') || filepath.includes('another-datapack')) {
                return Promise.resolve({ isDirectory: () => true });
            }
            // For dangerous paths, we'd throw an error, but since they're filtered, this won't be called
            return Promise.resolve({ isDirectory: () => true });
        });

        const datapacks = await datapacksService.getDatapacks('mc-ilias');

        // Only safe datapacks should be returned
        expect(datapacks).toHaveLength(2);
        expect(datapacks.map(dp => dp.name)).toEqual(['normal-datapack', 'another-datapack']);
    });

    it('should install a valid datapack', async () => {
        fsMock.readdir.mockResolvedValue([]);
        fsMock.mkdir.mockResolvedValue(undefined);
        fsMock.access.mockRejectedValue(new Error('Not found')); // Directory doesn't exist (good!)
        fsMock.writeFile.mockResolvedValue(undefined);

        // Use a real datapack from the repository
        await datapacksService.installDatapack('mc-ilias', 'afk display', '1.1.14');

        expect(fsMock.writeFile).toHaveBeenCalled();
        // Check that the written content contains the expected description
        const writtenContent = fsMock.writeFile.mock.calls[0][1];
        expect(writtenContent).toContain('Shows AFK status for players');
    });

    it('should reject path traversal in datapack directory name during install', async () => {
        await expect(
            datapacksService.installDatapack('mc-ilias', '../etc/passwd', '1.0.0')
        ).rejects.toThrow();
    });

    it('should search for datapacks by query', async () => {
        const results = await datapacksService.searchDatapacks('afk');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name.toLowerCase()).toMatch(/afk/);
    });

    it('should return all datapacks when no query is provided', async () => {
        const allResults = await datapacksService.searchDatapacks();
        const queryResults = await datapacksService.searchDatapacks('');

        expect(allResults.length).toBeGreaterThan(0);
        expect(queryResults.length).toBeGreaterThan(0);
        expect(allResults).toEqual(queryResults);
    });
});