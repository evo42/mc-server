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

describe('serversService', () => {
    beforeEach(() => {
        // Reset mock calls before each test
        jest.clearAllMocks();
    });

    it('should start a server', async () => {
        await serversService.startServer('mc-ilias');
        expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
        expect(mockContainer.start).toHaveBeenCalled();
    });

    it('should stop a server', async () => {
        await serversService.stopServer('mc-ilias');
        expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
        expect(mockContainer.stop).toHaveBeenCalled();
    });

    it('should restart a server', async () => {
        await serversService.restartServer('mc-ilias');
        expect(mockDocker.getContainer).toHaveBeenCalledWith('mc-ilias');
        expect(mockContainer.restart).toHaveBeenCalled();
    });
});
