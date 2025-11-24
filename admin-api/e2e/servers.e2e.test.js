process.env.ADMIN_USER = 'testuser';
process.env.ADMIN_PASS = 'testpass';

const request = require('supertest');
const app = require('../server');

describe('servers API', () => {
    it('should get the status of a server', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        const res = await request(app)
            .get('/api/servers/status/mc-ilias')
            .set('Authorization', `Basic ${credentials}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('server', 'mc-ilias');
    });

    it('should get the status of all servers', async () => {
        const credentials = Buffer.from('testuser:testpass').toString('base64');
        const res = await request(app)
            .get('/api/servers/status')
            .set('Authorization', `Basic ${credentials}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('mc-ilias');
        expect(res.body).toHaveProperty('mc-niilo');
    }, 30000);
});
