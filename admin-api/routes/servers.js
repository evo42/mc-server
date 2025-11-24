const express = require('express');
const router = express.Router();
const serversController = require('../controllers/serversController');

router.post('/start/:server', serversController.startServer);
router.post('/stop/:server', serversController.stopServer);
router.post('/restart/:server', serversController.restartServer);
router.get('/status/:server', serversController.getServerStatus);
router.get('/status', serversController.getAllServerStatus);

module.exports = router;
