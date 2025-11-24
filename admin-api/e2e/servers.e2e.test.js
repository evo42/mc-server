const request = require('supertest');
const app = require('../server');

describe('servers API', () => {
    it('should get the status of a server', async () => {
        const res = await request(app).get('/api/servers/status/mc-ilias');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('server', 'mc-ilias');
    });

    it('should get the status of all servers', async () => {
        const res = await request(app).get('/api/servers/status');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('mc-ilias');
        expect(res.body).toHaveProperty('mc-niilo');
    });
});
