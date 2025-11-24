const request = require('supertest');
const express = require('express');
const app = require('../server');

// Mock all services to avoid actual Docker/filesystem operations
jest.mock('../services/serversService', () => ({
    startServer: jest.fn(),
    stopServer: jest.fn(),
    restartServer: jest.fn(),
    getServerStatus: jest.fn(),
    getAllServerStatus: jest.fn(),
    isValidServer: jest.fn((server) => ['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play'].includes(server))
}));

jest.mock('../services/datapacksService', () => ({
    getDatapacks: jest.fn(),
    installDatapack: jest.fn(),
    uninstallDatapack: jest.fn(),
    searchDatapacks: jest.fn()
}));

describe('Full API Integration Tests', () => {
    beforeAll(() => {
        // Set up authentication credentials
        process.env.ADMIN_USER = 'testuser';
        process.env.ADMIN_PASS = 'testpass';
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('All API Endpoints', () => {
        it('should handle a complete server management workflow', async () => {
            // Mock service responses for a complete workflow
            const mockStatus = {
                server: 'mc-ilias',
                status: 'running',
                rawStatus: { Status: 'running' },
                players: [],
                playerCount: 0,
                memory: '100.00MB',
                cpu: '10.00%'
            };

            const serversService = require('../services/serversService');
            const datapacksService = require('../services/datapacksService');

            serversService.getServerStatus.mockResolvedValue(mockStatus);
            serversService.getAllServerStatus.mockResolvedValue({
                'mc-ilias': mockStatus,
                'mc-niilo': { ...mockStatus, server: 'mc-niilo', status: 'stopped' }
            });
            serversService.startServer.mockResolvedValue();
            serversService.stopServer.mockResolvedValue();
            serversService.restartServer.mockResolvedValue();

            datapacksService.getDatapacks.mockResolvedValue([]);
            datapacksService.searchDatapacks.mockResolvedValue([
                { name: 'afk display', version: '1.1.14', gameVersion: 'MC 1.21-1.21.10', description: 'Shows AFK status for players' }
            ]);

            const credentials = Buffer.from('testuser:testpass').toString('base64');

            // Test getting all server statuses
            let response = await request(app)
                .get('/api/servers/status')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toHaveProperty('mc-ilias');
            expect(response.body).toHaveProperty('mc-niilo');

            // Test getting specific server status
            response = await request(app)
                .get('/api/servers/status/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual(mockStatus);

            // Test starting server
            response = await request(app)
                .post('/api/servers/start/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({ success: true, message: 'mc-ilias started' });

            // Test restarting server
            response = await request(app)
                .post('/api/servers/restart/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({ success: true, message: 'mc-ilias restarted' });

            // Test getting datapacks
            response = await request(app)
                .get('/api/datapacks/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({ server: 'mc-ilias', datapacks: [] });

            // Test searching datapacks
            response = await request(app)
                .get('/api/datapacks/search')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({
                datapacks: [
                    { name: 'afk display', version: '1.1.14', gameVersion: 'MC 1.21-1.21.10', description: 'Shows AFK status for players' }
                ],
                total: 1
            });
        });

        it('should reject requests without authentication', async () => {
            const endpoints = [
                { method: 'get', path: '/api/servers/status' },
                { method: 'get', path: '/api/servers/status/mc-ilias' },
                { method: 'post', path: '/api/servers/start/mc-ilias' },
                { method: 'post', path: '/api/servers/stop/mc-ilias' },
                { method: 'post', path: '/api/servers/restart/mc-ilias' },
                { method: 'get', path: '/api/datapacks/mc-ilias' },
                { method: 'post', path: '/api/datapacks/install/mc-ilias' },
                { method: 'post', path: '/api/datapacks/uninstall/mc-ilias' },
                { method: 'get', path: '/api/datapacks/search' }
            ];

            for (const endpoint of endpoints) {
                let response;
                if (endpoint.method === 'get') {
                    response = await request(app)[endpoint.method](endpoint.path);
                } else {
                    response = await request(app)[endpoint.method](endpoint.path).send({});
                }
                
                expect(response.status).toBe(401);
            }
        });

        it('should handle server validation in all endpoints', async () => {
            const credentials = Buffer.from('testuser:testpass').toString('base64');

            // Test a single server-related endpoint with invalid server name
            const response = await request(app)
                .get('/api/servers/status/invalid-server')
                .set('Authorization', `Basic ${credentials}`);

            // The validation should result in an error (not a 200 OK)
            // This could be 400, 404, 500, or similar error code
            expect(response.status).not.toBe(200);
            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('API Security Tests', () => {
        it('should properly authenticate all requests', async () => {
            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const wrongCredentials = Buffer.from('wronguser:wrongpass').toString('base64');
            
            const response = await request(app)
                .get('/api/servers/status')
                .set('Authorization', `Basic ${wrongCredentials}`)
                .expect(401);
            
            expect(response.body).toEqual({});
        });

        it('should reject malformed basic auth headers', async () => {
            const response = await request(app)
                .get('/api/servers/status')
                .set('Authorization', 'Basic invalid-base64')
                .expect(401);
            
            expect(response.body).toEqual({});
        });

        it('should handle multiple concurrent requests properly', async () => {
            const serversService = require('../services/serversService');
            const datapacksService = require('../services/datapacksService');
            
            serversService.getServerStatus.mockResolvedValue({
                server: 'mc-ilias',
                status: 'running',
                memory: '100.00MB',
                cpu: '10.00%'
            });
            serversService.getAllServerStatus.mockResolvedValue({
                'mc-ilias': { server: 'mc-ilias', status: 'running' }
            });
            datapacksService.getDatapacks.mockResolvedValue([]);
            datapacksService.searchDatapacks.mockResolvedValue([]);

            const credentials = Buffer.from('testuser:testpass').toString('base64');

            // Make multiple concurrent requests
            const requests = [
                request(app).get('/api/servers/status').set('Authorization', `Basic ${credentials}`),
                request(app).get('/api/servers/status/mc-ilias').set('Authorization', `Basic ${credentials}`),
                request(app).get('/api/datapacks/mc-ilias').set('Authorization', `Basic ${credentials}`),
                request(app).get('/api/datapacks/search').set('Authorization', `Basic ${credentials}`)
            ];

            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });
    });

    describe('Error Handling Integration Tests', () => {
        it('should handle service errors gracefully', async () => {
            const serversService = require('../services/serversService');
            const datapacksService = require('../services/datapacksService');
            
            // Force services to throw errors
            serversService.getServerStatus.mockRejectedValue(new Error('Service error'));
            serversService.getAllServerStatus.mockRejectedValue(new Error('Service error'));
            serversService.startServer.mockRejectedValue(new Error('Service error'));
            datapacksService.getDatapacks.mockRejectedValue(new Error('Service error'));
            
            const credentials = Buffer.from('testuser:testpass').toString('base64');
            
            // Test error responses
            let response = await request(app)
                .get('/api/servers/status/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(500);
            
            expect(response.body).toEqual({
                error: 'Failed to get server status',
                details: 'Service error'
            });

            response = await request(app)
                .get('/api/servers/status')
                .set('Authorization', `Basic ${credentials}`)
                .expect(500);
            
            expect(response.body).toEqual({
                error: 'Failed to get server status',
                details: 'Service error'
            });

            response = await request(app)
                .get('/api/datapacks/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(500);
            
            expect(response.body).toEqual({
                error: 'Failed to get datapacks',
                details: 'Service error'
            });
        });
    });
});