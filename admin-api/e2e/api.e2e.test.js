const request = require('supertest');
const app = require('../server');

describe('servers API E2E tests', () => {
    beforeAll(() => {
        // Set up basic auth credentials for testing
        process.env.ADMIN_USER = 'testuser';
        process.env.ADMIN_PASS = 'testpass';
    });

    it('should get the status of a server with authentication', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        const res = await request(app)
            .get('/api/servers/status/mc-ilias')
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('server', 'mc-ilias');
    });

    it('should get the status of all servers with authentication', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        const res = await request(app)
            .get('/api/servers/status')
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('mc-ilias');
        expect(res.body).toHaveProperty('mc-niilo');
    });

    it('should reject requests without authentication', async () => {
        const res = await request(app).get('/api/servers/status/mc-ilias');
        expect(res.statusCode).toEqual(401);
    });

    it('should reject requests with invalid authentication', async () => {
        const credentials = Buffer.from('invaliduser:invalidpass').toString('base64');
        const res = await request(app)
            .get('/api/servers/status/mc-ilias')
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).toEqual(401);
    });

    it('should reject invalid server names for security', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        const res = await request(app)
            .get('/api/servers/status/../../../etc/passwd')  // Path traversal attempt
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).toEqual(500); // Should fail due to security validation
    });

    it('should allow valid server operations', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        
        // Test start server (would fail in test environment but should validate server name)
        let res = await request(app)
            .post('/api/servers/start/mc-ilias')
            .set('Authorization', `Basic ${credentials}`);
        
        // The server likely doesn't exist in test environment, but auth should work
        expect(res.statusCode).not.toEqual(401);
        
        // Test stop server
        res = await request(app)
            .post('/api/servers/stop/mc-ilias')
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).not.toEqual(401);
        
        // Test restart server
        res = await request(app)
            .post('/api/servers/restart/mc-ilias')
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).not.toEqual(401);
    });
});

describe('datapacks API E2E tests', () => {
    beforeAll(() => {
        // Set up basic auth credentials for testing
        process.env.ADMIN_USER = 'testuser';
        process.env.ADMIN_PASS = 'testpass';
    });

    it('should search for datapacks', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        const res = await request(app)
            .get('/api/datapacks/search')
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('datapacks');
        expect(Array.isArray(res.body.datapacks)).toBe(true);
    });

    it('should search for specific datapacks', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        const res = await request(app)
            .get('/api/datapacks/search?query=afk')
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('datapacks');
        expect(res.body.datapacks.length).toBeGreaterThan(0);
        expect(res.body.datapacks[0].name).toMatch(/afk/i);
    });

    it('should reject path traversal in server-specific endpoints', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        const res = await request(app)
            .get('/api/datapacks/../../../etc/passwd')  // Path traversal attempt
            .set('Authorization', `Basic ${credentials}`);
        
        // Should fail due to security validation
        expect(res.statusCode).toEqual(500);
    });

    it('should validate server names in datapack operations', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        
        // Test getting datapacks for valid server
        let res = await request(app)
            .get('/api/datapacks/mc-ilias')
            .set('Authorization', `Basic ${credentials}`);
        
        expect(res.statusCode).not.toEqual(401);
        
        // Test installing datapack to valid server
        res = await request(app)
            .post('/api/datapacks/install/mc-ilias')
            .set('Authorization', `Basic ${credentials}`)
            .send({ datapackName: 'afk display', version: '1.1.14' });
        
        expect(res.statusCode).not.toEqual(401);
        
        // Test uninstalling datapack from valid server
        res = await request(app)
            .post('/api/datapacks/uninstall/mc-ilias')
            .set('Authorization', `Basic ${credentials}`)
            .send({ datapackDir: 'test-datapack' });
        
        expect(res.statusCode).not.toEqual(401);
    });
});

describe('Security tests', () => {
    it('should require authentication for all API endpoints', async () => {
        // Test various endpoints without auth
        const endpoints = [
            '/api/servers/status',
            '/api/servers/status/mc-ilias',
            '/api/servers/start/mc-ilias',
            '/api/servers/stop/mc-ilias',
            '/api/datapacks/search',
            '/api/datapacks/mc-ilias',
        ];

        for (const endpoint of endpoints) {
            const res = await request(app).get(endpoint.startsWith('/api/servers/start') || 
                                              endpoint.startsWith('/api/servers/stop') ||
                                              endpoint.startsWith('/api/datapacks/uninstall') ||
                                              endpoint.startsWith('/api/datapacks/install') 
                                              ? endpoint.replace('get', 'post') 
                                              : endpoint);
            
            expect(res.statusCode).toEqual(401);
        }
    });

    it('should reject invalid server names across all endpoints', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        
        const endpointsAndMethods = [
            { method: 'get', path: '/api/servers/status/../../../etc/passwd' },
            { method: 'post', path: '/api/servers/start/../../../etc/passwd' },
            { method: 'post', path: '/api/servers/stop/../../../etc/passwd' },
            { method: 'post', path: '/api/servers/restart/../../../etc/passwd' },
            { method: 'get', path: '/api/datapacks/../../../etc/passwd' },
            { method: 'post', path: '/api/datapacks/install/../../../etc/passwd' },
            { method: 'post', path: '/api/datapacks/uninstall/../../../etc/passwd' },
        ];

        for (const { method, path } of endpointsAndMethods) {
            let res;
            if (method === 'get') {
                res = await request(app)
                    .get(path)
                    .set('Authorization', `Basic ${credentials}`);
            } else {
                res = await request(app)
                    .post(path)
                    .set('Authorization', `Basic ${credentials}`)
                    .send({});// Send empty body for post requests
            }
            
            // Should fail with 500 due to validation error, or 404 for non-existent server
            expect(res.statusCode).not.toEqual(200);
        }
    });
});