const serversService = require('../services/serversService');
const Docker = require('dockerode');

jest.mock('dockerode');

describe('serversService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should start a server', async () => {
        const container = {
            start: jest.fn(),
        };
        Docker.prototype.getContainer = jest.fn().mockReturnValue(container);
        await serversService.startServer('mc-ilias');
        expect(container.start).toHaveBeenCalled();
    });

    it('should stop a server', async () => {
        const container = {
            stop: jest.fn(),
        };
        Docker.prototype.getContainer = jest.fn().mockReturnValue(container);
        await serversService.stopServer('mc-ilias');
        expect(container.stop).toHaveBeenCalled();
    });

    it('should restart a server', async () => {
        const container = {
            restart: jest.fn(),
        };
        Docker.prototype.getContainer = jest.fn().mockReturnValue(container);
        await serversService.restartServer('mc-ilias');
        expect(container.restart).toHaveBeenCalled();
    });
});
