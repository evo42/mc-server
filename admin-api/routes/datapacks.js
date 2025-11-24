const express = require('express');
const router = express.Router();
const datapacksController = require('../controllers/datapacksController');

// Specific routes first
router.get('/search', datapacksController.searchDatapacks);

// General routes last
router.get('/:server', datapacksController.getDatapacks);
router.post('/install/:server', datapacksController.installDatapack);
router.post('/uninstall/:server', datapacksController.uninstallDatapack);

module.exports = router;
