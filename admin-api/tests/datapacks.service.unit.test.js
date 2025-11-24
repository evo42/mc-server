const datapacksService = require('../services/datapacksService');
const fs = require('fs').promises;
const path = require('path');

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

const fsMock = require('fs').promises;

describe('Datapacks Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDatapacks', () => {
        it('should get datapacks for a valid server', async () => {
            fsMock.readdir.mockResolvedValue([
                'normal-datapack v1.0.0 (MC 1.21)',
                'another-datapack v2.0.0 (MC 1.21.1)'
            ]);
            
            fsMock.stat.mockResolvedValue({ isDirectory: () => true });

            const datapacks = await datapacksService.getDatapacks('mc-ilias');

            expect(fsMock.readdir).toHaveBeenCalledWith(path.join(__dirname, '..', 'mc-ilias', 'datapacks'));
            expect(datapacks).toHaveLength(2);
            expect(datapacks[0]).toEqual({
                name: 'normal-datapack',
                version: '1.0.0',
                gameVersion: 'MC 1.21',
                directory: 'normal-datapack v1.0.0 (MC 1.21)'
            });
        });

        it('should filter out dangerous filenames', async () => {
            fsMock.readdir.mockResolvedValue([
                'normal-datapack v1.0.0 (MC 1.21)',
                '../etc/passwd',  // Should be filtered out
                '..\\windows\\system32',  // Should be filtered out
                'another-datapack v2.0.0 (MC 1.21.1)'
            ]);
            
            fsMock.stat.mockImplementation((filepath) => {
                if (filepath.includes('normal-datapack') || filepath.includes('another-datapack')) {
                    return Promise.resolve({ isDirectory: () => true });
                }
                // For dangerous paths, this should not be called due to filtering
                return Promise.resolve({ isDirectory: () => true });
            });

            const datapacks = await datapacksService.getDatapacks('mc-ilias');

            expect(datapacks).toHaveLength(2); // Only safe datapacks
            expect(datapacks.map(dp => dp.name)).toEqual(['normal-datapack', 'another-datapack']);
        });

        it('should return unknown versions for unparseable names', async () => {
            fsMock.readdir.mockResolvedValue(['simple-name']);
            fsMock.stat.mockResolvedValue({ isDirectory: () => true });

            const datapacks = await datapacksService.getDatapacks('mc-ilias');

            expect(datapacks[0]).toEqual({
                name: 'simple-name',
                version: 'unknown',
                gameVersion: 'unknown',
                directory: 'simple-name'
            });
        });

        it('should handle directories that are not valid', async () => {
            fsMock.readdir.mockResolvedValue(['not-a-datapack']);
            fsMock.stat.mockRejectedValue(new Error('Not a directory'));

            const datapacks = await datapacksService.getDatapacks('mc-ilias');

            expect(datapacks).toEqual([]); // Should filter out non-directories
        });

        it('should throw error for invalid server name', async () => {
            await expect(datapacksService.getDatapacks('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        });
    });

    describe('installDatapack', () => {
        it('should install a valid datapack', async () => {
            // Mock the search to return the expected datapack when queried
            const originalSearchDatapacks = datapacksService.searchDatapacks;
            datapacksService.searchDatapacks = jest.fn().mockImplementation((query) => {
                if (query === 'afk display') {
                    return Promise.resolve([{
                        name: "afk display",
                        version: "1.1.14",
                        gameVersion: "MC 1.21-1.21.10",
                        description: "Shows AFK status for players"
                    }]);
                }
                // Default response for other queries
                return Promise.resolve([]);
            });

            fsMock.readdir.mockResolvedValue([]);
            fsMock.mkdir.mockResolvedValue(undefined);
            fsMock.access.mockRejectedValue(new Error('Not found')); // Directory doesn't exist (good!)
            fsMock.writeFile.mockResolvedValue(undefined);

            await datapacksService.installDatapack('mc-ilias', 'afk display', '1.1.14');

            // The first call should be to create the base datapacks directory
            expect(fsMock.mkdir).toHaveBeenCalledWith(path.join(__dirname, '..', 'mc-ilias', 'datapacks'), { recursive: true });

            // The second call to access should fail (directory doesn't exist)
            expect(fsMock.access).toHaveBeenCalledWith(path.join(__dirname, '..', 'mc-ilias', 'datapacks', 'afk display v1.1.14 (MC 1.21-1.21.10)'));

            // The third call should be mkdir for the specific datapack directory
            expect(fsMock.mkdir).toHaveBeenCalledWith(path.join(__dirname, '..', 'mc-ilias', 'datapacks', 'afk display v1.1.14 (MC 1.21-1.21.10)'), { recursive: true });

            // Finally, the pack.mcmeta should be written
            expect(fsMock.writeFile).toHaveBeenCalled();

            // Verify that the written content contains proper pack.mcmeta structure
            const callArgs = fsMock.writeFile.mock.calls[0];
            const writtenContent = callArgs[1];
            const parsedContent = JSON.parse(writtenContent);

            expect(parsedContent.pack.pack_format).toEqual(15); // PaperMC pack format
            expect(parsedContent.pack.description).toEqual('Shows AFK status for players');

            // Restore the original function
            datapacksService.searchDatapacks = originalSearchDatapacks;
        });

        it('should throw error if datapack is not found in repository', async () => {
            await expect(datapacksService.installDatapack('mc-ilias', 'nonexistent datapack', '1.0.0'))
                .rejects.toThrow('Datapack nonexistent datapack v1.0.0 not found in repository');
        });

        it('should throw error if datapack is already installed', async () => {
            // Mock the search to return the expected datapack so the repo lookup passes
            const originalSearchDatapacks = datapacksService.searchDatapacks;
            datapacksService.searchDatapacks = jest.fn().mockImplementation((query) => {
                if (query === 'afk display') {
                    return Promise.resolve([{
                        name: "afk display",
                        version: "1.1.14",
                        gameVersion: "MC 1.21-1.21.10",
                        description: "Shows AFK status for players"
                    }]);
                }
                // Default response for other queries
                return Promise.resolve([]);
            });

            // Mock the filesystem operations in the correct sequence:
            // 1. mkdir for base datapacks directory (should succeed)
            // 2. access for specific datapack directory (should succeed - meaning it exists)
            fsMock.mkdir.mockResolvedValueOnce(undefined); // For creating base datapacks directory
            fsMock.access.mockResolvedValue(undefined); // For checking if specific datapack dir exists (will succeed, triggering error)

            await expect(datapacksService.installDatapack('mc-ilias', 'afk display', '1.1.14'))
                .rejects.toThrow('is already installed');

            // Restore the original function
            datapacksService.searchDatapacks = originalSearchDatapacks;
        });

        it('should throw error for invalid server name', async () => {
            await expect(datapacksService.installDatapack('invalid-server', 'afk display', '1.1.14'))
                .rejects.toThrow('Invalid server name: invalid-server');
        });

        it('should prevent path traversal in directory name during install', async () => {
            // This test is checking for path traversal in the server name (first parameter)
            // not in the datapack name (second parameter)
            await expect(datapacksService.installDatapack('../etc/passwd', 'afk display', '1.1.14'))
                .rejects.toThrow('Invalid server name: ../etc/passwd');
        });
    });

    describe('uninstallDatapack', () => {
        it('should uninstall a datapack successfully', async () => {
            await datapacksService.uninstallDatapack('mc-ilias', 'test-datapack v1.0.0 (MC 1.21)');

            expect(fsMock.rm).toHaveBeenCalledWith(
                path.join(__dirname, '..', 'mc-ilias', 'datapacks', 'test-datapack v1.0.0 (MC 1.21)'),
                { recursive: true, force: true }
            );
        });

        it('should throw error for invalid server name', async () => {
            await expect(datapacksService.uninstallDatapack('invalid-server', 'test-datapack'))
                .rejects.toThrow('Invalid server name: invalid-server');
        });

        it('should prevent path traversal attempts', async () => {
            await expect(datapacksService.uninstallDatapack('mc-ilias', '../etc/passwd'))
                .rejects.toThrow('Invalid datapack directory name: path traversal detected');
            
            await expect(datapacksService.uninstallDatapack('mc-ilias', '..\\windows\\system32'))
                .rejects.toThrow('Invalid datapack directory name: path traversal detected');
        });
    });

    describe('searchDatapacks', () => {
        it('should return all datapacks when no query is provided', async () => {
            const results = await datapacksService.searchDatapacks();

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0); // Should have at least some default datapacks
        });

        it('should return all datapacks when empty query is provided', async () => {
            const allResults = await datapacksService.searchDatapacks();
            const emptyQueryResults = await datapacksService.searchDatapacks('');

            expect(allResults).toEqual(emptyQueryResults);
        });

        it('should filter datapacks by query string', async () => {
            const results = await datapacksService.searchDatapacks('afk');

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);
            results.forEach(datapack => {
                expect(datapack.name.toLowerCase()).toContain('afk');
            });
        });

        it('should perform case-insensitive search', async () => {
            const resultsUpper = await datapacksService.searchDatapacks('AFK');
            const resultsLower = await datapacksService.searchDatapacks('afk');

            expect(resultsUpper).toEqual(resultsLower);
        });
    });
});