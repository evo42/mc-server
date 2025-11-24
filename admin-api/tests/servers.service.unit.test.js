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

const serversService = require('../services/serversService');

describe('Servers Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('startServer', () => {
        it('should start a server successfully', async () => {
            await serversService.startServer('mc-ilias');
            
            expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
            expect(mockContainer.start).toHaveBeenCalled();
        });

        it('should throw error for invalid server name', async () => {
            await expect(serversService.startServer('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        });
    });

    describe('stopServer', () => {
        it('should stop a server successfully', async () => {
            await serversService.stopServer('mc-ilias');
            
            expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
            expect(mockContainer.stop).toHaveBeenCalled();
        });

        it('should throw error for invalid server name', async () => {
            await expect(serversService.stopServer('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        });
    });

    describe('restartServer', () => {
        it('should restart a server successfully', async () => {
            await serversService.restartServer('mc-ilias');
            
            expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
            expect(mockContainer.restart).toHaveBeenCalled();
        });

        it('should throw error for invalid server name', async () => {
            await expect(serversService.restartServer('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        });
    });

    describe('getServerStatus', () => {
        it('should get server status successfully for running server', async () => {
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
            
            expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
            expect(mockContainer.inspect).toHaveBeenCalled();
            expect(mockContainer.stats).toHaveBeenCalledWith({ stream: false });
            
            const expectedCpu = ((1000000000 - 500000000) / (2000000000 - 1000000000)) * 2 * 100.0;
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

        it('should return stopped status for non-existent container', async () => {
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

        it('should throw error for other API failures', async () => {
            mockContainer.inspect.mockRejectedValue(new Error('API error'));
            
            await expect(serversService.getServerStatus('mc-ilias')).rejects.toThrow('API error');
        });

        it('should throw error for invalid server name', async () => {
            await expect(serversService.getServerStatus('invalid-server')).rejects.toThrow('Invalid server name: invalid-server');
        });
    });

    describe('getAllServerStatus', () => {
        it('should get status for all servers', async () => {
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
                memory_stats: { usage: 104857600 }
            };
            
            mockContainer.inspect.mockResolvedValue({
                State: { Status: 'running' }
            });
            mockContainer.stats.mockResolvedValue(mockStats);
            
            const status = await serversService.getAllServerStatus();
            
            // Should call getServerStatus for each allowed server
            serversService.ALLOWED_SERVERS.forEach(server => {
                expect(mockDocker.getContainer).toHaveBeenCalledWith(server);
            });
            
            // Verify that all expected servers are in the result
            expect(Object.keys(status)).toEqual(expect.arrayContaining(serversService.ALLOWED_SERVERS));
        });
    });

    describe('isValidServer', () => {
        it('should return true for valid server names', () => {
            expect(serversService.isValidServer('mc-ilias')).toBe(true);
            expect(serversService.isValidServer('mc-niilo')).toBe(true);
            expect(serversService.isValidServer('mc-bgstpoelten')).toBe(true);
            expect(serversService.isValidServer('mc-htlstp')).toBe(true);
            expect(serversService.isValidServer('mc-borgstpoelten')).toBe(true);
            expect(serversService.isValidServer('mc-hakstpoelten')).toBe(true);
            expect(serversService.isValidServer('mc-basop-bafep-stp')).toBe(true);
            expect(serversService.isValidServer('mc-play')).toBe(true);
        });

        it('should return false for invalid server names', () => {
            expect(serversService.isValidServer('invalid-server')).toBe(false);
            expect(serversService.isValidServer('../etc/passwd')).toBe(false);
            expect(serversService.isValidServer('')).toBe(false);
            expect(serversService.isValidServer(null)).toBe(false);
        });
    });
});