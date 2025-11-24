const request = require('supertest');
const express = require('express');
const app = require('../server');
const serversService = require('../services/serversService');

// Mock the serversService to avoid actual Docker calls during testing
jest.mock('../services/serversService', () => ({
    startServer: jest.fn(),
    stopServer: jest.fn(),
    restartServer: jest.fn(),
    getServerStatus: jest.fn(),
    getAllServerStatus: jest.fn(),
    isValidServer: jest.fn()
}));

describe('Servers API Integration Tests', () => {
    beforeAll(() => {
        // Set up authentication credentials
        process.env.ADMIN_USER = 'testuser';
        process.env.ADMIN_PASS = 'testpass';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/servers/start/:server', () => {
        it('should start a server successfully', async () => {
            serversService.startServer.mockResolvedValue();
            serversService.isValidServer.mockReturnValue(true);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .post('/api/servers/start/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({ success: true, message: 'mc-ilias started' });
            expect(serversService.startServer).toHaveBeenCalledWith('mc-ilias');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/servers/start/mc-ilias')
                .set('Authorization', 'Basic dXNlcjpwYXNz') // user:pass
                .expect(401);

            expect(response.body).toEqual({});
        });

        it('should return 500 for server start failure', async () => {
            serversService.startServer.mockRejectedValue(new Error('Failed to start'));
            serversService.isValidServer.mockReturnValue(true);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .post('/api/servers/start/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(500);

            expect(response.body).toEqual({
                error: 'Failed to start server',
                details: 'Failed to start'
            });
        });
    });

    describe('POST /api/servers/stop/:server', () => {
        it('should stop a server successfully', async () => {
            serversService.stopServer.mockResolvedValue();
            serversService.isValidServer.mockReturnValue(true);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .post('/api/servers/stop/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({ success: true, message: 'mc-ilias stopped' });
            expect(serversService.stopServer).toHaveBeenCalledWith('mc-ilias');
        });
    });

    describe('POST /api/servers/restart/:server', () => {
        it('should restart a server successfully', async () => {
            serversService.restartServer.mockResolvedValue();
            serversService.isValidServer.mockReturnValue(true);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .post('/api/servers/restart/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({ success: true, message: 'mc-ilias restarted' });
            expect(serversService.restartServer).toHaveBeenCalledWith('mc-ilias');
        });
    });

    describe('GET /api/servers/status/:server', () => {
        it('should get server status successfully', async () => {
            const mockStatus = {
                server: 'mc-ilias',
                status: 'running',
                rawStatus: { Status: 'running' },
                players: [],
                playerCount: 0,
                memory: '100.00MB',
                cpu: '10.00%'
            };
            
            serversService.getServerStatus.mockResolvedValue(mockStatus);
            serversService.isValidServer.mockReturnValue(true);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .get('/api/servers/status/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual(mockStatus);
            expect(serversService.getServerStatus).toHaveBeenCalledWith('mc-ilias');
        });

        it('should return 500 for server status failure', async () => {
            serversService.getServerStatus.mockRejectedValue(new Error('Status error'));
            serversService.isValidServer.mockReturnValue(true);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .get('/api/servers/status/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(500);

            expect(response.body).toEqual({
                error: 'Failed to get server status',
                details: 'Status error'
            });
        });
    });

    describe('GET /api/servers/status', () => {
        it('should get all server statuses successfully', async () => {
            const mockAllStatus = {
                'mc-ilias': { server: 'mc-ilias', status: 'running' },
                'mc-niilo': { server: 'mc-niilo', status: 'stopped' }
            };
            
            serversService.getAllServerStatus.mockResolvedValue(mockAllStatus);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .get('/api/servers/status')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual(mockAllStatus);
            expect(serversService.getAllServerStatus).toHaveBeenCalled();
        });
    });
});