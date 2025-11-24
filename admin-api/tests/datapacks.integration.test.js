const request = require('supertest');
const express = require('express');
const app = require('../server');
const datapacksService = require('../services/datapacksService');

// Mock the datapacksService to avoid actual filesystem operations during testing
jest.mock('../services/datapacksService', () => ({
    getDatapacks: jest.fn(),
    installDatapack: jest.fn(),
    uninstallDatapack: jest.fn(),
    searchDatapacks: jest.fn()
}));

describe('Datapacks API Integration Tests', () => {
    beforeAll(() => {
        // Set up authentication credentials
        process.env.ADMIN_USER = 'testuser';
        process.env.ADMIN_PASS = 'testpass';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/datapacks/:server', () => {
        it('should get datapacks for a server successfully', async () => {
            const mockDatapacks = [
                { name: 'test-datapack', version: '1.0.0', gameVersion: 'MC 1.21', directory: 'test-datapack v1.0.0 (MC 1.21)' }
            ];
            
            datapacksService.getDatapacks.mockResolvedValue(mockDatapacks);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .get('/api/datapacks/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({
                server: 'mc-ilias',
                datapacks: mockDatapacks
            });
            expect(datapacksService.getDatapacks).toHaveBeenCalledWith('mc-ilias');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .get('/api/datapacks/mc-ilias')
                .set('Authorization', 'Basic dXNlcjpwYXNz') // user:pass
                .expect(401);

            expect(response.body).toEqual({});
        });

        it('should return 500 for datapack retrieval failure', async () => {
            datapacksService.getDatapacks.mockRejectedValue(new Error('Retrieval error'));

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .get('/api/datapacks/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .expect(500);

            expect(response.body).toEqual({
                error: 'Failed to get datapacks',
                details: 'Retrieval error'
            });
        });
    });

    describe('POST /api/datapacks/install/:server', () => {
        it('should install a datapack successfully', async () => {
            datapacksService.installDatapack.mockResolvedValue();

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .post('/api/datapacks/install/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .send({ datapackName: 'afk display', version: '1.1.14' })
                .expect(200);

            expect(response.body).toEqual({ 
                success: true, 
                message: 'Successfully installed afk display v1.1.14 to mc-ilias' 
            });
            expect(datapacksService.installDatapack).toHaveBeenCalledWith('mc-ilias', 'afk display', '1.1.14');
        });

        it('should return 500 for datapack installation failure', async () => {
            datapacksService.installDatapack.mockRejectedValue(new Error('Installation error'));

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .post('/api/datapacks/install/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .send({ datapackName: 'afk display', version: '1.1.14' })
                .expect(500);

            expect(response.body).toEqual({
                error: 'Failed to install datapack',
                details: 'Installation error'
            });
        });
    });

    describe('POST /api/datapacks/uninstall/:server', () => {
        it('should uninstall a datapack successfully', async () => {
            datapacksService.uninstallDatapack.mockResolvedValue();

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .post('/api/datapacks/uninstall/mc-ilias')
                .set('Authorization', `Basic ${credentials}`)
                .send({ datapackDir: 'test-datapack v1.0.0 (MC 1.21)' })
                .expect(200);

            expect(response.body).toEqual({ 
                success: true, 
                message: 'Successfully uninstalled test-datapack v1.0.0 (MC 1.21) from mc-ilias' 
            });
            expect(datapacksService.uninstallDatapack).toHaveBeenCalledWith('mc-ilias', 'test-datapack v1.0.0 (MC 1.21)');
        });
    });

    describe('GET /api/datapacks/search', () => {
        it('should search for datapacks successfully', async () => {
            const mockSearchResults = [
                { name: 'afk display', version: '1.1.14', gameVersion: 'MC 1.21-1.21.10', description: 'Shows AFK status for players' }
            ];
            
            datapacksService.searchDatapacks.mockResolvedValue(mockSearchResults);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .get('/api/datapacks/search')
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({
                datapacks: mockSearchResults,
                total: 1
            });
            expect(datapacksService.searchDatapacks).toHaveBeenCalledWith(undefined);
        });

        it('should search for datapacks with query successfully', async () => {
            const mockSearchResults = [
                { name: 'afk display', version: '1.1.14', gameVersion: 'MC 1.21-1.21.10', description: 'Shows AFK status for players' }
            ];
            
            datapacksService.searchDatapacks.mockResolvedValue(mockSearchResults);

            const credentials = Buffer.from('testuser:testpass').toString('base64');
            const response = await request(app)
                .get('/api/datapacks/search')
                .query({ query: 'afk' })
                .set('Authorization', `Basic ${credentials}`)
                .expect(200);

            expect(response.body).toEqual({
                datapacks: mockSearchResults,
                total: 1
            });
            expect(datapacksService.searchDatapacks).toHaveBeenCalledWith('afk');
        });
    });
});